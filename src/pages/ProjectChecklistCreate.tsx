import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";

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

interface ProjectMember {
  name: string;
  company: string;
  role: string;
}

export default function ProjectChecklistCreate() {
  const navigate = useNavigate();
  const { id } = useParams();

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
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageOrder, setStageOrder] = useState(stages.length + 1);

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    type: "객관식" as "객관식" | "주관식",
    options: [""],
  });

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { name: "홍길동", company: "개발사", role: "관리자" },
    { name: "주먹밥", company: "개발사", role: "편집" },
    { name: "김철수", company: "고객사", role: "열람" },
    { name: "이영희", company: "고객사", role: "열람" },
  ]);

  const handleRemoveMember = (index: number) => {
    setProjectMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage = { id: stages.length + 1, name: newStageName, order: stageOrder };
    setStages((prev) => [...prev, newStage]);
    setNewStageName("");
    setStageOrder(stageOrder + 1);
    setShowStageDialog(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.title.trim()) return;
    const question: Question = {
      id: questions.length + 1,
      title: newQuestion.title,
      type: newQuestion.type,
      options: newQuestion.type === "객관식"
        ? newQuestion.options.filter((option) => option.trim() !== "")
        : [],
    };
    setQuestions((prev) => [...prev, question]);
    setNewQuestion({ title: "", type: "객관식", options: [""] });
    setShowQuestionDialog(false);
  };

  const handleAddOption = () => {
    setNewQuestion((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewQuestion((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
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
                  <SelectValue placeholder="단계를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {stages.sort((a, b) => a.order - b.order).map((stage) => (
                    <SelectItem key={stage.id} value={stage.name}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2">
                    + 단계 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 단계 추가</DialogTitle>
                    <DialogDescription>프로젝트 진행 단계를 더 세분화할 수 있어요.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>단계명</Label>
                      <Input value={newStageName} onChange={(event) => setNewStageName(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>순서</Label>
                      <Input
                        type="number"
                        value={stageOrder}
                        onChange={(event) => setStageOrder(Number(event.target.value))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowStageDialog(false)}>취소</Button>
                      <Button onClick={handleAddStage}>추가</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-center justify-between rounded bg-background px-3 py-2">
                      <div>
                        <p className="font-medium">{question.title}</p>
                        <p className="text-xs text-muted-foreground">{question.type}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">프로젝트 멤버 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <span>이름</span>
              <span>소속</span>
              <span>권한</span>
              <span>관리</span>
            </div>
            <div className="space-y-3">
              {projectMembers.map((member, index) => (
                <div key={`${member.name}-${index}`} className="grid grid-cols-4 gap-4 items-center text-sm rounded border px-3 py-2">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground">{member.company}</span>
                  <span className="text-muted-foreground">{member.role}</span>
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveMember(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/project/${id}/checklist`)}>
            취소
          </Button>
          <Button onClick={() => navigate(`/project/${id}/checklist`)}>
            생성
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
                onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, type: value as "객관식" | "주관식" }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="객관식" id="question-type-choice" />
                  <Label htmlFor="question-type-choice">객관식</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="주관식" id="question-type-text" />
                  <Label htmlFor="question-type-text">주관식</Label>
                </div>
              </RadioGroup>
            </div>

            {newQuestion.type === "객관식" && (
              <div className="space-y-2">
                <Label>선택지</Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(event) => handleOptionChange(index, event.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                    />
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
