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
import BulkMemberUpload from "@/components/admin/BulkMemberUpload";

const AdminMemberCreate = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("system");
  const [company, setCompany] = useState("");

  return (
    <div className="space-y-6">
      
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 생성</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 생성
          </p>
        </div>
      </div>

      {/* 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>회원 생성</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            
            {/* 탭 버튼 */}
            <TabsList className="w-full grid grid-cols-2 gap-2">
              <TabsTrigger value="individual" className="w-full">
                개별 회원 생성
              </TabsTrigger>
              <TabsTrigger value="bulk" className="w-full">
                + 일괄 생성
              </TabsTrigger>
            </TabsList>

            {/* 개별 생성 */}
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

              {/* 회사 선택 */}
              <div className="space-y-2">
                <Label>소속 회사</Label>
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

              {/* 역할 선택 */}
              <div className="space-y-3">
                <Label>역할</Label>
                <RadioGroup value={role} onValueChange={setRole}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agency" id="agency" />
                    <Label htmlFor="agency" className="cursor-pointer">
                      개발사 담당자
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="cursor-pointer">
                      고객사 담당자
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 초기 비밀번호 노출 */}
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
                <Button variant="outline" onClick={() => navigate("/admin/members")}>
                  취소
                </Button>
                <Button>등록</Button>
              </div>
            </TabsContent>

            {/* 일괄 등록 탭 → BulkMemberUpload 컴포넌트 사용 */}
            <TabsContent value="bulk" className="mt-6">
              <BulkMemberUpload />
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMemberCreate;
