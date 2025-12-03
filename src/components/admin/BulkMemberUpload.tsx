import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // CSV 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as any[];

        const formatted = rows.map((row) => ({
          name: row["이름"] || "",
          phone: row["전화번호"] || "",
          email: row["이메일"] || "",
          status:
            row["이름"] && row["이메일"] && row["전화번호"]
              ? "준비됨"
              : "누락된 필드 있음",
        }));

        setParsedData(formatted);
      },
    });
  };

  // 최종 등록 API 호출
  const handleRegister = () => {
    const invalid = parsedData.some((u) => u.status !== "준비됨");

    if (!company || !role)
      return toast({ title: "회사와 회원 종류를 선택하세요.", variant: "destructive" });

    if (invalid)
      return toast({ title: "입력 오류가 있는 행이 있습니다.", variant: "destructive" });

    // 서버 API 전송 로직
    toast({
      title: "일괄 등록 완료",
      description: `${parsedData.length}명의 회원이 등록되었습니다.`,
    });
  };

  return (
    <div className="space-y-6">
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
                <SelectItem value="DevCorp">DevCorp</SelectItem>
                <SelectItem value="ClientA">ClientA</SelectItem>
                <SelectItem value="weflow">weflow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>회원 종류</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="회원 종류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agency">개발사 담당자</SelectItem>
                <SelectItem value="client">고객사 담당자</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* CSV 업로드 영역 */}
      <Card>
        <CardContent className="py-8">

          {!csvFile ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center bg-muted/30 cursor-pointer">
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <label htmlFor="csv-upload" className="flex flex-col items-center gap-4 cursor-pointer">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">csv 파일을 업로드하세요.</p>
                <Button variant="secondary">파일 업로드</Button>
              </label>
            </div>
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
              <p>※ CSV 파일은 '이름, 전화번호, 이메일' 열이 필요합니다.</p>
              <p>※ 회원 종류와 소속 회사는 전체에 일괄 적용됩니다.</p>
            </div>

          </CardContent>
        </Card>
      )}

      {/* 버튼 */}
      <div className="flex justify-end">
        <Button disabled={!csvFile} onClick={handleRegister}>
          일괄 등록
        </Button>
      </div>
    </div>
  );
};

export default BulkMemberUpload;
