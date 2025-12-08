import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export default function ChangePassword() {
  const [formData, setFormData] = useState<PasswordPayload>({
    oldPassword: "",
    newPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (field: keyof PasswordPayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.oldPassword || !formData.newPassword) {
      toast({ title: "비밀번호를 입력해주세요." });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      console.log("비밀번호 변경", formData);
      toast({ title: "비밀번호가 변경되었습니다." });
      setIsSubmitting(false);
      setFormData({ oldPassword: "", newPassword: "" });
      navigate("/settings");
    }, 500);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
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
              <div className="space-y-2">
                <Label htmlFor="oldPassword">현재 비밀번호</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={handleChange("oldPassword")}
                  placeholder="현재 비밀번호"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange("newPassword")}
                  placeholder="새 비밀번호"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
