import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/apis/api";
import { useToast } from "@/hooks/use-toast";

interface TemplateQuestionOption {
  optionId: number;
  optionText: string;
  hasInput: boolean;
  orderIndex: number;
}

interface TemplateQuestion {
  questionId: number;
  questionText: string;
  questionType: "SINGLE" | "MULTI" | "TEXT";
  orderIndex: number;
  options: TemplateQuestionOption[];
}

interface ChecklistTemplateDetail {
  templateId: number;
  title: string;
  description: string;
  category: string;
  createdDate: string;
  lastModifiedDate: string;
  locked: boolean;
  deleted?: boolean;
  questions: TemplateQuestion[];
}

const questionTypeLabel: Record<TemplateQuestion["questionType"], string> = {
  SINGLE: "단일 선택",
  MULTI: "복수 선택",
  TEXT: "서술형",
};

export default function TemplateDetail() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<ChecklistTemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();

    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/api/checklist-templates/${templateId}`, {
          signal: controller.signal,
        });
          const detail = response.data?.data;
          if (!detail) throw new Error("템플릿을 불러올 수 없습니다.");
        setTemplate({
          ...detail,
          questions: [...(detail.questions ?? [])]
            .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((question: any) => ({
              ...question,
              options: (question.options ?? []).sort(
                (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
              ),
            })),
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("템플릿을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchTemplate();
    return () => controller.abort();
  }, [templateId]);

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">템플릿을 불러오는 중입니다...</div>;
  }

  if (error || !template) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {error ?? "템플릿 정보를 찾을 수 없습니다."}
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/admin/checklist-templates")}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{template.title}</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/checklist-templates")}>
            목록
          </Button>
          {!template.deleted && (
            <>
              <Button onClick={() => navigate(`/admin/checklist-templates/${templateId}/edit`)}>
                수정
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={async () => {
                  if (!templateId) return;
                  const confirmed = window.confirm("정말로 이 템플릿을 삭제하시겠습니까?");
                  if (!confirmed) return;
                  try {
                    setIsDeleting(true);
                    await api.delete(`/api/checklist-templates/${templateId}`);
                    toast({
                      title: "템플릿이 삭제되었습니다.",
                    });
                    navigate("/admin/checklist-templates");
                  } catch (err) {
                    toast({
                      title: "삭제에 실패했습니다.",
                      description: "잠시 후 다시 시도해주세요.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-medium">카테고리:</span> {template.category ?? "미정"}
          </p>
          <p className="text-muted-foreground">{template.description}</p>
          <p className="text-xs text-gray-500">
            생성일: {template.createdDate ? new Date(template.createdDate).toLocaleString() : "-"}
          </p>
          <p className="text-xs text-gray-500">
            수정일: {template.lastModifiedDate ? new Date(template.lastModifiedDate).toLocaleString() : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>질문 목록</CardTitle>
          <CardDescription>등록된 질문을 확인하세요.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {template.questions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">등록된 질문이 없습니다.</div>
          )}
          {template.questions.map((question, index) => (
            <div key={question.questionId} className="p-4 border rounded-lg space-y-2">
              <p className="font-semibold">
                {index + 1}. {question.questionText}
              </p>

              <p className="text-sm text-gray-600">유형: {questionTypeLabel[question.questionType]}</p>

              {question.questionType !== "TEXT" && question.options?.length > 0 && (
                <ul className="list-disc ml-5 text-gray-700 text-sm">
                  {question.options.map((option) => (
                    <li key={option.optionId}>
                      {option.optionText}
                      {question.questionType === "SINGLE" && option.hasInput && " (기타 입력 허용)"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
