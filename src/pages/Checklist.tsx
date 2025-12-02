import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChecklistCategory = "전체" | "요구사항 정의" | "화면 설계" | "디자인" | "개발" | "검수";
type StatusFilter = "전체" | "완료" | "대기";

interface ChecklistItem {
  id: number;
  title: string;
  category: ChecklistCategory;
  status: "complete" | "pending";
  count: number;
}

export const mockChecklists: ChecklistItem[] = [
  {
    id: 1,
    title: "기획 단계 사전 질문지",
    category: "요구사항 정의",
    status: "complete",
    count: 12,
  },
  {
    id: 2,
    title: "디자인 가이드 입력",
    category: "화면 설계",
    status: "pending",
    count: 9,
  },
  {
    id: 3,
    title: "개발 환경 요구사항",
    category: "개발",
    status: "pending",
    count: 10,
  },
];

const categories: ChecklistCategory[] = ["전체", "요구사항 정의", "화면 설계", "디자인", "개발", "검수"];

export default function Checklist() {
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategory>("전체");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("전체");
  const navigate = useNavigate();
  const { id } = useParams();

  let filteredChecklists = selectedCategory === "전체" 
    ? mockChecklists 
    : mockChecklists.filter(item => item.category === selectedCategory);

  if (selectedStatus === "완료") {
    filteredChecklists = filteredChecklists.filter(item => item.status === "complete");
  } else if (selectedStatus === "대기") {
    filteredChecklists = filteredChecklists.filter(item => item.status === "pending");
  }

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
              {categories.map((category) => (
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
                          item.status === "complete" && "bg-status-complete-bg text-status-complete border-status-complete",
                          item.status === "pending" && "bg-blue-50 text-blue-600 border-blue-200"
                        )}
                      >
                        {item.status === "complete" ? "완료" : "대기"}
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
