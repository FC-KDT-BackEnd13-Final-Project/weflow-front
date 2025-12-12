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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    role: "",
    status: "",
    companyId: "",
    deletedAt: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. 회사 목록 조회 (활성 상태만, 전체)
        const companiesResponse = await adminApi.getCompanies(0, 9999, "", "ACTIVE");
        if (companiesResponse.success) {
          setCompanies(companiesResponse.data.content);
        }

        // 2. 회원 정보 설정 (state가 있으면 사용, 없으면 API 조회)
        if (location.state?.member) {
          const member = location.state.member;
          setFormData({
            name: member.name || "",
            phoneNumber: member.phoneNumber || "",
            email: member.email || "",
            role: member.role || "",
            status: member.status || "",
            companyId: member.companyId?.toString() || "",
            deletedAt: member.deletedAt || null,
          });
        } else if (id) {
          try {
            const userResponse = await adminApi.getUserById(Number(id));
            if (userResponse.success) {
              const member = userResponse.data;
              setFormData({
                name: member.name || "",
                phoneNumber: member.phoneNumber || "",
                email: member.email || "",
                role: member.role || "",
                status: member.status || "",
                companyId: member.companyId?.toString() || "",
                deletedAt: member.deletedAt || null,
              });
            }
          } catch (error) {
            console.error("회원 상세 조회 실패:", error);
            toast({
              variant: "destructive",
              title: "회원 조회 실패",
              description: "회원 정보를 불러올 수 없습니다.",
            });
            navigate("/admin/members");
          }
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, location.state, navigate, toast]);

  // Auto-fill role based on selected company type
  useEffect(() => {
    if (formData.companyId && companies.length > 0) {
      const selectedCompany = companies.find(
        (c) => c.id.toString() === formData.companyId
      );
      if (selectedCompany && selectedCompany.companyType) {
        setFormData((prev) => ({ ...prev, role: selectedCompany.companyType }));
      }
    }
  }, [formData.companyId, companies]);

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

  const handleRestore = async () => {
    if (!id) return;

    try {
      const response = await adminApi.restoreUser(parseInt(id));

      if (response.success) {
        toast({
          title: "회원 복구 성공",
          description: response.message,
        });
        navigate("/admin/members");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "회원 복구 실패",
        description: error.response?.data?.message || "회원 복구에 실패했습니다.",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;

    // 비밀번호 검증
    if (!newPassword || newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "비밀번호 형식 오류",
        description: "비밀번호는 8자 이상이어야 합니다.",
      });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "비밀번호 형식 오류",
        description: "비밀번호는 8자 이상, 영문+숫자 조합이어야 합니다.",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await adminApi.resetPassword(parseInt(id), {
        newPassword: newPassword,
      });

      if (response.success) {
        toast({
          title: "비밀번호 재설정 성공",
          description: response.message,
        });
        setIsResetPasswordDialogOpen(false);
        setNewPassword("");
        // 페이지 새로고침하여 isTemporaryPassword 상태 업데이트
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "비밀번호 재설정 실패",
        description: error.response?.data?.message || "비밀번호 재설정에 실패했습니다.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.companyId) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
      });
      return;
    }

    // Validate company has type set
    const selectedCompany = companies.find(
      (c) => c.id.toString() === formData.companyId
    );

    if (!selectedCompany?.companyType) {
      toast({
        variant: "destructive",
        title: "회사 유형 미설정",
        description: "선택한 회사의 유형이 설정되지 않았습니다. 회사 정보를 먼저 수정해주세요.",
      });
      return;
    }

    // Validate role matches company type
    if (formData.role !== selectedCompany.companyType) {
      toast({
        variant: "destructive",
        title: "역할 불일치",
        description: "사용자 역할이 회사 유형과 일치하지 않습니다.",
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
        phoneNumber: formData.phoneNumber,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const isDeleted = formData.deletedAt != null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            회원 상세
            {isDeleted && <span className="ml-3 text-red-500 text-xl">(삭제됨)</span>}
          </h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 목록 {'>'} 회원 상세
          </p>
        </div>
      </div>

      <Card className={isDeleted ? "opacity-70" : ""}>
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
                disabled={isDeleted}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">전화번호</Label>
              <Input
                id="phoneNumber"
                placeholder="전화번호 입력"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                disabled={isDeleted}
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
                  ℹ️ 이메일은 수정할 수 없습니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label>소속 회사 *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                disabled={isDeleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                      {company.companyType && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({company.companyType === 'AGENCY' ? '에이전시' : '고객사'})
                        </span>
                      )}
                      {!company.companyType && (
                        <span className="text-xs text-destructive ml-2">(유형 미설정)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>역할 *</Label>
              <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {formData.role === "AGENCY" ? "에이전시 담당자" : "고객사 담당자"}
              </div>
              <p className="text-xs text-muted-foreground">
                ℹ️ 역할은 선택한 회사의 유형에 따라 자동으로 설정됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label>상태</Label>
              <Input
                value={formData.status}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                  ℹ️ 상태 수정은 하단의 [삭제] 혹은 [복구] 버튼을 이용하세요.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              {isDeleted ? (
                // 삭제된 회원: 복구 버튼만 표시
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/members")}
                  >
                    목록
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRestore}
                  >
                    복구
                  </Button>
                </>
              ) : (
                // 활성 회원: 삭제, 비밀번호 재설정, 수정 버튼 표시
                <>
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
                          정말로 이 회원을 삭제하시겠습니까?
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
                    variant="secondary"
                    onClick={() => setIsResetPasswordDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    비밀번호 재설정
                  </Button>
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
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 재설정 다이얼로그 */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
            <DialogDescription>
              회원의 비밀번호를 강제로 재설정합니다. 재설정된 비밀번호는 임시 비밀번호로 설정되며, 회원은 다음 로그인 시 비밀번호 변경이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호 *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="8자 이상, 영문+숫자 조합"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isResettingPassword}
              />
              <p className="text-xs text-muted-foreground">
                비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ 재설정된 비밀번호를 회원에게 안전하게 전달해주세요.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setNewPassword("");
              }}
              disabled={isResettingPassword}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? "재설정 중..." : "재설정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMemberDetail;
