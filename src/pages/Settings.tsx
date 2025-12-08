import { useState, useEffect } from "react";
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
import { authApi } from "@/apis/auth";
import { companiesApi } from "@/apis/companies";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    role: "",
    email: "",
  });
  const [formData, setFormData] = useState(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, companyResponse] = await Promise.all([
          authApi.getMe(),
          companiesApi.getMyCompany(),
        ]);

        if (userResponse.success) {
          setUserData(userResponse.data);
          const initialProfile = {
            name: userResponse.data.name,
            phone: userResponse.data.phoneNumber,
            role: userResponse.data.role,
            email: userResponse.data.email,
          };
          setProfile(initialProfile);
          setFormData(initialProfile);
        }

        if (companyResponse.success) {
          setCompanyData(companyResponse.data);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "정보 조회 실패",
          description: error.response?.data?.message || "정보를 불러올 수 없습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await authApi.updateMe({
        name: formData.name,
        phoneNumber: formData.phone,
      });

      if (response.success) {
        const updatedProfile = {
          name: response.data.name,
          phone: response.data.phoneNumber,
          role: formData.role,
          email: response.data.email,
        };
        setProfile(updatedProfile);
        setFormData(updatedProfile);

        setUserData((prev: any) => ({
          ...prev,
          name: response.data.name,
          phoneNumber: response.data.phoneNumber,
        }));

        toast({
          title: "회원 정보가 저장되었습니다.",
          description: response.message,
        });
        setIsDirty(false);
        setIsEditing(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 정보 수정 실패",
        description: error.response?.data?.message || "정보 수정에 실패했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(profile);
    setIsDirty(false);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </AppLayout>
    );
  }

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
                  <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
                    취소
                  </Button>
                  <Button type="submit" disabled={!isDirty || isSaving}>
                    {isSaving ? "저장 중..." : "저장"}
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
              <Badge className="mt-1">{userData.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">회사</p>
              <p className="font-medium mt-1">{userData.company?.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">사용자 ID</p>
              <p className="font-medium mt-1">{userData.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">회사 ID</p>
              <p className="font-medium mt-1">{userData.company?.id || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {companyData && (
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">회사명</p>
                <p className="font-medium mt-1">{companyData.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">사업자번호</p>
                <p className="font-medium mt-1">{companyData.businessNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">대표자</p>
                <p className="font-medium mt-1">{companyData.representative}</p>
              </div>
              <div>
                <p className="text-muted-foreground">이메일</p>
                <p className="font-medium mt-1">{companyData.email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">주소</p>
                <p className="font-medium mt-1">{companyData.address}</p>
              </div>
              <div>
                <p className="text-muted-foreground">상태</p>
                <Badge className="mt-1">{companyData.status}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
