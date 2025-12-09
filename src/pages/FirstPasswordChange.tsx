import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth";

export default function FirstPasswordChange() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "비밀번호 불일치",
        description: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
      });
      return;
    }

    // 비밀번호 형식 검증 (백엔드 정책과 동일)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
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
        currentPassword: "", // 임시 비밀번호 사용자는 현재 비밀번호 불필요
        newPassword: newPassword,
        newPasswordConfirm: confirmPassword,
      });

      if (response.success) {
        toast({
          title: "비밀번호 변경 성공",
          description: "비밀번호가 성공적으로 변경되었습니다.",
        });

        // 사용자 정보 업데이트 (isTemporaryPassword를 false로)
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.isTemporaryPassword = false;
          localStorage.setItem("user", JSON.stringify(user));
        }

        // 역할에 따라 대시보드로 이동
        const userStr2 = localStorage.getItem("user");
        if (userStr2) {
          const user = JSON.parse(userStr2);
          if (user.role === "SYSTEM_ADMIN") {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        }
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

  const handleSkip = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "SYSTEM_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-accent p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">비밀번호 변경</CardTitle>
          <CardDescription>
            최초 로그인입니다. 보안을 위해 비밀번호를 변경해주세요.
          </CardDescription>
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
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="영문+숫자 조합, 8자 이상"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "변경 중..." : "비밀번호 변경"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                다음에 변경
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
