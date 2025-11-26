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
import { mockChecklists } from "./Checklist";

type QuestionType = "SINGLE" | "MULTI" | "TEXT";

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
  questionType: QuestionType;
  options: ChecklistOption[];
  answer?: ChecklistAnswer;
}

interface ChecklistDetailResponse {
  checklistId: number;
  title: string;
  locked: boolean;
  questions: ChecklistQuestion[];
}

const mockChecklistDetails: Record<number, ChecklistDetailResponse> = {
  1: {
    checklistId: 1,
    title: "기획 단계 사전 질문지",
    locked: true,
    questions: [
      {
        id: 101,
        questionText: "Q1. 필수 기능의 우선순위를 선택해주세요.",
        questionType: "SINGLE",
        options: [
          { id: 2001, optionText: "핵심 기능만 먼저 개발(MVP 우선)", hasInput: false },
          { id: 2002, optionText: "완성형 기능을 한 번에 구축", hasInput: false },
          { id: 2003, optionText: "기타 (직접 입력)", hasInput: true },
        ],
        answer: {
          selectedOptionId: 2001,
        },
      },
      {
        id: 102,
        questionText: "Q2. 타겟 사용자층을 선택해주세요.",
        questionType: "SINGLE",
        options: [
          { id: 2010, optionText: "일반 소비자(B2C)", hasInput: false },
          { id: 2011, optionText: "기업 고객(B2B)", hasInput: false },
          { id: 2012, optionText: "내부 직원용", hasInput: false },
          { id: 2013, optionText: "기타(직접 입력)", hasInput: true },
        ],
        answer: {
          selectedOptionId: 2010,
        },
      },
      {
        id: 103,
        questionText: "Q3. 참고하고 싶은 레퍼런스 사이트가 있나요?",
        questionType: "SINGLE",
        options: [
          { id: 2020, optionText: "있음", hasInput: false },
          { id: 2021, optionText: "없음", hasInput: false },
          { id: 2022, optionText: "기타(직접 입력)", hasInput: true },
        ],
        answer: {
          selectedOptionId: 2022,
          answerText: "adload.com",
        },
      },
    ],
  },
  2: {
    checklistId: 2,
    title: "디자인 가이드 입력",
    locked: false,
    questions: [
      {
        id: 201,
        questionText: "Q1. 브랜드 컬러 가이드는 준비되어 있나요?",
        questionType: "SINGLE",
        options: [
          { id: 3001, optionText: "있음 (HEX/RGB 제공 가능)", hasInput: false },
          { id: 3002, optionText: "일부 있음 (기본 색상만 존재)", hasInput: false },
          { id: 3003, optionText: "없음 (새로 제안 원함)", hasInput: true },
        ],
      },
      {
        id: 202,
        questionText: "Q2. 전체 UI 스타일 방향을 선택해주세요.",
        questionType: "MULTI",
        options: [
          { id: 3010, optionText: "심플·미니멀 스타일", hasInput: false },
          { id: 3011, optionText: "기업(B2B) 포털 스타일", hasInput: false },
          { id: 3012, optionText: "기타(직접 입력)", hasInput: true },
        ],
        answer: {
          selectedOptionIds: [3010, 3012],
          answerText: "",
        },
      },
      {
        id: 203,
        questionText: "Q3. 추가로 공유하고 싶은 디자인 참고 사항이 있나요?",
        questionType: "TEXT",
        options: [],
        answer: {
          answerText: "",
        },
      },
    ],
  },
  3: {
    checklistId: 3,
    title: "개발 환경 요구사항",
    locked: true,
    questions: [],
  },
};

