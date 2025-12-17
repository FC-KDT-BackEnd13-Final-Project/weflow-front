import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import api from "@/apis/api";
import { cn } from "@/lib/utils";

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

  const [page, setPage] = useState(0);
  const size = 10;

  /* =========================
     검색어 변경 시 페이지 리셋
  ========================= */
  useEffect(() => {
    setPage(0);
  }, [searchInput, selectedCategory]);

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
          },
          signal: controller.signal,
        });

        const data = response.data?.data;

        if (Array.isArray(data)) {
          setTemplates(data);
          setTotalPages(1);
          setTotalElements(data.length);
          return;
        }

        if (data?.content) {
          setTemplates(data.content);
          setTotalPages(data.totalPages ?? 1);
          setTotalElements(
            data.totalElements ?? data.content.length
          );
          return;
        }

        throw new Error();
      } catch {
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
  }, [page, size, selectedCategory]);

  /* =========================
     카테고리 + 검색 필터
  ========================= */
  const filteredTemplates = useMemo(() => {
    return templates
      .filter((t) => {
        const categoryMatch =
          selectedCategory === "전체" ||
          t.category === selectedCategory;

        const keyword = searchInput.trim().toLowerCase();
        const searchMatch =
          !keyword ||
          t.title.toLowerCase().includes(keyword) ||
          t.description?.toLowerCase().includes(keyword);

        return categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.deleted === b.deleted) {
          return (
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime()
          );
        }
        return a.deleted ? 1 : -1;
      });
  }, [templates, selectedCategory, searchInput]);

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
        >
          + 템플릿 생성
        </Button>
      </div>

      {/* 카테고리 */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            "전체",
            ...Array.from(
              new Set(
                templates
                  .map((t) => t.category)
                  .filter(Boolean)
              )
            ),
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
            >
              {category}
            </Button>
          ))}
        </div>
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
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground">
              템플릿을 불러오는 중입니다...
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center text-destructive">
              {error}
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredTemplates.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                등록된 템플릿이 없습니다.
              </div>
            )}

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

          {/* 페이지네이션 (검색 중엔 숨김) */}
          {!isSearching && totalPages > 1 && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                총 {totalElements.toLocaleString()}개 ·{" "}
                {page + 1}/{totalPages} 페이지
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() =>
                    setPage((p) => Math.max(0, p - 1))
                  }
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
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