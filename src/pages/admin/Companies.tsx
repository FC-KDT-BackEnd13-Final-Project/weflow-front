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

// =========================================================================
// [스켈레톤 컴포넌트 정의]
// =========================================================================
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md dark:bg-gray-700 ${className}`} />
);

// 회사 목록 테이블 행 스켈레톤
const CompanySkeletonRow = () => (
  // 테이블의 gridTemplateColumns와 동일한 스타일 적용
  <div className="grid gap-4 p-4" style={{ gridTemplateColumns: '1fr 1fr 120px 2fr 100px' }}>
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-full" />
  </div>
);

const Companies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("전체");

  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  // 로딩 상태 추가
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");

  // Debounce 적용 (500ms)
  const debouncedSearchInput = useDebounce(searchInput, 500);

  /* =========================
     검색어/필터 변경 시 페이지 리셋
  ========================= */
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchInput, statusFilter]);

  /* =========================
     데이터 로딩
  ========================= */
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        const response = await adminApi.getCompanies(
          currentPage,
          pageSize,
          debouncedSearchInput || undefined,
          statusFilter === "전체" ? undefined : statusFilter
        );

        if (response.success) {
          setCompanies(response.data.content);
          setTotalPages(response.data.totalPages);
          setTotalElements(response.data.totalElements);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "회사 목록 조회 실패",
          description:
            error.response?.data?.message ||
            "회사 목록을 불러올 수 없습니다.",
        });
      } finally {
        // 로딩 완료 후 0.5초 딜레이 추가 (선택 사항: 사용자 경험 개선)
        // setTimeout(() => setIsLoading(false), 500);
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [currentPage, statusFilter, debouncedSearchInput, toast]);

  /* =========================
     상태 뱃지
  ========================= */
  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          활성
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-gray-100 text-gray-700"
      >
        비활성
      </Badge>
    );
  };

  /* =========================
     렌더
  ========================= */
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">회사 관리</h1>
          <p className="text-muted-foreground mt-1">
            회사 관리 &gt; 회사 목록
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() =>
            navigate("/admin/companies/create")
          }
        >
          <Plus className="h-4 w-4" />
          회사 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회사 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                활성 상태
              </label>
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
                  <SelectItem value="INACTIVE">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 실시간 검색 */}
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">
                검색
              </label>
              <Input
                placeholder="회사명 / 대표자 / 사업자번호"
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(e.target.value)
                }
                className="max-w-sm"
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="grid gap-4 bg-muted p-4 font-medium text-sm" style={{ gridTemplateColumns: '1fr 1fr 120px 2fr 100px' }}>
              <div>회사명</div>
              <div>대표자</div>
              <div>회사 유형</div>
              <div>대표 이메일</div>
              <div>활성 상태</div>
            </div>

            <div className="divide-y">
              {isLoading ? (
                // 1. 로딩 중일 때 스켈레톤 행 표시
                Array.from({ length: pageSize }).map((_, index) => (
                  <CompanySkeletonRow key={index} />
                ))
              ) : companies.length === 0 ? (
                // 2. 로딩 완료 및 데이터 없음
                <div className="p-8 text-center text-muted-foreground">
                  회사가 없습니다.
                </div>
              ) : (
                // 3. 로딩 완료 및 데이터 있음
                companies.map((company) => {
                  const isDeleted =
                    company.deletedAt != null;

                  return (
                    <div
                      key={company.id}
                      className={`grid gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${isDeleted ? "opacity-60" : ""
                        }`}
                      style={{ gridTemplateColumns: '1fr 1fr 120px 2fr 100px' }}
                      onClick={() =>
                        navigate(
                          `/admin/companies/${company.id}/edit`
                        )
                      }
                    >
                      {/* 실제 데이터 표시 (로딩 중이 아니므로 안전) */}
                      <div className="font-medium">
                        {company.name}
                        {isDeleted && (
                          <span className="ml-2 text-red-500 text-sm">
                            (삭제됨)
                          </span>
                        )}
                      </div>

                      <div className="text-muted-foreground">
                        {company.representative || "-"}
                      </div>

                      <div>
                        {company.companyType ? (
                          <Badge variant="outline">
                            {company.companyType ===
                              "AGENCY"
                              ? "에이전시"
                              : "고객사"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-700"
                          >
                            미설정
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground">
                        {company.email || "-"}
                      </div>

                      <div>
                        {getStatusBadge(company.status)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 페이지네이션 */}
          {typeof totalPages === "number" &&
            totalPages > 1 &&
            typeof totalElements === "number" && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage === 0}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.max(0, p - 1)
                    )
                  }
                >
                  이전
                </Button>

                {isLoading ? (
                  // 로딩 중 페이지 정보 스켈레톤
                  <Skeleton className="h-5 w-24" />
                ) : (
                  // 로딩 완료 후 실제 페이지 정보
                  <span className="text-sm text-muted-foreground">
                    {currentPage + 1} / {totalPages} 페이지
                  </span>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    isLoading || currentPage >= totalPages - 1
                  }
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        totalPages - 1,
                        p + 1
                      )
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

export default Companies;