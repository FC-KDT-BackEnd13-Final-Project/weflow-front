import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import api from "@/apis/api";

interface ChecklistTemplate {
  templateId: number;
  title: string;
  description: string;
  category: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
}

export default function ChecklistTemplates() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get("/api/checklist-templates", { signal: controller.signal });
        const data = response.data?.data;
        if (!Array.isArray(data)) throw new Error("템플릿 목록을 가져올 수 없습니다.");
        setTemplates(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("템플릿 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchTemplates();
    return () => controller.abort();
  }, []);

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">체크리스트 템플릿</h1>
            <p className="text-muted-foreground text-sm mt-1">프로젝트에 적용할 템플릿을 선택하세요.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist`)}>
            목록으로
          </Button>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-muted-foreground">템플릿을 불러오는 중입니다...</div>
        )}

        {error && !isLoading && (
          <div className="py-12 text-center text-muted-foreground">{error}</div>
        )}

        {!isLoading && !error && templates.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">등록된 템플릿이 없습니다.</div>
        )}

        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {["전체", ...Array.from(new Set(templates.map((template) => template.category).filter(Boolean)))].map(
              (category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              )
            )}
          </div>
        )}

        <div className="space-y-4">
          {templates
            .filter((template) => selectedCategory === "전체" || template.category === selectedCategory)
            .map((template) => (
              <Card
                key={template.templateId}
                className="cursor-pointer hover:shadow"
                onClick={() => navigate(`/project/${id}/checklist/templates/${template.templateId}`)}
              >
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{template.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
                <Badge variant={template.locked ? "outline" : "default"}>
                  {template.locked ? "잠금" : "사용 가능"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>카테고리 · {template.category ?? "미정"}</p>
                  <p>질문 수 · {template.questionCount}개</p>
                  <p>업데이트 · {format(new Date(template.updatedAt), "yyyy.MM.dd HH:mm")}</p>
                </div>
                <Button
                  variant="outline"
                  disabled={template.locked}
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/project/${id}/checklist/templates/${template.templateId}`);
                  }}
                >
                  상세 보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProjectLayout>
  );
}
