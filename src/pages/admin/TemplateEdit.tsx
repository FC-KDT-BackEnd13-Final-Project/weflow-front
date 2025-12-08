import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus, GripVertical } from "lucide-react";
import AddCategoryModal from "@/components/admin/AddCategoryModal";
import { useToast } from "@/hooks/use-toast";
import api from "@/apis/api";

type QuestionType = "single" | "multi" | "text";

interface TemplateQuestionOptionForm {
  id: number;
  optionId?: number;
  value: string;
  hasInput: boolean;
}

interface TemplateQuestionForm {
  id: number;
  questionId?: number;
  text: string;
  type: QuestionType;
  options: TemplateQuestionOptionForm[];
}

interface TemplateQuestionSource {
  questionId?: number;
  questionText: string;
  questionType: "SINGLE" | "MULTI" | "TEXT";
  orderIndex?: number;
  options: Array<{
    optionId?: number;
    optionText: string;
    hasInput: boolean;
    orderIndex?: number;
  }>;
}

const questionTypeFromApi = (type?: "SINGLE" | "MULTI" | "TEXT"): QuestionType => {
  switch (type) {
    case "MULTI":
      return "multi";
    case "TEXT":
      return "text";
    default:
      return "single";
  }
};

const questionTypeToApi = (type: QuestionType): "SINGLE" | "MULTI" | "TEXT" => {
  switch (type) {
    case "multi":
      return "MULTI";
    case "text":
      return "TEXT";
    default:
      return "SINGLE";
  }
};

const mapQuestionsFromSource = (source: TemplateQuestionSource[]): TemplateQuestionForm[] => {
  let index = 0;
  return [...source]
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((question) => ({
      id: ++index,
      questionId: question.questionId,
      text: question.questionText,
      type: questionTypeFromApi(question.questionType),
      options:
        question.questionType === "TEXT"
          ? []
          : [...(question.options ?? [])]
              .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
              .map((option, optionIdx) => ({
                id: Number(`${index}${optionIdx}`),
                optionId: option.optionId,
                value: option.optionText,
                hasInput: Boolean(option.hasInput),
              })),
    }));
};

