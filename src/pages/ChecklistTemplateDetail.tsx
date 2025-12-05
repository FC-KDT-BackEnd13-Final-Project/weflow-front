import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroupItem, RadioGroup } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import api from "@/apis/api";

type TemplateQuestionType = "SINGLE" | "MULTI" | "TEXT";

interface TemplateOption {
  optionId: number;
  optionText: string;
  hasInput: boolean;
  orderIndex: number;
}

interface TemplateQuestion {
  questionId: number;
  questionText: string;
  questionType: TemplateQuestionType;
  orderIndex: number;
  options?: TemplateOption[];
}

interface ChecklistTemplateDetailResponse {
  templateId: number;
  title: string;
  description: string;
  category: string;
  createdDate: string;
  lastModifiedDate: string;
  questions: TemplateQuestion[];
  locked: boolean;
}

export default function ChecklistTemplateDetail() {
  const { id, templateId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ChecklistTemplateDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/api/checklist-templates/${templateId}`, { signal: controller.signal });
        const data = response.data?.data;
        if (!data) throw new Error("템플릿 정보를 불러올 수 없습니다.");
        setDetail(data);
      } catch (err) {
        if (!controller.signal.aborted) setError("템플릿 상세를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchDetail();
    return () => controller.abort();
  }, [templateId]);

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center text-muted-foreground">템플릿을 불러오는 중입니다...</div>
      </ProjectLayout>
    );
  }

  if (error || !detail) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">{error ?? "템플릿을 찾을 수 없습니다."}</p>
          <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist/templates`)}>
            목록으로 돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/project/${id}/checklist/templates`)}>
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{detail.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
              <p className="text-xs text-muted-foreground mt-1">카테고리 · {detail.category ?? "미정"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                업데이트 · {new Date(detail.lastModifiedDate).toLocaleString("ko-KR")}
              </p>
            </div>
            <Badge variant={detail.locked ? "outline" : "default"}>{detail.locked ? "잠금" : "사용 가능"}</Badge>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>질문 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail.questions.length === 0 && (
              <div className="text-center text-muted-foreground py-6">등록된 질문이 없습니다.</div>
            )}
            {detail.questions.map((question) => (
              <Card key={question.questionId}>
                <CardContent className="space-y-4 py-4">
                  <div>
                    <p className="font-semibold">{question.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      유형 · {question.questionType === "SINGLE" ? "객관식" : question.questionType === "MULTI" ? "복수선택" : "주관식"}
                    </p>
                  </div>

                  {question.questionType === "TEXT" && (
                    <p className="text-sm text-muted-foreground">주관식 질문입니다.</p>
                  )}

                  {question.questionType === "SINGLE" && (question.options?.length ?? 0) > 0 && (
                    <RadioGroup value="" className="flex flex-col gap-2">
                      {question.options?.map((option) => (
                        <div key={option.optionId} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={String(option.optionId)} disabled />
                            <Label className="text-sm">{option.optionText}</Label>
                          </div>
                          {option.hasInput && <p className="text-xs text-muted-foreground ml-6">기타 입력 허용</p>}
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.questionType === "MULTI" && (question.options?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      {question.options?.map((option) => (
                        <div key={option.optionId} className="flex items-center gap-2">
                          <Checkbox id={`template-${question.questionId}-${option.optionId}`} checked={false} disabled />
                          <Label htmlFor={`template-${question.questionId}-${option.optionId}`} className="text-sm">
                            {option.optionText}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
