// src/pages/admin/AdminUserCreate.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createSystemAdmin } from "@/apis/systemAdmins";

const AdminUserCreate = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSystemAdmin({
        name,
        phoneNumber,
        email,
        password,
      });
      navigate("/admin/admin-users");
    } catch (err) {
      console.error("관리자 생성 실패:", err);
      alert("관리자 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 계정 생성</h1>
          <p className="text-muted-foreground mt-1">
            관리자 계정 {">"} 관리자 추가
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>관리자 정보</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>전화번호</Label>
                <Input
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>역할</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                SYSTEM_ADMIN
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/admin/admin-users")}
              >
                취소
              </Button>
              <Button type="submit">등록</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserCreate;
