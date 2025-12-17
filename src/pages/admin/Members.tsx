import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/apis/admin";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "시스템 관리자",
  AGENCY: "에이전시",
  CLIENT: "고객사",
};

const Members = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  const [roleFilter, setRoleFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchInput, setSearchInput] = useState("");

  // Debounce 적용 (500ms)
  const debouncedSearchInput = useDebounce(searchInput, 500);

  /* =========================
     검색어/필터 변경 시 페이지 리셋
  ========================= */
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchInput, roleFilter, statusFilter]);

  /* =========================
     데이터 로딩
  ========================= */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await adminApi.getUsers(
          currentPage,
          pageSize,
          debouncedSearchInput || undefined,
          roleFilter === "전체" ? undefined : roleFilter,
          statusFilter === "전체" ? undefined : statusFilter
        );

        if (response.success) {
          setMembers(response.data.content);
          setTotalPages(response.data.totalPages);
          setTotalElements(response.data.totalElements);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "회원 목록 조회 실패",
          description:
            error.response?.data?.message ||
            "회원 목록을 불러올 수 없습니다.",
        });
      }
    };

    fetchMembers();
  }, [currentPage, roleFilter, statusFilter, debouncedSearchInput, toast]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 &gt; 회원 목록
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/admin/members/create")}
        >
          <Plus className="h-4 w-4" />
          회원 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">활성 상태</label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="DELETED">삭제됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">역할</label>
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="AGENCY">에이전시</SelectItem>
                  <SelectItem value="CLIENT">고객사</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 검색 */}
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">검색</label>
              <Input
                placeholder="이름 / 이메일"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 bg-muted p-4 font-medium text-sm">
              <div>이름</div>
              <div>이메일</div>
              <div>역할</div>
              <div>회사명</div>
              <div>상태</div>
            </div>

            <div className="divide-y">
              {members.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  회원이 없습니다.
                </div>
              ) : (
                members.map((member) => {
                  const isDeleted = member.deletedAt != null;

                  return (
                    <div
                      key={member.id}
                      className={`grid grid-cols-5 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        isDeleted ? "opacity-60" : ""
                      }`}
                      onClick={() =>
                        navigate(`/admin/members/${member.id}`, {
                          state: { member },
                        })
                      }
                    >
                      <div className="font-medium">
                        {member.name}
                        {isDeleted && (
                          <span className="ml-2 text-red-500 text-sm">
                            (삭제됨)
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {member.email}
                      </div>
                      <div>
                        <Badge variant="outline">
                          {roleLabels[member.role] ?? member.role}
                        </Badge>
                      </div>
                      <div>{member.companyName || "-"}</div>
                      <div>
                        <Badge
                          variant={
                            member.status === "ACTIVE"
                              ? "default"
                              : member.status === "DELETED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 페이지네이션 */}
          {typeof totalPages === "number" && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(0, p - 1))
                  }
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages} 페이지
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages - 1, p + 1)
                    )
                  }
                >
                  다음
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;