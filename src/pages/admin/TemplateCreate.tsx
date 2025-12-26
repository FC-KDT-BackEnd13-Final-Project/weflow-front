import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface TemplateQuestionForm {
  id: number;
  text: string;
  type: QuestionType;
  options: Array<{ value: string; hasInput: boolean }>;
}

const TemplateCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 기본 템플릿 정보 states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // 카테고리 목록
  const [categories, setCategories] = useState([
    "쇼핑몰",
    "기업 홈페이지",
    "포트폴리오",
    "병원/의료",
    "교육/강의",
    "기타",
  ]);
  const [openAddCategory, setOpenAddCategory] = useState(false);

  // 질문 목록
  const createEmptyQuestion = (): TemplateQuestionForm => ({
    id: Date.now(),
    text: "",
    type: "single",
    options: [],
  });

  const [questions, setQuestions] = useState<TemplateQuestionForm[]>([createEmptyQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [draggingOption, setDraggingOption] = useState<{ questionId: number; index: number } | null>(null);

  // 질문 추가
  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  // 질문 삭제
  const deleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // 옵션 추가
  const addOption = (qid: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, options: [...q.options, { value: "", hasInput: false }] } : q
      )
    );
  };

  // 옵션 삭제
  const deleteOption = (qid: number, idx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q
      )
    );
  };

  const handleQuestionDragStart = (id: number) => setDraggingQuestionId(id);
  const handleQuestionDragEnd = () => setDraggingQuestionId(null);
  const handleQuestionDrop = (targetId: number) => {
    if (draggingQuestionId === null || draggingQuestionId === targetId) return;
    setQuestions((prev) => {
      const current = [...prev];
      const fromIndex = current.findIndex((q) => q.id === draggingQuestionId);
      const toIndex = current.findIndex((q) => q.id === targetId);
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
      const fromIndex = current.findIndex((q) => q.id === draggingQuestionId);
      if (fromIndex === -1) return prev;
      const [moved] = current.splice(fromIndex, 1);
      current.push(moved);
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

  // 새 카테고리 저장
  const handleAddCategory = (newCategory: string) => {
    if (!categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
    setCategory(newCategory);
  };

  const buildQuestionPayload = () =>
    questions
      .filter((question) => question.text.trim().length > 0)
      .map((question, index) => ({
        questionText: question.text.trim(),
        questionType:
          question.type === "single" ? "SINGLE" : question.type === "multi" ? "MULTI" : "TEXT",
        orderIndex: index + 1,
        options:
          question.type === "text"
            ? []
            : question.options
                .filter((option) => option.value.trim().length > 0)
                .map((option, optIdx) => ({
                  optionText: option.value.trim(),
                  orderIndex: optIdx + 1,
                  hasInput: question.type === "single" ? option.hasInput : false,
                })),
      }));

  const createTemplate = async () => {
    if (!title.trim()) {
      toast({ title: "템플릿 제목을 입력하세요.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "카테고리를 선택하세요.", variant: "destructive" });
      return;
    }
    const questionPayload = buildQuestionPayload();
    if (questionPayload.length === 0) {
      toast({ title: "최소 한 개의 질문을 추가하세요.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/checklist-templates", {
        title: title.trim(),
        description: description.trim(),
        category,
        questions: questionPayload,
      });
      toast({
        title: "템플릿 생성 완료",
        description: "새 템플릿이 저장되었습니다.",
      });
      navigate("/admin/checklist-templates");
    } catch (error) {
      toast({
        title: "템플릿 생성에 실패했습니다.",
        description: "입력값을 확인하고 다시 시도하세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* ------- 상단 헤더 ------- */}
      <h1 className="text-3xl font-bold">템플릿 생성</h1>

      {/* ------- 기본 정보 ------- */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>새로운 체크리스트 템플릿을 생성합니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="템플릿 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="템플릿 설명 입력"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c, i) => (
                    <SelectItem key={i} value={c}>
                      {c}
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

      {/* ------- 질문 목록 ------- */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>질문 목록</CardTitle>
            <CardDescription>템플릿에 포함될 질문들을 추가하세요.</CardDescription>
          </div>

          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            질문 추가
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="border rounded-lg p-4 pl-12 space-y-4 relative"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleQuestionDrop(q.id)}
            >

              {/* 삭제 버튼 */}
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                onClick={() => deleteQuestion(q.id)}
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="absolute top-4 left-4 text-muted-foreground cursor-grab"
                draggable
                onDragStart={() => handleQuestionDragStart(q.id)}
                onDragEnd={handleQuestionDragEnd}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <p className="font-medium text-gray-700">질문 #{index + 1}</p>

              {/* 질문 입력 */}
              <Input
                placeholder="질문 입력"
                value={q.text}
                onChange={(e) =>
                  setQuestions((prev) =>
                    prev.map((item) =>
                      item.id === q.id ? { ...item, text: e.target.value } : item
                    )
                  )
                }
              />

              {/* 질문 타입 선택 */}
              <Select
                value={q.type}
                onValueChange={(value) =>
                  setQuestions((prev) =>
                    prev.map((item) =>
                      item.id === q.id ? { ...item, type: value as QuestionType } : item
                    )
                  )
                }
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

              {/* 옵션 입력 (단일/다중 선택일 때) */}
              {(q.type === "single" || q.type === "multi") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {q.type === "multi" ? "옵션 목록 (복수 선택 가능)" : "옵션 목록"}
                  </p>

                  {q.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleOptionDrop(q.id, idx)}
                    >
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          className="text-muted-foreground cursor-grab"
                          draggable
                          onDragStart={() => handleOptionDragStart(q.id, idx)}
                          onDragEnd={handleOptionDragEnd}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <Input
                          placeholder="옵션 입력"
                          value={opt.value}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item) =>
                                item.id === q.id
                                  ? {
                                      ...item,
                                      options: item.options.map((o, i) =>
                                        i === idx ? { ...o, value: e.target.value } : o
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                        {q.type === "single" && (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={opt.hasInput}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((item) =>
                                    item.id === q.id
                                      ? {
                                          ...item,
                                          options: item.options.map((o, i) =>
                                            i === idx ? { ...o, hasInput: e.target.checked } : o
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
                          onClick={() => deleteOption(q.id, idx)}
                        />
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={() => addOption(q.id)}>
                    + 옵션 추가
                  </Button>

                  {q.options.length > 0 && (
                    <div
                      className="h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleOptionDropToEnd(q.id)}
                    >
                      옵션 하단으로 드래그
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div
            className="h-10 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleQuestionDropToEnd}
          >
            질문 카드를 아래로 드래그
          </div>
        </CardContent>
      </Card>

      {/* ------- 생성 버튼 ------- */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2" onClick={createTemplate} disabled={isSubmitting}>
          {isSubmitting ? "생성 중..." : "템플릿 생성"}
        </Button>
      </div>

      {/* ------- 카테고리 추가 모달 ------- */}
      <AddCategoryModal
        open={openAddCategory}
        onClose={() => setOpenAddCategory(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
};

export default TemplateCreate;