const normalizeQuestions = (source: TemplateQuestionSource[] = []) =>
  source.map((question) => ({
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

const TemplateEdit = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([
    "쇼핑몰",
    "기업 홈페이지",
    "포트폴리오",
    "병원/의료",
    "교육/강의",
    "기타",
  ]);
  const [openAddCategory, setOpenAddCategory] = useState(false);

  const [questions, setQuestions] = useState<TemplateQuestionForm[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<TemplateQuestionSource[]>([]);
  const [originalMeta, setOriginalMeta] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [draggingOption, setDraggingOption] = useState<{ questionId: number; index: number } | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/checklist-templates/${templateId}`, {
          signal: controller.signal,
        });
        const detail = response.data?.data;
        if (!detail) throw new Error("템플릿 정보를 불러오지 못했습니다.");

        const mappedSource: TemplateQuestionSource[] = (detail.questions ?? []).map((question: any) => ({
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          orderIndex: question.orderIndex,
          options: (question.options ?? []).map((option: any) => ({
            optionId: option.optionId,
            optionText: option.optionText,
            hasInput: option.hasInput,
            orderIndex: option.orderIndex,
          })),
        }));

        setTitle(detail.title ?? "");
        setDescription(detail.description ?? "");
        setCategory(detail.category ?? "");
        setQuestions(mapQuestionsFromSource(mappedSource));
        setOriginalQuestions(mappedSource);
        setOriginalMeta({
          title: detail.title ?? "",
          description: detail.description ?? "",
          category: detail.category ?? "",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          toast({
            title: "템플릿 정보를 불러오지 못했습니다.",
            variant: "destructive",
          });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => controller.abort();
  }, [templateId, toast]);

  const createEmptyQuestion = (): TemplateQuestionForm => ({
    id: Date.now(),
    text: "",
    type: "single",
    options: [],
  });

  const handleAddCategory = (newCategory: string) => {
    setCategories((prev) => (prev.includes(newCategory) ? prev : [...prev, newCategory]));
    setCategory(newCategory);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const deleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const addOption = (questionId: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [...question.options, { id: Date.now(), value: "", hasInput: false }],
            }
          : question
      )
    );
  };

  const deleteOption = (questionId: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter((_, index) => index !== optionIndex),
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

  const handleOptionDragStart = (questionId: number, index: number) => setDraggingOption({ questionId, index });
  const handleOptionDragEnd = () => setDraggingOption(null);
  const handleOptionDrop = (questionId: number, targetIndex: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId || draggingOption.index === targetIndex) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const options = [...question.options];
        const [moved] = options.splice(draggingOption.index, 1);
        options.splice(targetIndex, 0, moved);
        return { ...question, options };
      })
    );
    setDraggingOption(null);
  };
  const handleOptionDropToEnd = (questionId: number) => {
    if (!draggingOption || draggingOption.questionId !== questionId) return;
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const options = [...question.options];
        const [moved] = options.splice(draggingOption.index, 1);
        options.push(moved);
        return { ...question, options };
      })
    );
    setDraggingOption(null);
  };

  const handleQuestionTypeChange = (questionId: number, nextType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        if (nextType === "text") {
          return { ...question, type: nextType, options: [] };
        }
        if (nextType === "multi") {
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

  const buildQuestionPayload = () =>
    questions.map((question, index) => ({
      localId: question.id,
      questionId: question.questionId,
      questionText: question.text,
      questionType: questionTypeToApi(question.type),
      orderIndex: index + 1,
      options:
        question.type === "text"
          ? []
          : question.options
              .filter((option) => option.value.trim().length > 0)
              .map((option, optIndex) => ({
                optionId: option.optionId,
                optionText: option.value.trim(),
                orderIndex: optIndex + 1,
                hasInput: question.type === "single" ? option.hasInput : false,
              })),
    }));

  const handleSubmit = async () => {
    if (!templateId) return;
    if (!title.trim()) {
      toast({ title: "템플릿 제목을 입력하세요.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "카테고리를 선택하세요.", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "최소 한 개의 질문을 추가하세요.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await updateTemplateMeta();
      await applyQuestionDiffs(Number(templateId));
      toast({
        title: "템플릿 수정 완료",
        description: "변경된 내용이 저장되었습니다.",
      });
      navigate("/admin/checklist-templates");
    } catch (error) {
      toast({
        title: "템플릿 수정에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTemplateMeta = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const metaChanged =
      trimmedTitle !== originalMeta.title ||
      trimmedDescription !== originalMeta.description ||
      category !== originalMeta.category;

    if (!metaChanged) return;

    await api.patch(`/api/checklist-templates/${templateId}`, {
      title: trimmedTitle,
      description: trimmedDescription,
      category,
    });
  };

  const applyQuestionDiffs = async (currentTemplateId: number) => {
    const currentQuestions = buildQuestionPayload();
    const orderedQuestionIds: number[] = [];
    const normalizedOriginal = normalizeQuestions(originalQuestions);
    const originalMap = new Map<number, (typeof normalizedOriginal)[number]>(
      normalizedOriginal
        .filter((question): question is (typeof normalizedOriginal)[number] & { questionId: number } =>
          Boolean(question.questionId)
        )
        .map((question) => [question.questionId!, question])
    );

    const currentExistingIds = new Set(
      currentQuestions.filter((question) => question.questionId).map((question) => question.questionId as number)
    );

    for (const original of originalQuestions) {
      if (original.questionId && !currentExistingIds.has(original.questionId)) {
        await api.delete(`/api/questions/${original.questionId}`);
      }
    }

    for (const question of currentQuestions) {
      let serverQuestionId = question.questionId;
      if (serverQuestionId) {
        await updateQuestionIfNeeded(question, originalMap.get(serverQuestionId), currentTemplateId);
      } else {
        serverQuestionId = await createQuestionOnServer(currentTemplateId, question);
        if (serverQuestionId) {
          question.questionId = serverQuestionId;
          await createOptionsForQuestion(serverQuestionId, question);
        }
      }
      if (typeof serverQuestionId === "number") {
        orderedQuestionIds.push(serverQuestionId);
      }
    }

    if (orderedQuestionIds.length > 0) {
      await api.patch("/api/questions/reorder", {
        checklistId: currentTemplateId,
        orderedIds: orderedQuestionIds,
      });
    }
  };

  const createQuestionOnServer = async (
    currentTemplateId: number,
    question: ReturnType<typeof buildQuestionPayload>[number]
  ): Promise<number | null> => {
    const response = await api.post("/api/questions", {
      checklistId: currentTemplateId,
      questionText: question.questionText,
      questionType: question.questionType,
    });
    const createdId =
      response.data?.data?.questionId ??
      response.data?.data?.id ??
      response.data?.questionId ??
      response.data?.id;
    if (typeof createdId !== "number") {
      console.warn("새 질문 ID를 가져오지 못했습니다.", response.data);
      return null;
    }
    return createdId;
  };

  const updateQuestionIfNeeded = async (
    question: ReturnType<typeof buildQuestionPayload>[number],
    original: TemplateQuestionSource | undefined,
    currentTemplateId: number
  ) => {
    const questionId = question.questionId;
    if (!questionId) return;

    if (
      !original ||
      original.questionText !== question.questionText ||
      original.questionType !== question.questionType
    ) {
      await api.patch(`/api/questions/${questionId}`, {
        checklistId: currentTemplateId,
        questionText: question.questionText,
        questionType: question.questionType,
      });
    }

    await syncOptionsForQuestion(
      questionId,
      question.questionType,
      question.options,
      original?.options ?? []
    );
  };

  const createOptionsForQuestion = async (
    questionId: number,
    question: ReturnType<typeof buildQuestionPayload>[number]
  ) => {
    if (question.questionType === "TEXT") return;
    for (const [index, option] of question.options.entries()) {
      await createOptionOnServer(questionId, question.questionType, option, index);
    }
  };

  const createOptionOnServer = async (
    questionId: number,
    questionType: "SINGLE" | "MULTI" | "TEXT",
    option: { optionId?: number; optionText: string; orderIndex: number; hasInput: boolean },
    index: number
  ): Promise<number | null> => {
    const response = await api.post("/api/options", {
      questionId,
      optionText: option.optionText,
      hasInput: questionType === "SINGLE" ? Boolean(option.hasInput) : false,
      orderIndex: index + 1,
    });
    const createdId =
      response.data?.data?.optionId ??
      response.data?.data?.id ??
      response.data?.optionId ??
      response.data?.id;
    if (typeof createdId !== "number") {
      console.warn("새 옵션 ID를 가져오지 못했습니다.", response.data);
      return null;
    }
    return createdId;
  };

  const syncOptionsForQuestion = async (
    questionId: number,
    questionType: "SINGLE" | "MULTI" | "TEXT",
    currentOptions: Array<{ optionId?: number; optionText: string; orderIndex: number; hasInput: boolean }>,
    originalOptions: Array<{ optionId?: number; optionText: string; hasInput: boolean }>
  ) => {
    if (questionType === "TEXT") {
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

    const orderedIds: Array<number | null> = currentOptions.map((option) => option.optionId ?? null);

    for (const [index, option] of currentOptions.entries()) {
      if (option.optionId) {
        const original = originalOptions.find((item) => item.optionId === option.optionId);
        const normalizedHasInput = questionType === "SINGLE" ? Boolean(option.hasInput) : false;
        if (
          !original ||
          original.optionText !== option.optionText ||
          Boolean(original.hasInput) !== normalizedHasInput
        ) {
          await api.put(`/api/options/${option.optionId}`, {
            questionId,
            optionText: option.optionText,
            hasInput: normalizedHasInput,
            orderIndex: index + 1,
          });
        }
      } else {
        const newId = await createOptionOnServer(questionId, questionType, option, index);
        if (newId) {
          orderedIds[index] = newId;
        }
      }
    }

    const previousOrder = (originalOptions ?? [])
      .map((option) => option.optionId)
      .filter((id): id is number => typeof id === "number");
    const currentOrder = orderedIds.filter((id): id is number => typeof id === "number");

    const orderChanged =
      previousOrder.length !== currentOrder.length ||
      previousOrder.some((id, index) => id !== currentOrder[index]);

    if (orderChanged && currentOrder.length > 0) {
      await api.patch("/api/options/reorder", {
        questionId,
        orderedIds: currentOrder,
      });
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">템플릿 정보를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">템플릿 수정</h1>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>템플릿의 기본 정보를 수정할 수 있습니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="템플릿 제목"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <Textarea
            placeholder="템플릿 설명 입력"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => setOpenAddCategory(true)}>
              + 새 카테고리
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>질문 목록</CardTitle>
            <CardDescription>질문을 추가하거나 기존 내용을 수정하세요.</CardDescription>
          </div>

          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            질문 추가
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="border rounded-lg p-4 pl-12 space-y-4 relative"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleQuestionDrop(question.id)}
            >
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                onClick={() => deleteQuestion(question.id)}
              >
                <Trash2 className="w-5 h-5" />
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

              <p className="font-medium text-gray-700">질문 #{index + 1}</p>

              <Input
                placeholder="질문 입력"
                value={question.text}
                onChange={(event) =>
                  setQuestions((prev) =>
                    prev.map((item) =>
                      item.id === question.id ? { ...item, text: event.target.value } : item
                    )
                  )
                }
              />

              <Select
                value={question.type}
                onValueChange={(value) => handleQuestionTypeChange(question.id, value as QuestionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="질문 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">단일 선택</SelectItem>
                  <SelectItem value="multi">다중 선택</SelectItem>
                  <SelectItem value="text">서술형</SelectItem>
                </SelectContent>
              </Select>

              {(question.type === "single" || question.type === "multi") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {question.type === "multi" ? "옵션 목록 (복수 선택 가능)" : "옵션 목록"}
                  </p>

                  {question.options.map((option, idx) => (
                    <div
                      key={option.id}
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
                          value={option.value}
                          onChange={(event) =>
                            setQuestions((prev) =>
                              prev.map((item) =>
                                item.id === question.id
                                  ? {
                                      ...item,
                                      options: item.options.map((opt, optionIndex) =>
                                        optionIndex === idx ? { ...opt, value: event.target.value } : opt
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                        {question.type === "single" && (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={option.hasInput}
                              onChange={(event) =>
                                setQuestions((prev) =>
                                  prev.map((item) =>
                                    item.id === question.id
                                      ? {
                                          ...item,
                                          options: item.options.map((opt, optionIndex) =>
                                            optionIndex === idx ? { ...opt, hasInput: event.target.checked } : opt
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                            />
                            기타 입력 허용
                          </label>
                        )}
                        <Trash2
                          className="w-4 h-4 text-red-500 cursor-pointer"
                          onClick={() => deleteOption(question.id, idx)}
                        />
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>
                    + 옵션 추가
                  </Button>
                  {question.options.length > 0 && (
                    <div
                      className="h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleOptionDropToEnd(question.id)}
                    >
                      옵션 하단으로 드래그
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {questions.length > 0 && (
            <div
              className="h-10 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleQuestionDropToEnd}
            >
              질문 카드를 아래로 드래그
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" className="gap-2" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "수정 중..." : "템플릿 수정"}
        </Button>
      </div>

      <AddCategoryModal
        open={openAddCategory}
        onClose={() => setOpenAddCategory(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
};

export default TemplateEdit;
