import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchInput, setSearchInput] = useState(""); // 입력 중인 검색어
  const [searchQuery, setSearchQuery] = useState(""); // 실제 검색에 사용되는 검색어

  // 역할 필터 변경 시 첫 페이지로 리셋
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(0);
  };

  // 상태 필터 변경 시 첫 페이지로 리셋
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  // 검색 실행 (엔터키 또는 검색 버튼)
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(0);
  };

  // 엔터키 입력 시 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const response = await adminApi.getUsers(
          currentPage,
          10,
          searchQuery,
          roleFilter,
          statusFilter
        );
        if (response.success) {
          // SYSTEM_ADMIN은 백엔드에서 제외됨
          setMembers(response.data.content);
          setTotalPages(response.data.totalPages);
          setTotalElements(response.data.totalElements);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "회원 목록 조회 실패",
          description: error.response?.data?.message || "회원 목록을 불러올 수 없습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [currentPage, searchQuery, roleFilter, statusFilter, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            회원 관리 {'>'} 회원 목록
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => navigate("/admin/members/create")}>
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
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
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

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">검색:</label>
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="이름 / 이메일"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 회원 목록 */}
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
                      className={`grid grid-cols-5 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${isDeleted ? 'opacity-60' : ''}`}
                      onClick={() => navigate(`/admin/members/${member.id}`, { state: { member } })}
                    >
                      <div className="font-medium">
                        {member.name}
                        {isDeleted && <span className="ml-2 text-red-500 text-sm">(삭제됨)</span>}
                      </div>
                      <div className="text-muted-foreground">{member.email}</div>
                      <div>
                        <Badge variant="outline">{roleLabels[member.role] || member.role}</Badge>
                      </div>
                      <div>{member.companyName || "-"}</div>
                      <div>
                        <Badge variant={
                          member.status === "ACTIVE" ? "default" :
                          member.status === "DELETED" ? "destructive" :
                          "secondary"
                        }>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages} 페이지 (총 {totalElements}명)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
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
