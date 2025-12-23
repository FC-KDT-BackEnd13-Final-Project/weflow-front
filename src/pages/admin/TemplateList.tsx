import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import api from "@/apis/api";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// =========================================================================
// [스켈레톤 컴포넌트 정의]
// =========================================================================
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md dark:bg-gray-700 ${className}`} />
);

// 체크리스트 템플릿 카드 스켈레톤
const TemplateSkeletonCard = () => (
  <Card className="transition border-dashed bg-muted">
    <CardHeader className="flex flex-row items-center justify-between">
      {/* Title and Description Skeletons */}
      <div>
        <Skeleton className="h-6 w-60 mb-1" /> {/* Title */}
        <Skeleton className="h-4 w-96 mt-1" /> {/* Description */}
      </div>
      {/* Badge Skeleton */}
      <Skeleton className="h-6 w-20" />
    </CardHeader>

    <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-0 pb-6">
      {/* Details Skeletons */}
      <div className="text-sm text-muted-foreground space-y-1">
        <Skeleton className="h-4 w-40" /> {/* Category */}
        <Skeleton className="h-4 w-32" /> {/* Question Count */}
        <Skeleton className="h-4 w-48" /> {/* Created At */}
      </div>
      {/* Button Skeleton */}
      <Skeleton className="h-10 w-24" />
    </CardContent>
  </Card>
);

// =========================================================================
// [컴포넌트 본문]
// =========================================================================

interface ChecklistTemplateSummary {
  templateId: number;
  title: string;
  description?: string;
  category?: string;
  questionCount: number;
  createdAt: string;
  updatedAt?: string;
  locked?: boolean;
  deleted?: boolean;
}

const TemplateList = () => {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<ChecklistTemplateSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearchInput = useDebounce(searchInput, 500);

  const [page, setPage] = useState(0);
  const size = 10;

  // 💡 [수정] 지금까지 로드된 모든 템플릿에서 발견된 카테고리를 저장합니다.
  const [allCategories, setAllCategories] = useState<string[]>([]);


  /* =========================
     Debounce된 검색어 또는 카테고리 변경 시 페이지 리셋
  ========================= */
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchInput, selectedCategory]);

  /* =========================
     데이터 로딩
  ========================= */
  useEffect(() => {
    const controller = new AbortController();

    const fetchPaginated = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/api/checklist-templates", {
          params: {
            page,
            size,
            category:
              selectedCategory !== "전체"
                ? selectedCategory
                : undefined,
            keyword: debouncedSearchInput || undefined,
          },
          signal: controller.signal,
        });

        const data = response.data?.data;
        let fetchedTemplates: ChecklistTemplateSummary[] = []; // 로드된 템플릿 임시 저장

        if (Array.isArray(data)) {
          fetchedTemplates = data;
          setTotalPages(1);
          setTotalElements(data.length);
        } else if (data?.content) {
          fetchedTemplates = data.content;
          setTotalPages(data.totalPages ?? 1);
          setTotalElements(
            data.totalElements ?? data.content.length
          );
        } else {
          throw new Error();
        }

        setTemplates(fetchedTemplates); // 템플릿 목록 상태 업데이트

        // 💡 [수정] 새로 로드된 템플릿에서 카테고리를 추출하여 기존 카테고리 목록에 누적합니다.
        const newCategories = fetchedTemplates
          .map((t) => t.category)
          .filter(Boolean) as string[];

        setAllCategories((prevCategories) => {
          const uniqueCategories = new Set([
            ...prevCategories,
            ...newCategories,
          ]);
          // 가독성을 위해 정렬
          return Array.from(uniqueCategories).sort();
        });

      } catch (e) {
        if (!controller.signal.aborted) {
          setError("템플릿 목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchPaginated();
    return () => controller.abort();
  }, [page, size, selectedCategory, debouncedSearchInput]);

  /* =========================
     필터링 로직 수정 (서버에서 검색하므로 클라이언트 측 검색 필터링 제거)
  ========================= */
  const filteredTemplates = useMemo(() => {
    return templates
      .sort((a, b) => {
        if (a.deleted !== b.deleted) {
          return a.deleted ? 1 : -1;
        }
        return (
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
        );
      });
  }, [templates]);

  const isSearching = searchInput.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            체크리스트 템플릿
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            프로젝트에서 활용할 템플릿을 관리하고 새 템플릿을 등록하세요.
          </p>
        </div>
        <Button
          onClick={() =>
            navigate("/admin/checklist-templates/create")
          }
          disabled={isLoading}
        >
          + 템플릿 생성
        </Button>
      </div>

      {/* 카테고리 */}
      {/* 💡 [수정] 로딩 중이면서 템플릿 데이터가 없을 때만 스켈레톤 표시 */}
      {isLoading && templates.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20" />
          ))}
        </div>
      ) : (
        // 💡 [수정] allCategories 상태를 사용하여 버튼 목록을 생성
        (allCategories.length > 0 || selectedCategory === "전체") && (
          <div className="flex flex-wrap gap-2">
            {[
              "전체",
              ...allCategories,
            ].map((category) => (
              <Button
                key={category}
                variant={
                  selectedCategory === category
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category)}
                // 로딩 중에도 카테고리 버튼 비활성화 유지
                disabled={isLoading}
              >
                {category}
              </Button>
            ))}
          </div>
        )
      )}

      {/* 검색 */}
      <div className="max-w-sm">
        <Input
          placeholder="템플릿 제목 / 설명 검색"
          value={searchInput}
          onChange={(e) =>
            setSearchInput(e.target.value)
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>템플릿 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 1. 로딩 중 스켈레톤 표시 */}
          {isLoading && (
            Array.from({ length: size }).map((_, index) => (
              <TemplateSkeletonCard key={index} />
            ))
          )}

          {/* 2. 에러 표시 */}
          {error && !isLoading && (
            <div className="py-12 text-center text-destructive">
              {error}
            </div>
          )}

          {/* 3. 데이터 없음 */}
          {!isLoading &&
            !error &&
            filteredTemplates.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {isSearching ? "검색 결과에 해당하는 템플릿이 없습니다." : "등록된 템플릿이 없습니다."}
              </div>
            )}

          {/* 4. 실제 데이터 */}
          {!isLoading &&
            !error &&
            filteredTemplates.map((template) => (
              <Card
                key={template.templateId}
                className={cn(
                  "cursor-pointer transition",
                  template.deleted
                    ? "border-dashed bg-muted text-muted-foreground"
                    : "hover:shadow"
                )}
                onClick={() =>
                  navigate(
                    `/admin/checklist-templates/${template.templateId}`
                  )
                }
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{template.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      template.deleted
                        ? "destructive"
                        : template.locked
                          ? "outline"
                          : "default"
                    }
                  >
                    {template.deleted
                      ? "사용 불가"
                      : template.locked
                        ? "잠금"
                        : "사용 가능"}
                  </Badge>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>카테고리 · {template.category ?? "미정"}</p>
                    <p>질문 수 · {template.questionCount}개</p>
                    <p>
                      생성일 ·{" "}
                      {new Date(
                        template.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/admin/checklist-templates/${template.templateId}`
                      );
                    }}
                  >
                    상세 보기
                  </Button>
                </CardContent>
              </Card>
            ))}

          {/* 페이지네이션 */}
          {!isSearching && totalPages > 1 && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  총 {totalElements.toLocaleString()}개 ·{" "}
                  {page + 1}/{totalPages} 페이지
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  // 로딩 중에도 페이지네이션 버튼은 비활성화 유지
                  disabled={page === 0 || isLoading}
                  onClick={() =>
                    setPage((p) => Math.max(0, p - 1))
                  }
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  // 로딩 중에도 페이지네이션 버튼은 비활성화 유지
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages - 1, p + 1)
                    )
                  }
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateList;