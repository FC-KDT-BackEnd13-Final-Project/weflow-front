import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const userInfoResponse = {
  success: true,
  message: "USER_INFO_FETCHED",
  data: {
    id: 12,
    email: "user@example.com",
    name: "홍길동",
    phone: "010-1234-5678",
    role: "CLIENT",
    companyId: 2,
    companyName: "ABC전자",
    status: "ACTIVE",
    lastLoginAt: "2025-02-01T10:10:00",
    createdAt: "2025-01-10T12:00:00",
  },
};

const roleOptions = [
  { value: "CLIENT", label: "고객" },
  { value: "ADMIN", label: "관리자" },
  { value: "PM", label: "PM" },
  { value: "DEVELOPER", label: "개발자" },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default function Settings() {
  const { data } = userInfoResponse;
  const { toast } = useToast();
  const navigate = useNavigate();
  const initialProfile = {
    name: data.name,
    phone: data.phone,
    role: data.role,
    email: data.email,
  };
  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: "name" | "phone") => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setIsDirty(true);
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setIsDirty(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setProfile(formData);
    toast({
      title: "회원 정보가 저장되었습니다.",
      description: `${formData.name}님의 정보가 업데이트되었습니다.`,
    });
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleReset = () => {
    setFormData(profile);
    setIsDirty(false);
    setIsEditing(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">설정</h1>
          <p className="text-sm text-muted-foreground mt-1">
            회원 정보를 확인하고 필요한 내용을 수정하세요.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>회원 정보</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => {
                setFormData(profile);
                setIsDirty(false);
                setIsEditing(true);
              }}>
                수정
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange("name")}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>역할</Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="역할을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input id="email" type="email" value={formData.email} readOnly />
                    <p className="text-xs text-muted-foreground">
                      로그인 이메일은 관리자에게 요청하여 변경할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    취소
                  </Button>
                  <Button type="submit" disabled={!isDirty}>
                    저장
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="text-base font-medium mt-1">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="text-base font-medium mt-1">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">역할</p>
                  <p className="text-base font-medium mt-1">
                    {roleOptions.find((role) => role.value === profile.role)?.label ?? profile.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="text-base font-medium mt-1">{profile.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>계정 정보</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings/password")}>
              비밀번호 변경
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">상태</p>
              <Badge className="mt-1">{data.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">회사</p>
              <p className="font-medium mt-1">{data.companyName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">최근 접속</p>
              <p className="font-medium mt-1">{formatDateTime(data.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">가입일</p>
              <p className="font-medium mt-1">{formatDateTime(data.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
