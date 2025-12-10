// src/pages/admin/AdminUsers.tsx

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import {
  getSystemAdmins,
  deleteSystemAdmin,
  type SystemAdmin,
} from "@/apis/systemAdmins";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<SystemAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = async () => {
    try {
      const data = await getSystemAdmins();

      // 🔥 삭제 안된 → 삭제된 순서로 정렬
      const sorted = data.sort((a, b) => {
        const aDeleted = a.deletedAt ? 1 : 0;
        const bDeleted = b.deletedAt ? 1 : 0;
        return aDeleted - bDeleted;
      });

      setAdmins(sorted);
    } catch (err) {
      console.error("관리자 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteSystemAdmin(id);
      loadAdmins();
    } catch (err) {
      console.error("관리자 삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">관리자 계정 관리</h1>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/admin/admin-users/create")}
        >
          <Plus className="h-4 w-4" />
          관리자 추가
        </Button>
      </div>

      {/* 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {admins.length === 0 && (
            <div className="text-muted-foreground">
              등록된 관리자가 없습니다.
            </div>
          )}

          {admins.map((admin) => {
            const isDeleted = !!admin.deletedAt;

            return (
              <div
                key={admin.id}
                className={`flex items-center justify-between p-3 border rounded-md transition-colors`}
                onClick={() => navigate(`/admin/admin-users/${admin.id}`)}
              >
                <div>
                  <div className="font-medium">
                    {admin.name}
                    {isDeleted && (
                      <span className="ml-2 text-red-500 text-sm">
                        (삭제됨)
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {admin.email}
                  </div>
                </div>

                {!isDeleted && (
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation(); // ← 상세 페이지로 이동 방지
                      handleDelete(admin.id);
                    }}
                  >
                    삭제
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
