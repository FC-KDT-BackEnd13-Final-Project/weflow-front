import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  title: string;
  type: QuestionType;
  options: { text: string; hasInput: boolean }[];
}

interface Stage {
  id: number;
  name: string;
  orderIndex: number;
}

export default function ChecklistCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const location = useLocation();
  const templateState = (location.state as { template?: any } | null)?.template;

  const mapTemplateQuestions = (templateQuestions: any[]): Question[] =>
    templateQuestions.map((question, index) => ({
      id: index + 1,
      title: question.questionText,
      type: question.questionType === "SINGLE" ? "객관식" : question.questionType === "MULTI" ? "복수선택" : "주관식",
      options:
        question.questionType === "TEXT"
          ? []
          : (question.options ?? []).map((option: any) => ({
              text: option.optionText,
              hasInput: question.questionType === "SINGLE" ? option.hasInput : false,
            })),
    }));

  const [title, setTitle] = useState(templateState?.title ?? "");
  const [description, setDescription] = useState(templateState?.description ?? "");
  const [selectedStage, setSelectedStage] = useState("");

  const [stages, setStages] = useState<Stage[]>([]);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>(
    templateState?.questions ? mapTemplateQuestions(templateState.questions) : []
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
        ? newQuestion.options.filter((option) => option.text.trim() !== "")
        : [];
    const question: Question = {
      id: questions.length + 1,
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
      questionText: question.title,
      questionType:
        question.type === "객관식" ? "SINGLE" : question.type === "복수선택" ? "MULTI" : "TEXT",
      orderIndex: index + 1,
      options:
        question.type === "객관식"
          ? question.options.map((option, optIdx) => ({
              optionText: option.text,
              hasInput: option.hasInput,
              orderIndex: optIdx + 1,
            }))
          : question.type === "복수선택"
          ? question.options.map((option, optIdx) => ({
              optionText: option.text,
              hasInput: false,
              orderIndex: optIdx + 1,
            }))
          : [],
    }));

  const handleCreateChecklist = async () => {
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

    const payload = {
      stepId: Number(selectedStage),
      title: title.trim(),
      description: description.trim(),
      questions: buildQuestionPayload(),
    };

    try {
      setIsSubmitting(true);
      await api.post("/api/checklists", payload);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">체크리스트 생성</h1>
            <p className="text-muted-foreground mt-1">프로젝트 체크리스트를 직접 구성해보세요.</p>
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
            <CardTitle className="text-xl font-bold">{title || "체크리스트 제목"}</CardTitle>
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
          <Button onClick={handleCreateChecklist} disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "생성"}
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
