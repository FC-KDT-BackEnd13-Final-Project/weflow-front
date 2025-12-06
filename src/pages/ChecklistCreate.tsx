import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import api from "@/apis/api";
import { useToast } from "@/hooks/use-toast";

type QuestionType = "객관식" | "복수선택" | "주관식";

interface Question {
  id: number;
  questionId?: number;
  title: string;
  type: QuestionType;
  options: { text: string; hasInput: boolean; optionId?: number }[];
}

interface Stage {
  id: number;
  name: string;
  orderIndex: number;
}

interface QuestionSourceOption {
  optionId?: number;
  optionText?: string;
  hasInput?: boolean;
  orderIndex?: number;
}

interface QuestionSource {
  questionId?: number;
  questionText?: string;
  questionType?: "SINGLE" | "MULTI" | "TEXT";
  options?: QuestionSourceOption[];
}

interface ChecklistStatePayload {
  checklistId: number;
  title: string;
  description?: string;
  stepId?: number;
  questions: QuestionSource[];
}

type ChecklistBasePayload = {
  stepId: number;
  title: string;
  description: string;
};

const questionTypeFromApi = (type?: "SINGLE" | "MULTI" | "TEXT"): QuestionType => {
  switch (type) {
    case "MULTI":
      return "복수선택";
    case "TEXT":
      return "주관식";
    default:
      return "객관식";
  }
};

const questionTypeToApi = (type: QuestionType): "SINGLE" | "MULTI" | "TEXT" => {
  switch (type) {
    case "복수선택":
      return "MULTI";
    case "주관식":
      return "TEXT";
    default:
      return "SINGLE";
  }
};

const normalizeQuestionSources = (source?: QuestionSource[]): QuestionSource[] =>
  (source ?? []).map((question) => ({
    questionId: question.questionId,
    questionText: question.questionText,
    questionType: question.questionType,
    options: (question.options ?? []).map((option) => ({
      optionId: option.optionId,
      optionText: option.optionText,
      hasInput: option.hasInput,
      orderIndex: option.orderIndex,
    })),
  }));

const mapQuestionsFromSource = (source?: QuestionSource[], includeIds = false): Question[] =>
  (source ?? []).map((question, index) => {
    const normalizedType = questionTypeFromApi(question.questionType);
    const options =
      normalizedType === "주관식"
        ? []
        : (question.options ?? []).map((option) => ({
            text: option.optionText ?? "",
            hasInput: normalizedType === "객관식" ? Boolean(option.hasInput) : false,
            optionId: includeIds ? option.optionId : undefined,
          }));

    return {
      id: index + 1,
      questionId: includeIds ? question.questionId : undefined,
      title: question.questionText ?? "",
      type: normalizedType,
      options,
    };
  });

const buildChecklistPayloadFromDetail = (detail: any): ChecklistStatePayload => ({
  checklistId: detail.checklistId,
  title: detail.title ?? "",
  description: detail.description ?? "",
  stepId: detail.stepId,
  questions: normalizeQuestionSources(detail.questions ?? []),
});

