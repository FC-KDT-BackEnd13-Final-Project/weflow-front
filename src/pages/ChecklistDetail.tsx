import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/apis/api";
import { useToast } from "@/hooks/use-toast";

type ChecklistQuestionType = "SINGLE" | "MULTI" | "TEXT";

interface ChecklistOption {
  id: number;
  optionText: string;
  hasInput: boolean;
}

interface ChecklistAnswer {
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  answerText?: string;
}

interface ChecklistQuestion {
  id: number;
  questionText: string;
  questionType: ChecklistQuestionType;
  options?: ChecklistOption[];
  answer?: ChecklistAnswer;
}

interface ChecklistDetailResponse {
  checklistId: number;
  title: string;
  description?: string;
  locked: boolean;
  questions: ChecklistQuestion[];
  stepName?: string;
  questionCount?: number;
}

export default function ChecklistDetail() {
  const { id, checklistId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [detail, setDetail] = useState<ChecklistDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[] | undefined>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1) API로 상세 조회
  useEffect(() => {
    if (!checklistId) return;

    const controller = new AbortController();

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        const response = await api.get(`/api/checklists/${checklistId}`, {
          signal: controller.signal,
        });

        const d = response.data?.data;
        if (!d) throw new Error("잘못된 응답입니다.");

        const normalizedQuestions: ChecklistQuestion[] = (d.questions ?? []).map((q: any) => ({
          id: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: (q.options ?? []).map((opt: any) => ({
            id: opt.optionId,
            optionText: opt.optionText,
            hasInput: opt.hasInput,
          })),
          answer: q.answer
            ? {
                selectedOptionId: q.answer.selectedOptionId ?? undefined,
                selectedOptionIds: q.answer.selectedOptionIds ?? undefined,
                answerText: q.answer.answerText ?? undefined,
              }
            : undefined,
        }));

        setDetail({
          checklistId: d.checklistId,
          title: d.title,
          description: d.description,
          locked: d.locked === true,
          questions: normalizedQuestions,
          stepName: d.stepName,
          questionCount: d.questionCount,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setFetchError("체크리스트 상세를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => controller.abort();
  }, [checklistId]);

  // 2) detail 업데이트되면 답변 초기화 (1회)
  useEffect(() => {
    if (!detail) return;

    const nextSel: Record<number, number | number[]> = {};
    const nextInput: Record<number, string> = {};

    detail.questions.forEach((q) => {
      if (q.answer?.selectedOptionId !== undefined) {
        nextSel[q.id] = q.answer.selectedOptionId;
      }
      if (q.answer?.selectedOptionIds !== undefined) {
        nextSel[q.id] = q.answer.selectedOptionIds;
      }
      if (q.answer?.answerText !== undefined) {
        nextInput[q.id] = q.answer.answerText;
      }
    });

    setSelectedAnswers(nextSel);
    setCustomInputs(nextInput);
  }, [detail]);

  // 3) SINGLE 선택
  const handleSingleOptionChange = (questionId: number, value: string) => {
    if (detail?.locked) return;

    const numeric = Number(value);

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: numeric,
    }));

    const q = detail?.questions.find((item) => item.id === questionId);
    const selectedOpt = q?.options?.find((o) => o.id === numeric);

    if (!selectedOpt?.hasInput) {
      setCustomInputs((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // 4) MULTI 선택 처리
  const handleMultiOptionToggle = (questionId: number, optionId: number, checked: boolean) => {
    if (detail?.locked) return;

    setSelectedAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as number[]) : [];
      const next = checked
        ? current.includes(optionId) ? current : [...current, optionId]
        : current.filter((id) => id !== optionId);

      const q = detail?.questions.find((item) => item.id === questionId);
      const hasInput = q?.options?.some((opt) => next.includes(opt.id) && opt.hasInput);

      if (!hasInput) {
        setCustomInputs((prevInput) => {
          const copy = { ...prevInput };
          delete copy[questionId];
          return copy;
        });
      }

      return { ...prev, [questionId]: next };
    });
  };

  // 🔥 5) INPUT 변경
  const handleCustomInputChange = (questionId: number, value: string) => {
    if (detail?.locked) return;

    setCustomInputs((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const buildAnswerPayload = () => {
    if (!detail) return [];
    const payload: Array<{ questionId: number; optionId: number | null; answerText: string | null }> = [];

    detail.questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const memoInput = customInputs[q.id] ?? null;

      if (q.questionType === "TEXT") {
        payload.push({
          questionId: q.id,
          optionId: null,
          answerText: memoInput,
        });
        return;
      }

      if (q.questionType === "SINGLE" && typeof selected === "number") {
        payload.push({
          questionId: q.id,
          optionId: selected,
          answerText: memoInput,
        });
        return;
      }

      if (q.questionType === "MULTI" && Array.isArray(selected)) {
        selected.forEach((optionId) => {
          payload.push({
            questionId: q.id,
            optionId,
            answerText: memoInput,
          });
        });
      }
    });

    return payload;
  };

  const handleSubmitAnswers = async () => {
    if (!detail || detail.locked || isSubmitting) return;
    const answers = buildAnswerPayload();
    if (answers.length === 0) {
      toast({
        title: "답변을 선택해주세요.",
        description: "제출할 항목을 선택하거나 입력해야 합니다.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/api/checklists/answers`, {
        checklistId: detail.checklistId,
        answers,
      });
      toast({
        title: "체크리스트 제출 완료",
        description: "답변이 정상적으로 제출되었습니다.",
      });
      navigate(`/project/${id}/checklist`);
    } catch (error) {
      toast({
        title: "제출에 실패했습니다.",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6) 추가 입력창 보여줄지?
  // 로딩 화면
  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center text-muted-foreground">체크리스트 로딩 중...</div>
      </ProjectLayout>
    );
  }

  // 🔥 에러 화면
  if (fetchError || !detail) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{fetchError ?? "체크리스트를 찾을 수 없습니다."}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/project/${id}/checklist`)}>
            돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="space-y-6">

        {/* 뒤로가기 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${id}/checklist`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </div>

        {/* 본문 */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{detail.title}</CardTitle>
                {detail.description && (
                  <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  질문 {detail.questionCount ?? detail.questions.length}개 ·{" "}
                  {detail.locked ? "제출 완료" : "작성 가능"}
                </p>
                {detail.stepName && (
                  <p className="text-xs text-muted-foreground mt-1">단계: {detail.stepName}</p>
                )}
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1",
                  detail.locked
                    ? "bg-status-complete-bg text-status-complete border-status-complete"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                )}
              >
                {detail.locked ? "완료" : "대기"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {detail.questions.length > 0 ? (
              detail.questions.map((q) => (
                <div key={q.id}>
                  <Card className="border-2">
                    <CardContent className="p-4">

                      <h4 className="font-medium mb-4">{q.questionText}</h4>

                      {/* SINGLE */}
                      {q.questionType === "SINGLE" && (q.options?.length ?? 0) > 0 && (
                        <RadioGroup
                          value={String(selectedAnswers[q.id] ?? "")}
                          onValueChange={(v) => handleSingleOptionChange(q.id, v)}
                          className="space-y-3"
                        >
                          {(q.options ?? []).map((opt) => (
                            <div key={opt.id} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={String(opt.id)}
                                  id={`${q.id}-${opt.id}`}
                                  disabled={detail.locked}
                                />
                                <Label
                                  htmlFor={`${q.id}-${opt.id}`}
                                  className={cn(
                                    "cursor-pointer",
                                    selectedAnswers[q.id] === opt.id && "font-medium"
                                  )}
                                >
                                  {opt.optionText}
                                </Label>
                              </div>
                              {opt.hasInput && selectedAnswers[q.id] === opt.id && (
                                <Input
                                  value={customInputs[q.id] ?? ""}
                                  placeholder="내용을 입력해주세요"
                                  onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                                  readOnly={detail.locked}
                                />
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {/* MULTI */}
                      {q.questionType === "MULTI" && (q.options?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          {(q.options ?? []).map((opt) => {
                            const selected =
                              Array.isArray(selectedAnswers[q.id]) &&
                              (selectedAnswers[q.id] as number[]).includes(opt.id);

                            return (
                              <div key={opt.id} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${q.id}-${opt.id}`}
                                    checked={selected}
                                    onCheckedChange={(checked) =>
                                      handleMultiOptionToggle(q.id, opt.id, Boolean(checked))
                                    }
                                    disabled={detail.locked}
                                  />
                                  <Label
                                    htmlFor={`${q.id}-${opt.id}`}
                                    className={selected ? "font-medium" : ""}
                                  >
                                    {opt.optionText}
                                  </Label>
                                </div>
                                {opt.hasInput && selected && (
                                  <Input
                                    value={customInputs[q.id] ?? ""}
                                    placeholder="내용을 입력해주세요"
                                    onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                                    readOnly={detail.locked}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TEXT */}
                      {q.questionType === "TEXT" && (
                        <Textarea
                          value={customInputs[q.id] ?? ""}
                          onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                          className="mt-3"
                          readOnly={detail.locked}
                        />
                      )}

                      {/* Additional Input */}
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                질문이 아직 등록되지 않았습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {!detail.locked && (
          <div className="flex justify-end">
            <Button
              size="lg"
              className="px-8"
              disabled={isSubmitting}
              onClick={handleSubmitAnswers}
            >
              {isSubmitting ? "제출 중..." : "제출하기"}
            </Button>
          </div>
        )}
      </div>
    </ProjectLayout>
  );
}
