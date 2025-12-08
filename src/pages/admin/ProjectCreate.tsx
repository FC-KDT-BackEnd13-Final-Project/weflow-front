import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  createAdminProject,
  addAdminProjectMember,
  ProjectStatus,
} from "@/apis/adminProjects";

import { fetchAllUsers } from "@/apis/adminUsers";
import MemberSelectDialog, {
  SelectedMember,
  MemberData,
} from "@/components/admin/MemberSelectDialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

// ---------------------------
// Sortable Stage Item
// ---------------------------
const SortableStage = ({ stage, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: stage.order,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

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
          onPointerDown={(e) => {
            e.stopPropagation();   // 드래그 방지
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(stage.order);
          }}
        />
      </Badge>
    </div>
  );
};


// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------

const ProjectCreate = () => {
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerCompanyId, setCustomerCompanyId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("CONTRACT");

  const [contractAmount, setContractAmount] = useState("");
  const [contractFileUrl, setContractFileUrl] = useState("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [actualEndDate, setActualEndDate] = useState<Date | null>(null);

  const toLocalDateTime = (d: Date | null) => {
    if (!d) return undefined;
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return t.toISOString().slice(0, 19);
  };

  // ---------------------------
  // STAGE STATE
  // ---------------------------
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

  // ---------------------------
  // MEMBERS
  // ---------------------------
  const [members, setMembers] = useState<SelectedMember[]>([]);
  const [users, setUsers] = useState<MemberData[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedClientCompany, setSelectedClientCompany] = useState<string | null>(null);

  const existingMemberIds = members.map((m) => m.id);

  useEffect(() => {
    fetchAllUsers().then(setUsers);
  }, []);

  const handleAddMembers = (newMembers: SelectedMember[]) => {
    setMembers(newMembers);
    setIsMemberDialogOpen(false);
  };

  const handleDeleteMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  // ---------------------------
  // STAGE HANDLERS
  // ---------------------------
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

  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.order === active.id);
    const newIndex = stages.findIndex((s) => s.order === over.id);

    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setStages(reordered);
  };

  // ---------------------------
  // SUBMIT
  // ---------------------------
  const handleSubmit = async () => {
    try {
      const payload = {
        name,
        description,
        status,
        customerCompanyId: customerCompanyId ? Number(customerCompanyId) : null,
        startDate: toLocalDateTime(startDate),
        endDateExpected: toLocalDateTime(endDate),
        contractAmount: contractAmount ? Number(contractAmount) : null,
        contractFileUrl: contractFileUrl || null,

        stages: stages.map((s) => ({
          title: s.name,
          orderIndex: s.order,
        })),
      };

      const project = await createAdminProject(payload);
      const projectId = project.id;

      await Promise.all(
        members.map((m) =>
          addAdminProjectMember(projectId, {
            userId: Number(m.id),
            projectRole: m.role === "최고권한" ? "ADMIN" : "MEMBER",
          })
        )
      );

      navigate(`/admin/projects/${projectId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const agencyMembers = members.filter((m) => m.companyType === "agency");
  const clientMembers = members.filter((m) => m.companyType === "client");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">프로젝트 생성</h1>
        <Button variant="outline" onClick={() => navigate("/admin/projects")}>
          목록으로
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 프로젝트명 */}
          <div className="space-y-2">
            <Label>프로젝트명</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>고객사 ID</Label>
              <Input value={customerCompanyId} onChange={(e) => setCustomerCompanyId(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRACT">계약</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                  <SelectItem value="DELIVERY">납품</SelectItem>
                  <SelectItem value="MAINTENANCE">유지보수</SelectItem>
                  <SelectItem value="CLOSED">종료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>계약 금액</Label>
              <Input value={contractAmount} type="number" onChange={(e) => setContractAmount(e.target.value)} />
            </div>
          </div>

          {/* 계약 파일 URL */}
          <div className="space-y-2">
            <Label>계약서 파일 URL</Label>
            <Input value={contractFileUrl} onChange={(e) => setContractFileUrl(e.target.value)} />
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateSelector label="시작일" date={startDate} setDate={setStartDate} />
            <DateSelector label="종료 예정일" date={endDate} setDate={setEndDate} />
          </div>

          <DateSelector label="실제 종료일" date={actualEndDate} setDate={setActualEndDate} optional />

          {/* 단계 설정 */}
          <StageSection
            stages={stages}
            setStages={setStages}
            newStageName={newStageName}
            setNewStageName={setNewStageName}
            handleAddStage={handleAddStage}
            handleDeleteStage={handleDeleteStage}
            handleDragEnd={handleDragEnd}
            isStageDialogOpen={isStageDialogOpen}
            setIsStageDialogOpen={setIsStageDialogOpen}
            sensors={sensors}
          />

          {/* 멤버 */}
          <MemberSection
            agencyMembers={agencyMembers}
            clientMembers={clientMembers}
            members={members}
            handleDeleteMember={handleDeleteMember}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMemberDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> 멤버 추가
          </Button>

          {/* 저장 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/admin/projects")}>취소</Button>
            <Button type="button" onClick={handleSubmit}>저장</Button>
          </div>
        </CardContent>
      </Card>

      {/* 멤버 선택 다이얼로그 */}
      <MemberSelectDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        onConfirm={handleAddMembers}
        existingMemberIds={existingMemberIds}
        existingAdminId={null}
        selectedClientCompany={selectedClientCompany}
        setSelectedClientCompany={setSelectedClientCompany}
        users={users}
      />
    </div>
  );
};

export default ProjectCreate;

// ----------------------------
// SUPPORT COMPONENTS
// ----------------------------
const DateSelector = ({ label, date, setDate, optional = false }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full text-left">
          {date ? date.toLocaleDateString() : optional ? "선택 (optional)" : "날짜 선택"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  </div>
);

const StageSection = ({
  stages,
  setStages,
  newStageName,
  setNewStageName,
  handleAddStage,
  handleDeleteStage,
  handleDragEnd,
  isStageDialogOpen,
  setIsStageDialogOpen,
  sensors,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label>프로젝트 단계 설정</Label>
      <Button type="button" variant="outline" size="sm" onClick={() => setIsStageDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> 단계 추가
      </Button>
    </div>

    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stages.map((s) => s.order)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <SortableStage key={stage.order} stage={stage} onDelete={handleDeleteStage} />
          ))}
        </div>
      </SortableContext>
    </DndContext>

    {/* 단계 추가 다이얼로그 */}
    <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 단계 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            placeholder="예: QA, 퍼블리싱"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsStageDialogOpen(false)}>
              취소
            </Button>
            <Button type="button" onClick={handleAddStage}>추가</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);

const MemberSection = ({ agencyMembers, clientMembers, members, handleDeleteMember }) => (
  <div className="space-y-3">
    {agencyMembers.length > 0 && (
      <MemberTable title="개발사" members={agencyMembers} allMembers={members} onDelete={handleDeleteMember} />
    )}
    {clientMembers.length > 0 && (
      <MemberTable title="고객사" members={clientMembers} allMembers={members} onDelete={handleDeleteMember} />
    )}

    {members.length === 0 && (
      <div className="border rounded-lg p-4 text-center text-muted-foreground">추가된 멤버가 없습니다.</div>
    )}
  </div>
);

const MemberTable = ({ title, members, allMembers, onDelete }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-primary/10 px-4 py-2">
      <span className="font-medium text-sm">{title}</span>
    </div>

    <div className="bg-muted grid grid-cols-4 gap-4 p-3 font-medium text-sm">
      <div>이름</div>
      <div>소속</div>
      <div>권한</div>
      <div>삭제</div>
    </div>

    <div className="divide-y">
      {members.map((m) => {
        const idx = allMembers.findIndex((x) => x.id === m.id);
        return (
          <div key={m.id} className="grid grid-cols-4 gap-4 p-3 text-sm items-center">
            <div>{m.name}</div>
            <div className="text-muted-foreground">{m.company}</div>
            <div>{m.role}</div>
            <div>
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDelete(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