export default function ChecklistCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const location = useLocation();
  const locationState = (location.state as { template?: { title: string; description: string; questions: QuestionSource[] }; checklist?: ChecklistStatePayload } | null) ?? null;
  const templateState = locationState?.template;
  const checklistState = locationState?.checklist;
  const isEditMode = Boolean(checklistState);
  const initialOriginalData = checklistState
    ? {
        checklistId: checklistState.checklistId,
        title: checklistState.title,
        description: checklistState.description,
        stepId: checklistState.stepId,
        questions: normalizeQuestionSources(checklistState.questions),
      }
    : null;
  const [originalData, setOriginalData] = useState<ChecklistStatePayload | null>(initialOriginalData);
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);

  const [title, setTitle] = useState(checklistState?.title ?? templateState?.title ?? "");
  const [description, setDescription] = useState(checklistState?.description ?? templateState?.description ?? "");
  const [selectedStage, setSelectedStage] = useState(
    checklistState?.stepId ? String(checklistState.stepId) : ""
  );

  const [stages, setStages] = useState<Stage[]>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>(
    checklistState?.questions
      ? mapQuestionsFromSource(checklistState.questions, true)
      : mapQuestionsFromSource(templateState?.questions)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    type: "객관식" as QuestionType,
    options: [{ text: "", hasInput: false }],
  });

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchSteps = async () => {
      try {
        setIsStageLoading(true);
        setStageError(null);
        const response = await api.get(`api/projects/${id}/steps`, {
          signal: controller.signal,
        });
        const data = response.data?.data?.steps ?? response.data?.data;
        if (!Array.isArray(data)) throw new Error("단계 정보가 없습니다.");
        const mapped: Stage[] = data.map((step: any) => ({
          id: step.id,
          name: step.title ?? step.name,
          orderIndex: step.orderIndex ?? step.order ?? 0,
        }));
        const sorted = mapped.sort((a, b) => a.orderIndex - b.orderIndex);
        setStages(sorted);
        setSelectedStage((prev) => prev || (sorted[0] ? String(sorted[0].id) : ""));
      } catch (error) {
        if (!controller.signal.aborted) {
          setStageError("단계 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsStageLoading(false);
      }
    };
    fetchSteps();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!isEditMode || !checklistState?.checklistId) {
      setIsInitialLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchOriginal = async () => {
      try {
        setIsInitialLoading(true);
        const response = await api.get(`/api/checklists/${checklistState.checklistId}`, {
          signal: controller.signal,
        });
        const detail = response.data?.data;
        if (!detail) throw new Error("체크리스트 정보를 찾을 수 없습니다.");

        const normalized = buildChecklistPayloadFromDetail(detail);
        setOriginalData(normalized);
        setTitle(normalized.title ?? "");
        setDescription(normalized.description ?? "");
        setSelectedStage(normalized.stepId ? String(normalized.stepId) : "");
        setQuestions(mapQuestionsFromSource(normalized.questions, true));
      } catch (error) {
        if (!controller.signal.aborted) {
          toast({
            title: "체크리스트 정보를 불러오지 못했습니다.",
            variant: "destructive",
          });
        }
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      }
    };

    fetchOriginal();
    return () => controller.abort();
  }, [isEditMode, checklistState?.checklistId, toast]);

  const handleQuestionTypeChange = (value: QuestionType) => {
    setNewQuestion((prev) => {
      const baseOptions =
        value === "주관식"
          ? []
          : (prev.options.length > 0 ? prev.options : [{ text: "", hasInput: false }]).map(
              (option) => ({
                text: option.text,
                hasInput: value === "객관식" ? option.hasInput : false,
              })
            );
      return {
        ...prev,
        type: value,
        options: baseOptions,
      };
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.title.trim()) return;
    const options =
      newQuestion.type !== "주관식"
        ? newQuestion.options
            .filter((option) => option.text.trim() !== "")
            .map((option) => ({ ...option, optionId: undefined }))
        : [];
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const question: Question = {
      id: nextId,
      title: newQuestion.title,
      type: newQuestion.type,
      options,
    };
    setQuestions((prev) => [...prev, question]);
    setNewQuestion({ title: "", type: "객관식", options: [{ text: "", hasInput: false }] });
    setShowQuestionDialog(false);
  };

  const handleAddOption = () => {
    setNewQuestion((prev) => ({ ...prev, options: [...prev.options, { text: "", hasInput: false }] }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewQuestion((prev) => {
      const next = [...prev.options];
      next[index] = { ...next[index], text: value };
      return { ...prev, options: next };
    });
  };

  const handleOptionHasInputToggle = (index: number, checked: boolean) => {
    setNewQuestion((prev) => {
      const next = [...prev.options];
      next[index] = { ...next[index], hasInput: checked };
      return { ...prev, options: next };
    });
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const buildQuestionPayload = () =>
    questions.map((question, index) => ({
      questionId: question.questionId,
      questionText: question.title,
      questionType: questionTypeToApi(question.type),
      orderIndex: index + 1,
      options:
        question.type === "주관식"
          ? []
          : question.options.map((option, optIdx) => ({
              optionId: option.optionId,
              optionText: option.text,
              hasInput: question.type === "객관식" ? option.hasInput : false,
              orderIndex: optIdx + 1,
            })),
    }));

  const handleSubmitChecklist = async () => {
    if (!id) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: "제목과 설명을 입력해주세요." });
      return;
    }
    if (!selectedStage) {
      toast({ title: "단계를 선택해주세요." });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "최소 한 개 이상의 질문을 추가해주세요." });
      return;
    }

    const basePayload = {
      stepId: Number(selectedStage),
      title: title.trim(),
      description: description.trim(),
    };

    try {
      setIsSubmitting(true);
      if (!isEditMode) {
        await handleCreateChecklist(basePayload);
      } else {
        await handleEditChecklist(basePayload);
      }
    } catch {
      // 에러 토스트는 각 함수에서 처리
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChecklist = async (basePayload: ChecklistBasePayload) => {
    try {
      await api.post("/api/checklists", {
        ...basePayload,
        questions: buildQuestionPayload(),
      });
      toast({
        title: "체크리스트가 생성되었습니다.",
      });
      navigate(`/project/${id}/checklist`);
    } catch (error) {
      toast({
        title: "체크리스트 생성 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditChecklist = async (basePayload: ChecklistBasePayload) => {
    if (!checklistState?.checklistId) return;
    const checklistId = checklistState.checklistId;
    try {
      const metaChanged =
        !originalData ||
        originalData.title !== basePayload.title ||
        (originalData.description ?? "") !== basePayload.description ||
        (originalData.stepId ?? null) !== basePayload.stepId;

      if (metaChanged) {
        await api.patch(`/api/checklists/${checklistId}`, {
          checklistId,
          ...basePayload,
        });
      }

      await applyQuestionDiffs(checklistId);

      toast({
        title: "체크리스트가 수정되었습니다.",
      });
      navigate(`/project/${id}/checklist/${checklistId}`);
    } catch (error) {
      toast({
        title: "체크리스트 수정 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const applyQuestionDiffs = async (checklistId: number) => {
    const originalQuestions = normalizeQuestionSources(originalData?.questions);
    const originalMap = new Map<number, QuestionSource>(
      originalQuestions
        .filter((question): question is QuestionSource & { questionId: number } => Boolean(question.questionId))
        .map((question) => [question.questionId!, question])
    );

    const currentQuestionIds = new Set(
      questions.filter((question) => question.questionId).map((question) => question.questionId as number)
    );

    for (const original of originalQuestions) {
      if (original.questionId && !currentQuestionIds.has(original.questionId)) {
        await api.delete(`/api/questions/${original.questionId}`);
      }
    }

    for (const question of questions) {
      if (question.questionId) {
        await updateQuestionIfNeeded(question, originalMap.get(question.questionId), checklistId);
      } else {
        const createdId = await createQuestionOnServer(checklistId, question);
        await createOptionsForQuestion(createdId, question.type, question.options);
      }
    }
  };

  const createQuestionOnServer = async (checklistId: number, question: Question) => {
    const response = await api.post("/api/questions", {
      checklistId,
      questionText: question.title,
      questionType: questionTypeToApi(question.type),
    });
    const createdId = response.data?.data?.questionId ?? response.data?.data?.id;
    if (typeof createdId !== "number") {
      throw new Error("질문 ID를 가져올 수 없습니다.");
    }
    return createdId;
  };

  const updateQuestionIfNeeded = async (
    question: Question,
    original: QuestionSource | undefined,
    checklistId: number
  ) => {
    const questionId = question.questionId;
    if (!questionId) return;

    const serverType = questionTypeToApi(question.type);
    if (
      !original ||
      original.questionText !== question.title ||
      original.questionType !== serverType
    ) {
      await api.put(`/api/questions/${questionId}`, {
        checklistId,
        questionText: question.title,
        questionType: serverType,
      });
    }

    await syncOptionsForQuestion(
      questionId,
      question.type,
      question.options,
      original?.options ?? []
    );
  };

  const createOptionsForQuestion = async (
    questionId: number,
    questionType: QuestionType,
    options: Question["options"]
  ) => {
    if (questionType === "주관식") return;
    for (const [index, option] of options.entries()) {
      await createOptionOnServer(questionId, questionType, option, index);
    }
  };

  const createOptionOnServer = async (
    questionId: number,
    questionType: QuestionType,
    option: Question["options"][number],
    index: number
  ) => {
    const response = await api.post("/api/options", {
      questionId,
      optionText: option.text,
      hasInput: questionType === "객관식" ? Boolean(option.hasInput) : false,
      orderIndex: index + 1,
    });
    const createdId = response.data?.data?.optionId ?? response.data?.data?.id;
    if (typeof createdId !== "number") {
      throw new Error("옵션 ID를 가져올 수 없습니다.");
    }
    return createdId;
  };

  const syncOptionsForQuestion = async (
    questionId: number,
    questionType: QuestionType,
    currentOptions: Question["options"],
    originalOptions: QuestionSourceOption[] = []
  ) => {
    if (questionType === "주관식") {
      for (const option of originalOptions) {
        if (option.optionId) {
          await api.delete(`/api/options/${option.optionId}`);
        }
      }
      return;
    }

    const existingIds = new Set(
      currentOptions.filter((option) => option.optionId).map((option) => option.optionId as number)
    );
    for (const option of originalOptions) {
      if (option.optionId && !existingIds.has(option.optionId)) {
        await api.delete(`/api/options/${option.optionId}`);
      }
    }

    const optionIdsForOrder: Array<number | null> = currentOptions.map((option) => option.optionId ?? null);
    for (const [index, option] of currentOptions.entries()) {
      if (option.optionId) {
        const normalizedHasInput = questionType === "객관식" ? Boolean(option.hasInput) : false;
        const originalOption = originalOptions.find((item) => item.optionId === option.optionId);
        if (
          !originalOption ||
          originalOption.optionText !== option.text ||
          Boolean(originalOption.hasInput) !== normalizedHasInput
        ) {
          await api.put(`/api/options/${option.optionId}`, {
            questionId,
            optionText: option.text,
            hasInput: normalizedHasInput,
            orderIndex: index + 1,
          });
        }
      } else {
        const newId = await createOptionOnServer(questionId, questionType, option, index);
        optionIdsForOrder[index] = newId;
      }
    }

    const previousOrder = (originalOptions ?? [])
      .map((option) => option.optionId)
      .filter((id): id is number => typeof id === "number");
    const currentOrder = optionIdsForOrder.filter((id): id is number => typeof id === "number");
    const orderChanged =
      previousOrder.length !== currentOrder.length ||
      previousOrder.some((id, idx) => id !== currentOrder[idx]);

    if (orderChanged && currentOrder.length > 0) {
      await api.post("/api/options/reorder", {
        questionId,
        orderedIds: currentOrder,
      });
    }
  };

  if (isEditMode && isInitialLoading) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center text-muted-foreground">체크리스트 정보를 불러오는 중...</div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "체크리스트 수정" : "체크리스트 생성"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "체크리스트 내용을 수정할 수 있습니다." : "프로젝트 체크리스트를 직접 구성해보세요."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist/templates`)}>
              템플릿 불러오기
            </Button>
            <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist`)}>
              목록으로
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {title || (isEditMode ? "체크리스트 수정" : "체크리스트 제목")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="체크리스트 제목"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="체크리스트 설명"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">단계</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder={isStageLoading ? "단계를 불러오는 중..." : "단계를 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={String(stage.id)}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stageError && (
                <p className="text-xs text-destructive">{stageError}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">질문 생성</Label>
                <Button size="sm" onClick={() => setShowQuestionDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> 질문 추가
                </Button>
              </div>

              {questions.length > 0 && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  {questions.map((question, index) => (
                    <div key={question.id} className="rounded bg-background p-4 space-y-3 border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            Q{index + 1}. {question.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">유형 · {question.type}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {question.type !== "주관식" && question.options.length > 0 && (
                        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                          <p className="text-xs font-semibold text-muted-foreground">선택지 목록</p>
                          {question.options.map((option, idx) => (
                            <div
                              key={`${question.id}-option-${idx}`}
                              className="flex items-center gap-2 text-sm text-foreground"
                            >
                              <span className="px-2 py-0.5 rounded-full border bg-muted text-xs">
                                선택지 {idx + 1}
                              </span>
                              <span>{option.text}</span>
                              {question.type === "객관식" && option.hasInput && (
                                <Badge variant="outline" className="text-xs">
                                  기타 입력 허용
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                        {question.type === "주관식" && (
                          <p className="text-xs text-muted-foreground">
                            주관식 질문 · 별도의 선택지가 없습니다.
                          </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist`)}>
            취소
          </Button>
          <Button onClick={handleSubmitChecklist} disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "수정 중..." : "생성 중...") : isEditMode ? "수정" : "생성"}
          </Button>
        </div>
      </div>

      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>질문 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>질문 제목</Label>
              <Input value={newQuestion.title} onChange={(event) => setNewQuestion((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>질문 유형</Label>
              <RadioGroup
                value={newQuestion.type}
                onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="객관식" id="question-type-single" />
                  <Label htmlFor="question-type-single">객관식</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="복수선택" id="question-type-multi" />
                  <Label htmlFor="question-type-multi">복수선택</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="주관식" id="question-type-text" />
                  <Label htmlFor="question-type-text">주관식</Label>
                </div>
              </RadioGroup>
            </div>

            {newQuestion.type !== "주관식" && (
              <div className="space-y-2">
                <Label>선택지</Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={option.text}
                          onChange={(event) => handleOptionChange(index, event.target.value)}
                          placeholder={`선택지 ${index + 1}`}
                        />
                        {newQuestion.type === "객관식" && (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={option.hasInput}
                              onChange={(event) => handleOptionHasInputToggle(index, event.target.checked)}
                            />
                            기타 입력 허용
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" onClick={handleAddOption}>
                  + 선택지 추가
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                취소
              </Button>
              <Button onClick={handleAddQuestion}>추가</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
