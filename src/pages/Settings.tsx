import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth";
import { companiesApi } from "@/apis/companies";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 유지

const roleOptions = [
  { value: "CLIENT", label: "고객사 담당자" },
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

// 설정 페이지 전체 스켈레톤 컴포넌트 정의 (제목/설명 부분 제외)
const SettingsSkeleton = () => (
  <AppLayout>
    <div className="space-y-6">
      {/* Header는 고정 텍스트로 남겨두고, 이 부분은 제외합니다. */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          회원 정보를 확인하고 필요한 내용을 수정하세요.
        </p>
      </div>

      {/* User Info Card Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Card Skeleton (옵션) */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ))}
          <div className="md:col-span-2 space-y-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);


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
    isEmailNotificationEnabled: false,
  });
  const [formData, setFormData] = useState(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 사용자 정보 조회 (필수)
        const userResponse = await authApi.getMe();
        if (userResponse.success) {
          setUserData(userResponse.data);
          const initialProfile = {
            name: userResponse.data.name,
            phone: userResponse.data.phoneNumber,
            role: userResponse.data.role,
            email: userResponse.data.email,
            isEmailNotificationEnabled: userResponse.data.isEmailNotificationEnabled ?? false,
          };
          setProfile(initialProfile);
          setFormData(initialProfile);

          // 2. 회사 정보 조회 (선택 - 실패해도 페이지는 표시)
          try {
            const companyResponse = await companiesApi.getMyCompany();
            if (companyResponse.success) {
              setCompanyData(companyResponse.data);
            }
          } catch (companyError) {
            console.log("회사 정보가 없거나 조회 실패:", companyError);
            // 회사 정보 조회 실패는 페이지 렌더링을 막지 않음
          }
        }
      } catch (error: any) {
        console.error("사용자 정보 조회 실패:", error);
        toast({
          variant: "destructive",
          title: "정보 조회 실패",
          description: error.response?.data?.message || "사용자 정보를 불러올 수 없습니다.",
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

  const handleEmailNotificationChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isEmailNotificationEnabled: checked }));
    setIsDirty(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await authApi.updateMe({
        name: formData.name,
        phoneNumber: formData.phone,
        isEmailNotificationEnabled: formData.isEmailNotificationEnabled,
      });

      if (response.success) {
        const updatedProfile = {
          name: response.data.name,
          phone: response.data.phoneNumber,
          role: formData.role,
          email: response.data.email,
          isEmailNotificationEnabled: response.data.isEmailNotificationEnabled,
        };
        setProfile(updatedProfile);
        setFormData(updatedProfile);

        setUserData((prev: any) => ({
          ...prev,
          name: response.data.name,
          phoneNumber: response.data.phoneNumber,
          isEmailNotificationEnabled: response.data.isEmailNotificationEnabled,
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
    // 로딩 중일 때 스켈레톤 표시 (헤더 텍스트는 SettingsSkeleton 내부에 포함되어 있으나, AppLayout 바깥에 정의된 경우를 고려하여 SettingsSkeleton을 호출)
    return <SettingsSkeleton />;
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
        {/* 요청에 따라 이 부분은 고정된 텍스트로 즉시 렌더링됩니다. */}
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
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="010-0000-0000"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>역할</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {roleOptions.find((role) => role.value === formData.role)?.label ?? formData.role}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ℹ️ 역할은 변경할 수 없습니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {formData.email}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ℹ️ 로그인 이메일 변경은 관리자에게 문의하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notification" className="text-base">
                      중요 알림 이메일 수신
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      승인 요청, 비밀번호 변경 등 중요한 알림을 이메일로 받습니다.
                    </p>
                  </div>
                  <Switch
                    id="email-notification"
                    checked={formData.isEmailNotificationEnabled}
                    onCheckedChange={handleEmailNotificationChange}
                    disabled={isSaving}
                  />
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
              <div className="space-y-4">
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
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">중요 알림 이메일 수신</p>
                    <Badge variant={profile.isEmailNotificationEnabled ? "default" : "secondary"}>
                      {profile.isEmailNotificationEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => navigate("/settings/password")}>
                    비밀번호 변경
                  </Button>
                </div>
              </div>
            )}
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