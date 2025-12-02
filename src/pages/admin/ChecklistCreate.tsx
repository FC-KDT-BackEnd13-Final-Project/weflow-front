import { useState } from "react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: number;
  title: string;
  type: "객관식" | "주관식";
  options: string[];
}

interface Stage {
  id: number;
  name: string;
  order: number;
}

const ChecklistCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  const [stages, setStages] = useState<Stage[]>([
    { id: 1, name: "요구사항 정의", order: 1 },
    { id: 2, name: "화면 설계", order: 2 },
    { id: 3, name: "디자인", order: 3 },
    { id: 4, name: "개발", order: 4 },
    { id: 5, name: "테스트", order: 5 },
    { id: 6, name: "납품", order: 6 },
  ]);

  const [questions, setQuestions] = useState<Question[]>([]);

  // 단계 추가 모달
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageOrder, setStageOrder] = useState(stages.length + 1);

  // 단계 수정 모달
  const [showEditStageDialog, setShowEditStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // 질문 추가
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    type: "객관식" as "객관식" | "주관식",
    options: [""],
  });

  const handleAddStage = () => {
    if (newStageName.trim()) {
      const newStage = {
        id: stages.length + 1,
        name: newStageName,
        order: stageOrder,
      };
      setStages([...stages, newStage]);
      setNewStageName("");
      setStageOrder(stages.length + 2);
      setShowStageDialog(false);
    }
  };

  const handleEditStage = () => {
    if (editingStage && editingStage.name.trim()) {
      setStages(
        stages.map((s) => (s.id === editingStage.id ? editingStage : s))
      );
      setEditingStage(null);
      setShowEditStageDialog(false);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.title.trim()) {
      const question: Question = {
        id: questions.length + 1,
        title: newQuestion.title,
        type: newQuestion.type,
        options:
          newQuestion.type === "객관식"
            ? newQuestion.options.filter((o) => o.trim() !== "")
            : [],
      };
      setQuestions([...questions, question]);
      setNewQuestion({ title: "", type: "객관식", options: [""] });
      setShowQuestionDialog(false);
    }
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ""],
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">체크리스트 관리</h1>
          <p className="text-muted-foreground mt-1">
            체크리스트 관리 {'>'} 체크리스트 생성
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-primary"
          onClick={() => navigate("/admin/projects/1")}
        >
          + 템플릿 불러오기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title || "ClientA Web Renewal"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="체크리스트 제목"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="체크리스트 설명"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">단계</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <SelectItem key={stage.id} value={stage.name}>
                      {stage.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 질문 생성 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">질문생성</Label>
            </div>

            {questions.length > 0 && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                {questions.map((q, index) => (
                  <div key={q.id} className="flex items-start gap-3">
                    <span className="text-sm font-medium">Q{index + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm">{q.title}</p>
                      {q.type === "객관식" && q.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, i) => (
                            <div key={i} className="text-sm text-muted-foreground ml-4">
                              • {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className="mt-2 text-xs"
                      >
                        {q.type}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 질문 추가 대화상자 */}
            <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  + 질문 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>질문 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Q1.</Label>
                    <Input
                      placeholder="질문 제목을 입력"
                      value={newQuestion.title}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>답변 유형</Label>
                    <RadioGroup
                      value={newQuestion.type}
                      onValueChange={(value) =>
                        setNewQuestion({
                          ...newQuestion,
                          type: value as "객관식" | "주관식",
                        })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="객관식" id="multiple" />
                        <Label htmlFor="multiple">객관식</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="주관식" id="subjective" />
                        <Label htmlFor="subjective">주관식</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {newQuestion.type === "객관식" && (
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="선택지 1 입력"
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                          />
                          {newQuestion.options.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                const newOptions = newQuestion.options.filter(
                                  (_, i) => i !== index
                                );
                                setNewQuestion({
                                  ...newQuestion,
                                  options: newOptions,
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                        className="text-success"
                      >
                        + 선택지 추가
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() => setShowQuestionDialog(false)}
                    >
                      삭제
                    </Button>
                    <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddQuestion}>수정</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 프로젝트 단계 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                프로젝트 단계 설정
              </Label>
              <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-primary">
                    + 단계 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>단계 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stage-name">단계 이름 입력</Label>
                      <Input
                        id="stage-name"
                        placeholder="단계 이름"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage-order">순서</Label>
                      <Input
                        id="stage-order"
                        type="number"
                        value={stageOrder}
                        onChange={(e) => setStageOrder(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowStageDialog(false)}
                      >
                        취소
                      </Button>
                      <Button onClick={handleAddStage}>수정</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 프로젝트 멤버 설정 */}
            <div className="p-4 border rounded-lg">
              <div className="grid grid-cols-4 gap-4 mb-3 font-medium text-sm">
                <div>이름</div>
                <div>소속</div>
                <div>권한</div>
                <div>삭제</div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "홍길동", org: "개발사", role: "최고권한" },
                  { name: "주먹밥", org: "개발사", role: "열람권한" },
                  { name: "주먹밥", org: "개발사", role: "열람권한" },
                  { name: "주먹밥", org: "개발사", role: "열람권한" },
                  { name: "김철수", org: "고객사", role: "열람권한" },
                  { name: "이영희", org: "고객사", role: "열람권한" },
                ].map((member, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-4 items-center text-sm py-2"
                  >
                    <div>{member.name}</div>
                    <div className="text-muted-foreground">{member.org}</div>
                    <div className="text-muted-foreground">{member.role}</div>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/projects/1")}
            >
              취소
            </Button>
            <Button>생성</Button>
          </div>
        </CardContent>
      </Card>

      {/* 단계 수정 다이얼로그 */}
      <Dialog open={showEditStageDialog} onOpenChange={setShowEditStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>요구사항 정의</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>순서</Label>
              <Input
                type="number"
                value={editingStage?.order || 1}
                onChange={(e) =>
                  editingStage &&
                  setEditingStage({
                    ...editingStage,
                    order: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                삭제
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditStageDialog(false)}
              >
                취소
              </Button>
              <Button onClick={handleEditStage}>수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistCreate;
