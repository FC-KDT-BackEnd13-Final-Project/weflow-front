import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/apis/api";

type ChecklistCategory = string;
type StatusFilter = "전체" | "완료" | "대기";

interface ChecklistItem {
  id: number;
  title: string;
  category: ChecklistCategory;
  locked: boolean;
  count: number;
}

interface ProjectStep {
  id: number;
  title: string;
  description?: string;
  status: string;
  orderIndex: number;
}

export const mockChecklists: ChecklistItem[] = [];

export default function Checklist() {
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategory>("전체");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("전체");
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [steps, setSteps] = useState<ProjectStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchChecklists = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await api.get("/api/checklists", {
          params: { projectId: id },
          signal: controller.signal,
        });
        const responseData = response.data?.data;
        if (Array.isArray(responseData)) {
          const mapped = responseData.map((item: any) => ({
            id: item.checklistId,
            title: item.title,
            category: item.stepName,
            locked: Boolean(item.locked),
            count: item.questionCount,
          })) as ChecklistItem[];
          setChecklists(mapped);
        } else {
          throw new Error("잘못된 응답 형식입니다.");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFetchError("체크리스트를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchChecklists();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchSteps = async () => {
      try {
        setIsStepLoading(true);
        setStepError(null);
        const response = await api.get(`/api/projects/${id}/steps`, { signal: controller.signal });
        const stepData = response.data?.data?.steps ?? response.data?.data;
        if (Array.isArray(stepData)) {
          const sorted = [...stepData].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          setSteps(sorted);
        } else {
          throw new Error("잘못된 단계 응답입니다.");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setStepError("단계 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsStepLoading(false);
      }
    };
    fetchSteps();
    return () => controller.abort();
  }, [id]);

  const stepNames = steps.map((step) => step.title);
  const categoryTabs: ChecklistCategory[] = ["전체", ...stepNames.filter((name, index) => stepNames.indexOf(name) === index)];

  const baseChecklists = selectedCategory === "전체"
    ? checklists
    : checklists.filter(item => item.category === selectedCategory);

  const filteredChecklists = baseChecklists.filter((item) => {
    if (selectedStatus === "완료") return item.locked === true;
    if (selectedStatus === "대기") return item.locked === false;
    return true;
  });

  const handleViewDetail = (checklistId: number) => {
    navigate(`/project/${id}/checklist/${checklistId}`);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, checklistId: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleViewDetail(checklistId);
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">체크리스트</h1>
          <Button
            size="sm"
            className="sm:w-auto"
            onClick={() => navigate(`/project/${id}/checklist/create`)}
          >
            체크리스트 추가
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2 mt-3">
              {categoryTabs.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
              {isStepLoading && (
                <span className="text-xs text-muted-foreground">단계를 불러오는 중...</span>
              )}
              {stepError && !isStepLoading && (
                <span className="text-xs text-destructive">{stepError}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-6 mb-4">
              {(["전체", "완료", "대기"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "text-sm transition-colors pb-1 border-b-2",
                    selectedStatus === status 
                      ? "text-primary border-primary font-semibold" 
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                체크리스트를 불러오는 중입니다...
              </div>
            )}
            {fetchError && !isLoading && (
              <div className="text-sm text-destructive py-6 text-center">
                {fetchError}
              </div>
            )}
            {!isLoading && filteredChecklists.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                조건에 맞는 체크리스트가 없습니다.
              </div>
            )}
            {filteredChecklists.map((item) => (
              <Card
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleViewDetail(item.id)}
                onKeyDown={(event) => handleCardKeyDown(event, item.id)}
                className="card-hover cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2 py-0.5 whitespace-nowrap",
                          item.locked
                            ? "bg-status-complete-bg text-status-complete border-status-complete"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        )}
                      >
                        {item.locked ? "완료" : "대기"}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">질문 {item.count}개</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
