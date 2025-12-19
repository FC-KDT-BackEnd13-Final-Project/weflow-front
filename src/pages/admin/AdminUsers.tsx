import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [page, setPage] = useState(0);
  const size = 10;

  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  const [keyword, setKeyword] = useState("");

  /* =========================
     검색어 변경 시 페이지 리셋
  ========================= */
  useEffect(() => {
    setPage(0);
  }, [keyword]);

  /* =========================
     데이터 로딩
  ========================= */
  const loadAdmins = async () => {
    try {
      const data = await getSystemAdmins({ page, size });

      const sorted = [...data.content].sort((a, b) => {
        const aDeleted = a.deletedAt ? 1 : 0;
        const bDeleted = b.deletedAt ? 1 : 0;
        return aDeleted - bDeleted;
      });

      setAdmins(sorted);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error("관리자 목록 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [page]);

  /* =========================
     실시간 검색
  ========================= */
  const filteredAdmins = useMemo(() => {
    if (!keyword.trim()) return admins;

    const lower = keyword.toLowerCase();
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.email.toLowerCase().includes(lower)
    );
  }, [admins, keyword]);

  const isSearching = keyword.trim().length > 0;

  /* =========================
     삭제
  ========================= */
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteSystemAdmin(id);
      loadAdmins();
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
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

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="이름 또는 이메일로 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {filteredAdmins.length === 0 && (
            <div className="text-muted-foreground">
              등록된 관리자가 없습니다.
            </div>
          )}

          {filteredAdmins.map((admin) => {
            const isDeleted = !!admin.deletedAt;

            return (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  navigate(`/admin/admin-users/${admin.id}`)
                }
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
                      e.stopPropagation();
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

      {/* 페이지네이션 (검색 중엔 숨김) */}
      {!isSearching &&
        typeof totalPages === "number" &&
        totalPages > 1 && (
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
            >
              다음
            </Button>
          </div>
        )}
    </div>
  );
};

export default AdminUsers;