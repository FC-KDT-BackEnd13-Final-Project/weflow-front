import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { adminApi } from "@/apis/admin";
import { useToast } from "@/hooks/use-toast";

const AdminMemberDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const member = location.state?.member;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    companyId: "",
    companyName: "",
  });

  useEffect(() => {
    if (!member) {
      toast({
        variant: "destructive",
        title: "잘못된 접근",
        description: "회원 목록에서 회원을 선택해주세요.",
      });
      navigate("/admin/members");
    } else {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        role: member.role || "",
        status: member.status || "",
        companyId: member.companyId?.toString() || "",
        companyName: member.companyName || "",
      });
    }
  }, [toast, navigate]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      const response = await adminApi.deleteUser(parseInt(id));

      if (response.success) {
        toast({
          title: "회원 삭제 성공",
          description: response.message,
        });
        setIsDeleteDialogOpen(false);
        navigate("/admin/members");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 삭제 실패",
        description: error.response?.data?.message || "회원 삭제에 실패했습니다.",
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.status || !formData.companyId) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
      });
      return;
    }

    if (!id) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "회원 ID가 없습니다.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminApi.updateUser(parseInt(id), {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        companyId: parseInt(formData.companyId),
      });

      if (response.success) {
        toast({
          title: "회원 수정 성공",
          description: response.message,
        });
        navigate("/admin/members");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 수정 실패",
        description: error.response?.data?.message || "회원 정보 수정에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">잘못된 접근입니다. 회원 목록으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 상세</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 목록 {'>'} 회원 상세
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회원 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="이름 입력"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                이메일은 수정할 수 없습니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label>소속 회사 *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => setFormData({ ...formData, companyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">비엔시스템</SelectItem>
                  <SelectItem value="2">고객사A</SelectItem>
                  <SelectItem value="3">고객사B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>역할 *</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="AGENCY" id="agency" />
                  <Label htmlFor="agency" className="font-normal cursor-pointer">
                    에이전시 담당자
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CLIENT" id="client" />
                  <Label htmlFor="client" className="font-normal cursor-pointer">
                    고객사 담당자
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>상태 *</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ACTIVE" id="active" />
                  <Label htmlFor="active" className="font-normal cursor-pointer">
                    활성
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INACTIVE" id="inactive" />
                  <Label htmlFor="inactive" className="font-normal cursor-pointer">
                    비활성
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isSubmitting}>
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>회원 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/members")}
                disabled={isSubmitting}
              >
                목록
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "수정 중..." : "수정"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMemberDetail;
