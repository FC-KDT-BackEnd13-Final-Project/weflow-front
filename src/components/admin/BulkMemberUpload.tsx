import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/apis/admin";

interface ParsedUser {
  name: string;
  phone: string;
  email: string;
  status: string;
}

const BulkMemberUpload = () => {
  const { toast } = useToast();

  // 선택한 CSV 파일
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // 파싱된 리스트
  const [parsedData, setParsedData] = useState<ParsedUser[]>([]);

  // CSV 전체에 적용되는 공통 값
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  // 회사 목록
  const [companies, setCompanies] = useState<any[]>([]);

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0); // 현재 진행 상황 (명)

  // 스크롤 Ref
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await adminApi.getCompanies(0, 9999, "", "ACTIVE");
        if (response.success) {
          setCompanies(response.data.content);
        }
      } catch (error) {
        console.error("회사 목록 로딩 실패:", error);
      }
    };
    fetchCompanies();
  }, []);

  // Auto-fill role based on selected company type
  useEffect(() => {
    if (company && companies.length > 0) {
      const selectedCompany = companies.find((c) => c.id.toString() === company);
      if (selectedCompany && selectedCompany.companyType) {
        setRole(selectedCompany.companyType);
      }
    }
  }, [company, companies]);

  // 파일 처리 공통 함수
  const processFile = (file: File) => {
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as any[];

        if (rows.length > 1000) {
          toast({
            title: "파일 크기 초과",
            description: "한 번에 최대 1000명까지만 등록할 수 있습니다.",
            variant: "destructive",
          });
          setCsvFile(null);
          return;
        }

        // 1. 이메일 목록 추출 (유효한 이메일만)
        const emailsToCheck = rows
          .map((row) => row["이메일"])
          .filter((email) => email && email.trim() !== "");

        let duplicates: string[] = [];
        if (emailsToCheck.length > 0) {
          try {
            duplicates = await adminApi.checkDuplicateEmails(emailsToCheck);
          } catch (error) {
            console.error("이메일 중복 체크 실패:", error);
            toast({
              title: "중복 체크 실패",
              description: "서버 연결 상태를 확인해주세요.",
              variant: "destructive",
            });
          }
        }

        const formatted = rows.map((row) => {
          const email = row["이메일"] || "";
          const name = row["이름"] || "";
          let status = "";

          if (!name || !email) {
            status = "누락된 필드 있음";
          } else if (duplicates.includes(email)) {
            status = "이미 가입된 이메일";
          } else {
            status = "준비됨";
          }

          return {
            name: name,
            phone: row["전화번호"] || "",
            email: email,
            status: status,
          };
        });

        setParsedData(formatted);
      },
    });
  };

  // CSV 업로드 핸들러 (Input)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    processFile(e.target.files[0]);
  };

  // 드래그 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({ title: "CSV 파일만 업로드 가능합니다.", variant: "destructive" });
        return;
      }
      processFile(file);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setCsvFile(null);
    setParsedData([]);
    setCompany("");
    setRole("");
    setPassword("");
    toast({
      title: "취소되었습니다",
      description: "입력한 내용이 모두 초기화되었습니다.",
    });
  };

  // 최종 등록 API 호출 (Chunk 분할 전송)
  const handleRegister = async () => {
    const invalid = parsedData.some((u) => u.status !== "준비됨");

    if (!company)
      return toast({ title: "회사를 선택하세요.", variant: "destructive" });

    if (!password || password.trim().length === 0)
      return toast({ title: "임시 비밀번호를 입력하세요.", variant: "destructive" });

    if (invalid)
      return toast({ title: "입력 오류가 있는 행이 있습니다.", variant: "destructive" });

    if (!csvFile || parsedData.length === 0)
      return toast({ title: "CSV 파일을 업로드하세요.", variant: "destructive" });

    setIsLoading(true);
    setCurrentProgress(0);

    let totalSuccess = 0;
    let totalFailure = 0;
    const allFailures: any[] = [];
    const BATCH_SIZE = 100; // 100명씩 분할 전송

    try {
      for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
        const chunk = parsedData.slice(i, i + BATCH_SIZE);
        
        // Chunk를 다시 CSV 포맷으로 변환
        // (API가 File 객체를 요구하므로 CSV string -> File 변환 필요)
        // Papa.unparse는 배열 데이터를 CSV 문자열로 바꿔줍니다.
        const csvContent = Papa.unparse(chunk.map(user => ({
          "이름": user.name,
          "이메일": user.email,
          "전화번호": user.phone
        })));
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const chunkFile = new File([blob], `chunk_${i}.csv`, { type: "text/csv" });

        // API 호출
        const response = await adminApi.createUsersBatchFromCsv(
          chunkFile,
          Number(company),
          password
        );

        if (response.success) {
          totalSuccess += response.data.successCount;
          totalFailure += response.data.failureCount;
          if (response.data.failures && response.data.failures.length > 0) {
            allFailures.push(...response.data.failures);
          }
        }
        
        // 진행률 업데이트
        setCurrentProgress(Math.min(i + BATCH_SIZE, parsedData.length));
      }

      // 최종 결과 처리
      if (totalFailure > 0) {
        // Partial Success or Failure
        toast({
          title: `일괄 등록 결과`,
          description: `성공: ${totalSuccess}명, 실패: ${totalFailure}명`,
          variant: "default",
        });
        console.log("전체 실패 목록:", allFailures);
      } else {
        // Full Success
        toast({
          title: "일괄 등록 완료",
          description: `${totalSuccess}명의 회원이 모두 등록되었습니다.`, 
        });
      }

      // 성공 후 초기화
      setCsvFile(null);
      setParsedData([]);
      setPassword("");

    } catch (error: any) {
      console.error("일괄 등록 중단:", error);
      toast({
        title: "일괄 등록 중단",
        description: error.response?.data?.message || "처리 중 오류가 발생하여 중단되었습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentProgress(0);
    }
  };

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-foreground">회원 일괄 등록 중입니다...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {currentProgress} / {parsedData.length} 명 처리 중
          </p>
          <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(currentProgress / parsedData.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 회사 / 역할 공통 선택 */}
      <Card>
        <CardContent className="space-y-4 py-6">

          <div className="space-y-2">
            <Label>소속 회사</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger>
                <SelectValue placeholder="회사 선택" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                    {comp.companyType && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({comp.companyType === 'AGENCY' ? '에이전시' : '고객사'})
                      </span>
                    )}
                    {!comp.companyType && (
                      <span className="text-xs text-destructive ml-2">(유형 미설정)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>회원 종류</Label>
            <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {role === "AGENCY" ? "에이전시 담당자" : role === "CLIENT" ? "고객사 담당자" : "회사를 먼저 선택하세요"}
            </div>
            <p className="text-xs text-muted-foreground">
              ℹ️ 역할은 선택한 회사의 유형에 따라 자동으로 설정됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">임시 비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="전체 회원에게 적용될 임시 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ℹ️ 모든 회원에게 동일한 임시 비밀번호가 적용되며, 첫 로그인 시 변경해야 합니다.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* CSV 업로드 영역 */}
      <Card>
        <CardContent className="py-8">

          {!csvFile ? (
            <label
              htmlFor="csv-upload"
              className={`block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <div className="flex flex-col items-center gap-4">
                <Upload className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`text-sm ${isDragging ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {isDragging ? "파일을 여기에 놓으세요!" : "csv 파일을 업로드하세요."}
                </p>
                <Button variant={isDragging ? "default" : "secondary"} asChild>
                  <div>파일 업로드</div>
                </Button>
              </div>
            </label>
          ) : (
            <p className="text-sm">📎 {csvFile.name}</p>
          )}

        </CardContent>
      </Card>

      {/* CSV 미리보기 */}
      {parsedData.length > 0 && (
        <Card>
          <CardContent className="space-y-4 py-6">

            <Label>미리보기</Label>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                <div>이름</div>
                <div>전화번호</div>
                <div>이메일</div>
                <div>상태</div>
              </div>

              <div className="divide-y">
                {parsedData.map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 p-3 text-sm">
                    <div>{row.name}</div>
                    <div>{row.phone}</div>
                    <div className="text-muted-foreground">{row.email}</div>
                    <div>
                      <Badge
                        variant={row.status === "준비됨" ? "secondary" : "destructive"}
                      >
                        {row.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p>※ CSV 파일은 '이름, 이메일, 전화번호' 열이 필요합니다. (전화번호는 선택사항)</p>
              <p>※ 회원 종류와 소속 회사는 전체에 일괄 적용됩니다.</p>
              <p>※ 모든 회원에게 동일한 임시 비밀번호가 적용됩니다.</p>
              <p>※ 목록 중 이미 가입된 이메일이 하나라도 포함되어 있으면 일괄 등록을 진행할 수 없습니다.</p>
            </div>

          </CardContent>
        </Card>
      )}

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          취소
        </Button>
        <Button disabled={!csvFile} onClick={handleRegister}>
          일괄 등록
        </Button>
      </div>

      {/* 스크롤 타겟 */}
      <div ref={bottomRef} />

      {/* 맨 아래로 가기 버튼 (데이터가 많을 때만 표시) */}
      {parsedData.length > 20 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-20 right-8 rounded-full shadow-lg z-40 border hover:bg-muted"
            onClick={scrollToTop}
            title="맨 위로 스크롤"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-8 right-8 rounded-full shadow-lg z-40 border hover:bg-muted"
            onClick={scrollToBottom}
            title="맨 아래로 스크롤"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
};

export default BulkMemberUpload;
