import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth";

interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const [formData, setFormData] = useState<PasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (field: keyof PasswordPayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "비밀번호 불일치",
        description: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
      });
      return;
    }

    // 비밀번호 형식 검증 (백엔드 정책과 동일)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast({
        variant: "destructive",
        title: "비밀번호 형식 오류",
        description: "비밀번호는 8자 이상, 영문+숫자 조합이어야 합니다. (특수문자 사용 불가)",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirm: formData.confirmPassword,
      });

      if (response.success) {
        toast({
          title: "비밀번호 변경 성공",
          description: response.message,
        });
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        navigate("/settings");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "비밀번호 변경 실패",
        description: error.response?.data?.message || "비밀번호 변경에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">비밀번호 변경</h1>
          <p className="text-sm text-muted-foreground mt-1">
            현재 비밀번호를 확인하고 새 비밀번호로 변경하세요.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>비밀번호 업데이트</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">비밀번호 규칙</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>8자 이상</li>
                  <li>영문 포함 필수</li>
                  <li>숫자 포함 필수</li>
                  <li>특수문자 사용 불가</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange("currentPassword")}
                  placeholder="현재 비밀번호"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange("newPassword")}
                  placeholder="영문+숫자 조합, 8자 이상"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="새 비밀번호 확인"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
