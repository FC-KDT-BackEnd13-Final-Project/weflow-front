import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  deleteAdminUser,
  getAdminUserById,
  upsertAdminUser,
  type AdminUser,
} from "@/lib/adminUsersStore";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const numericId = useMemo(() => Number(id), [id]);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetched = getAdminUserById(numericId);
    if (!fetched) return;
    setUser(fetched);
    setName(fetched.name);
    setPhone(fetched.phone ?? "");
    setEmail(fetched.email);
  }, [numericId]);

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    if (!user) return;
    deleteAdminUser(user.id);
    navigate("/admin/admin-users");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    upsertAdminUser({
      ...user,
      name,
      phone,
      email,
      role: "system_admin",
    });
    navigate("/admin/admin-users");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 계정 상세</h1>
          <p className="text-muted-foreground mt-1">
            관리자 계정 {'>'} 목록 {'>'} 상세 (ID: {id})
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
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="전화번호 입력"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>역할</Label>
              <div className="p-3 border rounded-md bg-muted/50 text-sm">
                시스템 관리자
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>관리자 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 관리자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
                onClick={() => navigate("/admin/admin-users")}
              >
                목록
              </Button>
              <Button type="submit">수정</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetail;