export default function ChecklistDetail() {
  const { id, checklistId } = useParams();
  const navigate = useNavigate();

  const checklist = mockChecklists.find(item => item.id === Number(checklistId));
  const detail = mockChecklistDetails[Number(checklistId)];
  const questions = detail?.questions || [];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[] | undefined>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const answers: Record<number, number | number[]> = {};
    const inputs: Record<number, string> = {};

    questions.forEach((question) => {
      if (question.answer?.selectedOptionId) {
        answers[question.id] = question.answer.selectedOptionId;
      }
      if (question.answer?.selectedOptionIds) {
        answers[question.id] = question.answer.selectedOptionIds;
      }
      if (question.answer?.answerText) {
        inputs[question.id] = question.answer.answerText;
      }
    });

    setSelectedAnswers(answers);
    setCustomInputs(inputs);
  }, [questions]);

  const handleSingleOptionChange = (questionId: number, value: string) => {
    if (detail?.locked) return;

    const numericValue = Number(value);
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: numericValue }));
    const question = questions.find(q => q.id === questionId);
    const selectedOption = question?.options.find(option => option.id === numericValue);
    if (!selectedOption?.hasInput) {
      setCustomInputs((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleMultiOptionToggle = (questionId: number, optionId: number, checked: boolean) => {
    if (detail?.locked) return;

    setSelectedAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] as number[] : [];
      let nextOptions: number[];

      if (checked) {
        nextOptions = current.includes(optionId) ? current : [...current, optionId];
      } else {
        nextOptions = current.filter((id) => id !== optionId);
      }

      const question = questions.find((q) => q.id === questionId);
      const hasInputSelected = question?.options.some(opt => nextOptions.includes(opt.id) && opt.hasInput);

      if (!hasInputSelected) {
        setCustomInputs((prevInputs) => {
          const updated = { ...prevInputs };
          delete updated[questionId];
          return updated;
        });
      }

      return { ...prev, [questionId]: nextOptions };
    });
  };

  const handleCustomInputChange = (questionId: number, value: string) => {
    if (detail?.locked) return;
    setCustomInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const shouldShowAdditionalInput = (question: ChecklistQuestion) => {
    if (question.questionType === "TEXT") {
      return true;
    }

    if (question.questionType === "SINGLE") {
      const selected = selectedAnswers[question.id];
      const selectedOption = question.options.find(opt => opt.id === selected);
      return !!selectedOption?.hasInput;
    }

    if (question.questionType === "MULTI") {
      const selected = selectedAnswers[question.id];
      if (Array.isArray(selected)) {
        return question.options.some(opt => selected.includes(opt.id) && opt.hasInput);
      }
    }

    return false;
  };

  if (!checklist || !detail) {
    return (
      <ProjectLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">체크리스트를 찾을 수 없습니다.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(`/project/${id}/checklist`)}
          >
            목록으로 돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="space-y-6">
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

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{checklist.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">질문 {checklist.count}개</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1",
                  checklist.status === "complete" && "bg-status-complete-bg text-status-complete border-status-complete",
                  checklist.status === "pending" && "bg-blue-50 text-blue-600 border-blue-200"
                )}
              >
                {checklist.status === "complete" && "완료"}
                {checklist.status === "pending" && "대기"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {questions.length > 0 ? (
              questions.map((question) => (
                <Card key={question.id} className="border-2">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-4">{question.questionText}</h4>

                    {question.questionType === "SINGLE" && (
                      <RadioGroup
                        value={selectedAnswers[question.id]?.toString() || ""}
                        onValueChange={(value) => handleSingleOptionChange(question.id, value)}
                        className="space-y-3"
                      >
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={option.id.toString()} 
                              id={`${question.id}-${option.id}`}
                              className={cn(
                                selectedAnswers[question.id] === option.id && "border-foreground"
                              )}
                              disabled={detail?.locked}
                            />
                            <Label 
                              htmlFor={`${question.id}-${option.id}`}
                              className={cn(
                                "cursor-pointer",
                                selectedAnswers[question.id] === option.id && "font-medium"
                              )}
                            >
                              {option.optionText}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.questionType === "MULTI" && (
                      <div className="space-y-3">
                        {question.options.map((option) => {
                          const selected = Array.isArray(selectedAnswers[question.id]) && (selectedAnswers[question.id] as number[]).includes(option.id);
                          return (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${question.id}-${option.id}`}
                                checked={selected}
                                onCheckedChange={(checked) => handleMultiOptionToggle(question.id, option.id, Boolean(checked))}
                                disabled={detail?.locked}
                              />
                              <Label
                                htmlFor={`${question.id}-${option.id}`}
                                className={cn("cursor-pointer", selected && "font-medium")}
                              >
                                {option.optionText}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.questionType === "TEXT" && (
                      <Textarea
                        value={customInputs[question.id] || ""}
                        onChange={(event) => handleCustomInputChange(question.id, event.target.value)}
                        placeholder="내용을 입력해주세요"
                        className="mt-3"
                        readOnly={detail?.locked}
                      />
                    )}

                    {question.questionType !== "TEXT" && shouldShowAdditionalInput(question) && (
                      <Input 
                        value={customInputs[question.id] || ""} 
                        className="mt-3" 
                        placeholder="내용을 입력해주세요"
                        onChange={(event) => handleCustomInputChange(question.id, event.target.value)}
                        readOnly={detail?.locked}
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                질문이 아직 등록되지 않았습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
