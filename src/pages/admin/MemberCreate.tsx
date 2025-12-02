import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminMemberCreate = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("system");
  const [company, setCompany] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // CSV 미리보기 데이터 (실제로는 파일 파싱 후 표시)
  const csvPreview = [
    {
      name: "김민수",
      email: "minsu@devcorp.com",
      role: "개발 담당자",
      company: "DevCorp",
      status: "준비됨",
    },
    {
      name: "박지연",
      email: "jiyeon@clientA.com",
      role: "고객사 담당자",
      company: "ClientA",
      status: "준비됨",
    },
    {
      name: "관리자A",
      email: "admin@weflow.com",
      role: "시스템 관리자",
      company: "weflow",
      status: "준비됨",
    },
    {
      name: "이소라",
      email: "sora@clientA.com",
      role: "고객사 담당자",
      company: "ClientA",
      status: "이메일 중복",
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 생성</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 생성
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회원 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="w-full grid grid-cols-2 gap-2">
              <TabsTrigger value="individual" className="w-full">
                개별 회원 생성
              </TabsTrigger>
              <TabsTrigger value="bulk" className="w-full">
                + 일괄 생성
              </TabsTrigger>
            </TabsList>

            {/* 개별 생성 탭 */}
            <TabsContent value="individual" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" placeholder="이름 입력" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input id="phone" placeholder="전화번호 입력" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" placeholder="이메일 입력" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">소속 회사</Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devcorp">DevCorp</SelectItem>
                    <SelectItem value="clienta">ClientA</SelectItem>
                    <SelectItem value="weflow">weflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>역할</Label>
                <RadioGroup value={role} onValueChange={setRole}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="font-normal cursor-pointer">
                      시스템 관리자
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="developer" id="developer" />
                    <Label htmlFor="developer" className="font-normal cursor-pointer">
                      개발사 담당자
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="font-normal cursor-pointer">
                      고객사 담당자
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">초기 비밀번호</Label>
                <Input
                  id="password"
                  value="company1234@ 등 원하는 Pw"
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/members")}
                >
                  취소
                </Button>
                <Button>등록</Button>
              </div>
            </TabsContent>

            {/* 일괄 생성 탭 */}
            <TabsContent value="bulk" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Label>일괄 생성</Label>
                
                {!csvFile ? (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center bg-muted/30">
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          여기에 csv 파일을 드래그하거나 클릭하여 업로드 해주세요.
                        </p>
                        <label htmlFor="csv-upload">
                          <Button variant="secondary" asChild>
                            <span>파일 업로드</span>
                          </Button>
                        </label>
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">📎 회원 선정 양식.csv</span>
                    </div>
                  </div>
                )}
              </div>

              {csvFile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>미리보기</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted">
                        <div className="grid grid-cols-5 gap-4 p-3 text-sm font-medium">
                          <div>이름</div>
                          <div>이메일</div>
                          <div>역할</div>
                          <div>소속 회사</div>
                          <div>처리결과</div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {csvPreview.map((row, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-5 gap-4 p-3 text-sm"
                          >
                            <div>{row.name}</div>
                            <div className="text-muted-foreground">{row.email}</div>
                            <div>{row.role}</div>
                            <div>{row.company}</div>
                            <div>
                              <Badge
                                variant={
                                  row.status === "준비됨" ? "secondary" : "destructive"
                                }
                              >
                                {row.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                    <p>※ 초기 비밀번호는 모든 계정에 동일하게 적용됩니다.</p>
                    <p>※ CSV 내 역할과 회사 정보가 없으면 생성 실패로 표시됩니다.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/members")}
                >
                  취소
                </Button>
                <Button disabled={!csvFile}>등록</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMemberCreate;
