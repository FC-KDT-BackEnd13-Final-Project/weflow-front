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

/* =========================
   role 옵션 
========================= */

const roleOptions = [
  { value: "SYSTEM_ADMIN", label: "시스템 관리자" },
  { value: "CLIENT", label: "고객사" },
  { value: "AGENCY", label: "개발사" },
];

/* =========================
   컴포넌트
========================= */

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    role: "",
    email: "",
  });

  const [formData, setFormData] = useState(profile);

  /* =========================
     데이터 로딩
  ========================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await authApi.getMe();
        if (!userRes.success) throw new Error();

        const initialProfile = {
          name: userRes.data.name,
          phone: userRes.data.phoneNumber,
          role: userRes.data.role, // 🔥 그대로 사용
          email: userRes.data.email,
        };

        setUserData(userRes.data);
        setProfile(initialProfile);
        setFormData(initialProfile);

        try {
          const companyRes = await companiesApi.getMyCompany();
          if (companyRes.success) {
            setCompanyData(companyRes.data);
          }
        } catch {
          // 회사 정보 없을 수 있음
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "정보 조회 실패",
          description:
            error.response?.data?.message ||
            "사용자 정보를 불러올 수 없습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  /* =========================
     핸들러
  ========================= */

  const handleChange =
    (field: "name" | "phone") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setIsDirty(true);
    };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await authApi.updateMe({
        name: formData.name,
        phoneNumber: formData.phone,
      });

      if (res.success) {
        const updated = {
          name: res.data.name,
          phone: res.data.phoneNumber,
          role: formData.role, // 그대로 유지
          email: res.data.email,
        };

        setProfile(updated);
        setFormData(updated);
        setUserData((prev: any) => ({
          ...prev,
          name: res.data.name,
          phoneNumber: res.data.phoneNumber,
        }));

        toast({ title: "회원 정보가 저장되었습니다." });
        setIsDirty(false);
        setIsEditing(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 정보 수정 실패",
        description:
          error.response?.data?.message ||
          "정보 수정에 실패했습니다.",
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

  /* =========================
     렌더
  ========================= */

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            설정
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            회원 정보를 확인하고 필요한 내용을 수정하세요.
          </p>
        </div>

        {/* ================= 회원 정보 ================= */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>회원 정보</CardTitle>
            {!isEditing && !isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(profile);
                  setIsEditing(true);
                  setIsDirty(false);
                }}
              >
                수정
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                회원 정보를 불러오는 중입니다…
              </div>
            ) : isEditing ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input
                      value={formData.name}
                      onChange={handleChange("name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>연락처</Label>
                    <Input
                      value={formData.phone}
                      onChange={handleChange("phone")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>역할</Label>
                    <Select
                      value={formData.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem
                            key={r.value}
                            value={r.value}
                          >
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input value={formData.email} readOnly />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isDirty || isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    이름
                  </p>
                  <p className="font-medium mt-1">
                    {profile.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    연락처
                  </p>
                  <p className="font-medium mt-1">
                    {profile.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    역할
                  </p>
                  <p className="font-medium mt-1">
                    {profile.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    이메일
                  </p>
                  <p className="font-medium mt-1">
                    {profile.email}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================= 회사 정보 ================= */}
        <Card>
          <CardHeader>
            <CardTitle>회사 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <div className="md:col-span-2 text-sm text-muted-foreground">
                회사 정보를 불러오는 중입니다…
              </div>
            ) : companyData ? (
              <>
                <div>
                  <p className="text-muted-foreground">회사명</p>
                  <p className="font-medium mt-1">
                    {companyData.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    사업자번호
                  </p>
                  <p className="font-medium mt-1">
                    {companyData.businessNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    대표자
                  </p>
                  <p className="font-medium mt-1">
                    {companyData.representative}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    이메일
                  </p>
                  <p className="font-medium mt-1">
                    {companyData.email}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">
                    주소
                  </p>
                  <p className="font-medium mt-1">
                    {companyData.address}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    상태
                  </p>
                  <Badge className="mt-1">
                    {companyData.status}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 text-center text-muted-foreground">
                회사 정보를 확인할 수 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/settings/password")}
          >
            비밀번호 변경
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}