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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ---- DND KIT ----
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import MemberSelectDialog, { SelectedMember } from "@/components/admin/MemberSelectDialog";

interface ProjectMember {
  id: string;
  name: string;
  company: string;
  companyType: "agency" | "client";
  role: string;
  canDelete: boolean;
}

// ---- SORTABLE COMPONENT ----
const SortableStage = ({ stage, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stage.order });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing flex items-center"
      {...attributes}
      {...listeners}
    >
      <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2">
        {stage.name}
        <X
          className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stage.order);
          }}
        />
      </Badge>
    </div>
  );
};

const ProjectCreate = () => {
  const navigate = useNavigate();

  // ----- STEP 설정 -----
  const [stages, setStages] = useState([
    { name: "요구사항 정의", order: 1 },
    { name: "화면 설계", order: 2 },
    { name: "디자인", order: 3 },
    { name: "개발", order: 4 },
    { name: "테스트", order: 5 },
    { name: "납품", order: 6 },
  ]);

  const [newStageName, setNewStageName] = useState("");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    setStages([...stages, { name: newStageName, order: stages.length + 1 }]);
    setNewStageName("");
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (order: number) => {
    const filtered = stages.filter((s) => s.order !== order);
    const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));
    setStages(reordered);
  };

  // DND
  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.order === active.id);
    const newIndex = stages.findIndex((s) => s.order === over.id);

    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setStages(reordered);
  };

  // ----- 날짜 -----
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ----- 고객사 선택 상태 (멤버 필터링용) -----
  const [selectedClientCompany, setSelectedClientCompany] = useState<string | null>(null);

  // ----- 멤버 -----
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  const existingMemberIds = members.map((m) => m.id);
  const existingAdminId = members.find(
    (m) => m.companyType === "agency" && m.role === "최고권한"
  )?.id ?? null;

  const handleAddMembers = (newMembers: SelectedMember[]) => {
    // 만약 고객사가 선택되지 않은 상태라면
    if (!selectedClientCompany) {
      const clientMember = newMembers.find((m) => m.companyType === "client");
      if (clientMember) {
        setSelectedClientCompany(clientMember.company);  // 고객사 자동 세팅
      }
    }

    // 새 선택으로 교체 (중복 제거)
    const uniqueIds = new Set<string>();
    const deduped = newMembers.filter((m) => {
      if (uniqueIds.has(m.id)) return false;
      uniqueIds.add(m.id);
      return true;
    });
    setMembers(deduped);
    setIsMemberDialogOpen(false);
  };


  const handleDeleteMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- SUBMIT -----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/projects");
  };

  const agencyMembers = members.filter((m) => m.companyType === "agency");
  const clientMembers = members.filter((m) => m.companyType === "client");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">프로젝트 관리</h1>
        <p className="text-muted-foreground mt-1">프로젝트 관리 &gt; 프로젝트 생성</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 생성</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 프로젝트명 */}
            <div className="space-y-2">
              <Label>프로젝트명</Label>
              <Input placeholder="프로젝트명 입력" required />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label>프로젝트 설명</Label>
              <Textarea rows={4} placeholder="프로젝트 설명 입력" />
            </div>

            {/* 고객사 */}
            <div className="space-y-2">
              <Label>고객사</Label>
              <Select
                value={selectedClientCompany ?? ""}
                onValueChange={(v) => {
                  // 선택된 고객사만 유지하고 개발사 멤버는 유지
                  setMembers((prev) =>
                    prev.filter((m) => m.companyType === "agency" || m.company === v)
                  );
                  setSelectedClientCompany(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ClientA">ClientA</SelectItem>
                  <SelectItem value="ClientB">ClientB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 시작일 */}
              <div className="space-y-2">
                <Label>시작일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {startDate ? startDate.toLocaleDateString() : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 종료일 */}
              <div className="space-y-2">
                <Label>종료일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {endDate ? endDate.toLocaleDateString() : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 계약서 파일 */}
            <div className="space-y-2">
              <Label>계약서 파일 업로드</Label>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                계약서 csv 파일을 업로드해주세요.
              </div>
            </div>

            {/* 단계 설정 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>프로젝트 단계 설정</Label>

                <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> 단계 추가
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>단계 이름 입력</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <Input
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        placeholder="단계명 입력"
                      />

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleAddStage}>추가</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* DND 정렬 */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stages.map((s) => s.order)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                      <SortableStage key={stage.order} stage={stage} onDelete={handleDeleteStage} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* 멤버 설정 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>프로젝트 멤버 설정</Label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMemberDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> 멤버 추가
                </Button>
              </div>

              {/* 개발사 멤버 */}
              {agencyMembers.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-4 py-2">
                    <span className="font-medium text-sm">개발사</span>
                  </div>
                  <div className="bg-muted grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                    <div>이름</div>
                    <div>소속</div>
                    <div>권한</div>
                    <div>삭제</div>
                  </div>
                  <div className="divide-y">
                    {agencyMembers.map((member) => {
                      const originalIndex = members.findIndex((m) => m.id === member.id);
                      return (
                        <div key={member.id} className="grid grid-cols-4 gap-4 p-3 text-sm items-center">
                          <div>{member.name}</div>
                          <div className="text-muted-foreground">{member.company}</div>
                          <div>{member.role}</div>
                          <div>
                            {member.canDelete ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteMember(originalIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 고객사 멤버 */}
              {clientMembers.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-4 py-2">
                    <span className="font-medium text-sm">고객사</span>
                  </div>
                  <div className="bg-muted grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                    <div>이름</div>
                    <div>소속</div>
                    <div>권한</div>
                    <div>삭제</div>
                  </div>
                  <div className="divide-y">
                    {clientMembers.map((member) => {
                      const originalIndex = members.findIndex((m) => m.id === member.id);
                      return (
                        <div key={member.id} className="grid grid-cols-4 gap-4 p-3 text-sm items-center">
                          <div>{member.name}</div>
                          <div className="text-muted-foreground">{member.company}</div>
                          <div>{member.role}</div>
                          <div>
                            {member.canDelete ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteMember(originalIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {members.length === 0 && (
                <div className="border rounded-lg p-4 text-center text-muted-foreground">
                  추가된 멤버가 없습니다.
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/projects")}>
                취소
              </Button>
              <Button type="submit">등록</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 멤버 선택 모달 */}
      <MemberSelectDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        onConfirm={handleAddMembers}
        existingMemberIds={existingMemberIds}
        existingAdminId={existingAdminId}
        selectedClientCompany={selectedClientCompany}
        setSelectedClientCompany={setSelectedClientCompany}
      />
    </div>
  );
};

export default ProjectCreate;
