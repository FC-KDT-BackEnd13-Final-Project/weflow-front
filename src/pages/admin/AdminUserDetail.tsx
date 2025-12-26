// src/pages/admin/AdminUserDetail.tsx

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
  getSystemAdminById,
  updateSystemAdmin,
  deleteSystemAdmin,
  type SystemAdmin,
} from "@/apis/systemAdmins";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const numericId = useMemo(() => Number(id), [id]);

  const [user, setUser] = useState<SystemAdmin | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isDeleted = user?.deletedAt ? true : false;

  // 상세 로드
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSystemAdminById(numericId);
        setUser(data);
        setName(data.name);
        setPhoneNumber(data.phoneNumber ?? "");
        setEmail(data.email);
      } catch (err) {
        console.error("관리자 상세 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [numericId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isDeleted) return;

    try {
      await updateSystemAdmin(user.id, {
        name,
        phoneNumber,
      });
      navigate("/admin/admin-users");
    } catch (err) {
      console.error("관리자 수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSystemAdmin(numericId);
      navigate("/admin/admin-users");
    } catch (err) {
      console.error("관리자 삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>해당 관리자를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 계정 상세</h1>
          <p className="text-muted-foreground mt-1">
            관리자 계정 {">"} 목록 {">"} 상세 (ID: {id})
          </p>
        </div>
      </div>

      <Card className={isDeleted ? "opacity-60" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            관리자 정보
            {isDeleted && (
              <span className="text-red-500 text-sm font-medium">(삭제됨)</span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isDeleted}
                />
              </div>

              <div className="space-y-2">
                <Label>전화번호</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isDeleted}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label>역할</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                SYSTEM_ADMIN
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              {/* 삭제 다이얼로그 */}
              {!isDeleted && (
                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      삭제
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>관리자 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                variant="outline"
                onClick={() => navigate("/admin/admin-users")}
              >
                목록
              </Button>

              {/* 삭제된 계정은 수정 불가 */}
              {!isDeleted && <Button type="submit">수정</Button>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetail;
