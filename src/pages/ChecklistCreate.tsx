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
import { Plus, Trash2, GripVertical } from "lucide-react";
import { checklistsApi } from "@/apis/checklists";
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
  orderIndex?: number;
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
    orderIndex: question.orderIndex,
    options: (question.options ?? []).map((option) => ({
      optionId: option.optionId,
      optionText: option.optionText,
      hasInput: option.hasInput,
      orderIndex: option.orderIndex,
    })),
  }));

const mapQuestionsFromSource = (source?: QuestionSource[], includeIds = false): Question[] => {
  const sortedQuestions = [...(source ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );

  return sortedQuestions.map((question, index) => {
    const normalizedType = questionTypeFromApi(question.questionType);
    const sortedOptions = [...(question.options ?? [])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );

    const options =
      normalizedType === "주관식"
        ? []
        : sortedOptions.map((option) => ({
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
};

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
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [draggingOption, setDraggingOption] = useState<{ questionId: number; index: number } | null>(null);

  const [title, setTitle] = useState(checklistState?.title ?? templateState?.title ?? "");
  const [description, setDescription] = useState(checklistState?.description ?? templateState?.description ?? "");
  const [selectedStage, setSelectedStage] = useState(
    checklistState?.stepId ? String(checklistState.stepId) : ""
  );

  const [stages, setStages] = useState<Stage[]>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const createEmptyQuestion = (nextId: number): Question => ({
    id: nextId,
    title: "",
    type: "객관식",
    options: [],
  });

  const initialQuestions =
    checklistState?.questions
      ? mapQuestionsFromSource(checklistState.questions, true)
      : mapQuestionsFromSource(templateState?.questions);

  const [questions, setQuestions] = useState<Question[]>(initialQuestions.length > 0 ? initialQuestions : [createEmptyQuestion(1)]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchSteps = async () => {
      try {
        setIsStageLoading(true);
        setStageError(null);
        const response = await checklistsApi.fetchProjectSteps(id!, { signal: controller.signal });
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
        const response = await checklistsApi.getDetail(checklistState.checklistId, {
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

  const handleRemoveQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAddQuestion = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    setQuestions((prev) => [...prev, createEmptyQuestion(nextId)]);
  };

  const handleQuestionTitleChange = (id: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === id ? { ...question, title: value } : question))
    );
  };

  const handleQuestionTypeChange = (id: number, nextType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question;
        if (nextType === "주관식") {
          return { ...question, type: nextType, options: [] };
        }
        if (nextType === "복수선택") {
          return {
            ...question,
            type: nextType,
            options: question.options.map((option) => ({ ...option, hasInput: false })),
          };
        }
        return { ...question, type: nextType };
      })
    );
  };

  const handleAddOption = (id: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? { ...question, options: [...question.options, { text: "", hasInput: false }] }
          : question
      )
    );
  };

  const handleOptionChange = (questionId: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, idx) => (idx === optionIndex ? { ...option, text: value } : option)),
            }
          : question
      )
    );
  };

  const handleOptionHasInputToggle = (questionId: number, optionIndex: number, checked: boolean) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, idx) =>
                idx === optionIndex ? { ...option, hasInput: checked } : option
              ),
            }
          : question
      )
    );
  };

  const handleDeleteOption = (questionId: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter((_, idx) => idx !== optionIndex),
            }
          : question
      )
    );
  };

  const handleQuestionDragStart = (id: number) => setDraggingQuestionId(id);
  const handleQuestionDragEnd = () => setDraggingQuestionId(null);
  const handleQuestionDrop = (targetId: number) => {
    if (draggingQuestionId === null || draggingQuestionId === targetId) return;
    setQuestions((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((question) => question.id === draggingQuestionId);
      const toIndex = current.findIndex((question) => question.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return current;
    });
    setDraggingQuestionId(null);
  };

  const handleOptionDragStart = (questionId: number, index: number) => {
    setDraggingOption({ questionId, index });
  };

  const handleOptionDragEnd = () => setDraggingOption(null);

  const handleOptionDrop = (questionId: number, targetIndex: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId || draggingOption.index === targetIndex) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const currentOptions = [...question.options];
        const [moved] = currentOptions.splice(draggingOption.index, 1);
        currentOptions.splice(targetIndex, 0, moved);
        return { ...question, options: currentOptions };
      })
    );
    setDraggingOption(null);
  };

  const handleQuestionDropToEnd = () => {
    if (draggingQuestionId === null) return;
    setQuestions((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((question) => question.id === draggingQuestionId);
      if (fromIndex === -1) return prev;
      const [moved] = current.splice(fromIndex, 1);
      current.push(moved);
      return current;
    });
    setDraggingQuestionId(null);
  };

  const handleOptionDropToEnd = (questionId: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const currentOptions = [...question.options];
        const [moved] = currentOptions.splice(draggingOption.index, 1);
        currentOptions.push(moved);
        return { ...question, options: currentOptions };
      })
    );
    setDraggingOption(null);
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
      await checklistsApi.createChecklist({
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
        await checklistsApi.updateChecklist(checklistId, {
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

    const orderedQuestionIds: number[] = [];

    for (const original of originalQuestions) {
      if (original.questionId && !currentQuestionIds.has(original.questionId)) {
        await checklistsApi.deleteQuestion(original.questionId);
      }
    }

    for (const question of questions) {
      if (question.questionId) {
        await updateQuestionIfNeeded(question, originalMap.get(question.questionId), checklistId);
        orderedQuestionIds.push(question.questionId);
      } else {
        const createdId = await createQuestionOnServer(checklistId, question);
        question.questionId = createdId;
        orderedQuestionIds.push(createdId);
        await createOptionsForQuestion(createdId, question.type, question.options);
      }
    }

    if (orderedQuestionIds.length > 0) {
      await checklistsApi.reorderQuestions({
        checklistId,
        orderedIds: orderedQuestionIds,
      });
    }
  };

  const createQuestionOnServer = async (checklistId: number, question: Question) => {
    const response = await checklistsApi.createQuestion({
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
      await checklistsApi.updateQuestion(questionId, {
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
    const response = await checklistsApi.createOption({
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
          await checklistsApi.deleteOption(option.optionId);
        }
      }
      return;
    }

    const existingIds = new Set(
      currentOptions.filter((option) => option.optionId).map((option) => option.optionId as number)
    );
    for (const option of originalOptions) {
      if (option.optionId && !existingIds.has(option.optionId)) {
        await checklistsApi.deleteOption(option.optionId);
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
          await checklistsApi.updateOption(option.optionId, {
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
      await checklistsApi.reorderOptions({
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
                <Button size="sm" onClick={handleAddQuestion} className="gap-2">
                  <Plus className="h-4 w-4" /> 질문 추가
                </Button>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded bg-background p-4 pl-12 space-y-4 border relative"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleQuestionDrop(question.id)}
                  >
                    <button
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      className="absolute top-4 left-4 text-muted-foreground cursor-grab"
                      draggable
                      onDragStart={() => handleQuestionDragStart(question.id)}
                      onDragEnd={handleQuestionDragEnd}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <p className="font-semibold text-gray-700">질문 #{index + 1}</p>

                    <Input
                      placeholder="질문을 입력하세요"
                      value={question.title}
                      onChange={(event) => handleQuestionTitleChange(question.id, event.target.value)}
                    />

                    <Select
                      value={question.type}
                      onValueChange={(value) => handleQuestionTypeChange(question.id, value as QuestionType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="질문 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="객관식">객관식</SelectItem>
                        <SelectItem value="복수선택">복수선택</SelectItem>
                        <SelectItem value="주관식">주관식</SelectItem>
                      </SelectContent>
                    </Select>

                    {(question.type === "객관식" || question.type === "복수선택") && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          {question.type === "복수선택" ? "옵션 목록 (복수 선택 가능)" : "옵션 목록"}
                        </p>
                        {question.options.map((option, idx) => (
                          <div
                            key={`${question.id}-${idx}`}
                            className="flex flex-col gap-2"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleOptionDrop(question.id, idx)}
                          >
                            <div className="flex gap-2 items-center">
                              <button
                                type="button"
                                className="text-muted-foreground cursor-grab"
                                draggable
                                onDragStart={() => handleOptionDragStart(question.id, idx)}
                                onDragEnd={handleOptionDragEnd}
                              >
                                <GripVertical className="h-4 w-4" />
                              </button>
                              <Input
                                placeholder="옵션 입력"
                                value={option.text}
                                onChange={(event) =>
                                  handleOptionChange(question.id, idx, event.target.value)
                                }
                              />
                              {question.type === "객관식" && (
                                <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={option.hasInput}
                                    onChange={(event) =>
                                      handleOptionHasInputToggle(question.id, idx, event.target.checked)
                                    }
                                  />
                                  기타 입력 허용
                                </label>
                              )}
                              <Trash2
                                className="w-4 h-4 text-red-500 cursor-pointer"
                                onClick={() => handleDeleteOption(question.id, idx)}
                              />
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => handleAddOption(question.id)}>
                          + 옵션 추가
                        </Button>
                        <div
                          className="h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleOptionDropToEnd(question.id)}
                        >
                          하단으로 드래그
                        </div>
                      </div>
                    )}

                    {question.type === "주관식" && (
                      <p className="text-xs text-muted-foreground">
                        주관식 질문 · 별도의 선택지가 없습니다.
                      </p>
                    )}
                  </div>
                ))}
                <div
                  className="h-8 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleQuestionDropToEnd}
                >
                  카드 하단으로 드래그
                </div>
              </div>
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
    </ProjectLayout>
  );
}
