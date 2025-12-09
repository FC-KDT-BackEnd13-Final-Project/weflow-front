// ----------------------------------------------
// AdminProjectEdit.tsx 
// ----------------------------------------------

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ProjectStatus,
  fetchAdminProjectDetail,
  updateAdminProject,
  fetchAdminProjectMembers,
  addAdminProjectMember,
  removeAdminProjectMember,
} from "@/apis/adminProjects";

import {
  fetchProjectSteps,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  StepResponse,
} from "@/apis/steps";

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


// ----------------------------------------------
// SortableStage (ProjectCreate와 동일)
// ----------------------------------------------
const SortableStage = ({ stage, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
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

const AdminProjectEdit = () => {
  const { id } = useParams();
  const projectId = Number(id);

  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------
  // 프로젝트 정보
  // -------------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerCompanyId, setCustomerCompanyId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("CONTRACT");

  const [contractAmount, setContractAmount] = useState("");
  const [contractFileUrl, setContractFileUrl] = useState("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [actualEndDate, setActualEndDate] = useState<Date | null>(null);

  const toLocal = (d: Date | null) => {
    if (!d) return undefined;
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return t.toISOString().slice(0, 19);
  };

  // -------------------------------
  // 단계
  // -------------------------------
  const [stages, setStages] = useState<
    { id?: number; name: string; order: number }[]
  >([]);
  const [deletedStageIds, setDeletedStageIds] = useState<number[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  // -------------------------------
  // 멤버
  // -------------------------------
  const [members, setMembers] = useState<SelectedMember[]>([]);
  const [users, setUsers] = useState<MemberData[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  const initialMemberIds = useRef<Set<string>>(new Set());
  const [selectedClientCompany, setSelectedClientCompany] = useState<string | null>(null);

  // -------------------------------
  // 초기 로딩
  // -------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const users = await fetchAllUsers();
        setUsers(users);

        const [detail, memberRes, stepRes] = await Promise.all([
          fetchAdminProjectDetail(projectId),
          fetchAdminProjectMembers(projectId),
          fetchProjectSteps(projectId),
        ]);

        // 프로젝트 정보
        setName(detail.name);
        setDescription(detail.description || "");
        setStatus(detail.status as ProjectStatus);
        setCustomerCompanyId(detail.customerCompanyId ? String(detail.customerCompanyId) : "");
        setContractAmount(detail.contractAmount ? String(detail.contractAmount) : "");
        setContractFileUrl(detail.contractFileUrl || "");

        setStartDate(detail.startDate ? new Date(detail.startDate) : null);
        setEndDate(detail.endDateExpected ? new Date(detail.endDateExpected) : null);
        setActualEndDate(detail.endDate ? new Date(detail.endDate) : null);

        // 멤버
        const mappedMembers = memberRes.members.map((m) => {
          const u = users.find((x) => x.id === String(m.userId));
          return {
            id: String(m.userId),
            name: m.username,
            company: m.companyName,
            companyType: u?.companyType ?? "agency",
            role: m.projectRole === "ADMIN" ? "최고권한" : "일반권한",
            canDelete: true,
          };
        });

        setMembers(mappedMembers);
        initialMemberIds.current = new Set(mappedMembers.map((m) => m.id));

        // 단계
        setStages(
          stepRes
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((s: StepResponse) => ({
              id: s.id,
              name: s.title,
              order: s.orderIndex,
            }))
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  // -------------------------------
  // 단계 추가/삭제/드래그
  // -------------------------------
  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    setStages([
      ...stages,
      { name: newStageName, order: stages.length + 1 },
    ]);

    setNewStageName("");
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (order: number) => {
    const target = stages.find((s) => s.order === order);
    if (target?.id) deletedStageIds.push(target.id);

    const filtered = stages.filter((s) => s.order !== order);
    setStages(filtered.map((s, i) => ({ ...s, order: i + 1 })));
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

  // -------------------------------
  // 멤버 추가/삭제
  // -------------------------------
  const handleAddMembers = (list: SelectedMember[]) => {
    setMembers(list);
    setIsMemberDialogOpen(false);
  };

  const handleDeleteMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  // -------------------------------
  // 저장
  // -------------------------------
  const handleSubmit = async () => {
    try {
      // 1) 프로젝트 기본 정보 저장
      await updateAdminProject(projectId, {
        name,
        description,
        status,
        customerCompanyId: customerCompanyId ? Number(customerCompanyId) : null,
        contractAmount: contractAmount ? Number(contractAmount) : null,
        contractFileUrl: contractFileUrl || null,
        startDate: toLocal(startDate),
        endDateExpected: toLocal(endDate),
        endDate: toLocal(actualEndDate),
      });

      // 2) 단계 삭제
      for (const del of deletedStageIds) {
        await deleteStep(projectId, del);
      }

      // 3) 단계 생성/수정
      const newStages = [...stages];

      for (let i = 0; i < newStages.length; i++) {
        const s = newStages[i];

        if (!s.id) {
          const created = await createStep(projectId, { title: s.name });
          newStages[i] = { ...s, id: created.id }; // ← 반드시 새로운 객체 생성
        } else {
          await updateStep(projectId, s.id, { title: s.name });
        }
      }

      setStages(newStages);

      // 4) reorder
      await reorderSteps(projectId, {
        steps: newStages
          .sort((a, b) => a.order - b.order)
          .map((s, idx) => ({
            stepId: s.id,
            orderIndex: idx + 1,
          }))
      });

      // 5) 멤버 추가/삭제
      const current = new Set(members.map((m) => m.id));

      // 삭제된 멤버
      for (const oldId of initialMemberIds.current) {
        if (!current.has(oldId)) {
          await removeAdminProjectMember(projectId, Number(oldId));
        }
      }

      // 추가된 멤버
      for (const m of members) {
        if (!initialMemberIds.current.has(m.id)) {
          await addAdminProjectMember(projectId, {
            userId: Number(m.id),
            projectRole: m.role === "최고권한" ? "ADMIN" : "MEMBER",
          });
        }
      }

      navigate(`/admin/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setSubmitError("저장 실패! 다시 시도해주세요.");
    }
  };

  // -------------------------------
  // 화면 렌더링 (ProjectCreate UI 그대로)
  // -------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">프로젝트 수정</h1>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 프로젝트명 */}
          <div>
            <Label>프로젝트명</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 설명 */}
          <div>
            <Label>설명</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>고객사 ID</Label>
              <Input value={customerCompanyId} onChange={(e) => setCustomerCompanyId(e.target.value)} />
            </div>

            <div>
              <Label>상태</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRACT">계약</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                  <SelectItem value="DELIVERY">납품</SelectItem>
                  <SelectItem value="MAINTENANCE">유지보수</SelectItem>
                  <SelectItem value="CLOSED">종료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>계약 금액</Label>
              <Input value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} />
            </div>
          </div>

          {/* 파일 URL */}
          <div>
            <Label>계약서 파일 URL</Label>
            <Input value={contractFileUrl} onChange={(e) => setContractFileUrl(e.target.value)} />
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateSelector label="시작일" date={startDate} setDate={setStartDate} />
            <DateSelector label="종료 예정일" date={endDate} setDate={setEndDate} />
          </div>

          <DateSelector label="실제 종료일" date={actualEndDate} setDate={setActualEndDate} optional />

          {/* 단계 */}
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
            members={members}
            handleDeleteMember={handleDeleteMember}
          />

          <Button variant="outline" size="sm" onClick={() => setIsMemberDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> 멤버 추가
          </Button>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate("/admin/projects")}>취소</Button>
            <Button onClick={handleSubmit}>저장</Button>
          </div>

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
        </CardContent>
      </Card>

      <MemberSelectDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        onConfirm={handleAddMembers}
        existingMemberIds={members.map((m) => m.id)}
        existingAdminId={null}
        users={users}
        selectedClientCompany={selectedClientCompany}
        setSelectedClientCompany={setSelectedClientCompany}
      />
    </div>
  );
};

export default AdminProjectEdit;


// ----------------------------------------------
// SUPPORT COMPONENTS (ProjectCreate와 동일)
// ----------------------------------------------

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


// ----------------------------------------------
// StageSection
// ----------------------------------------------
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
      <Button variant="outline" size="sm" onClick={() => setIsStageDialogOpen(true)}>
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
            <Button variant="ghost" onClick={() => setIsStageDialogOpen(false)}>취소</Button>
            <Button onClick={handleAddStage}>추가</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);


// ----------------------------------------------
// MemberSection
// ----------------------------------------------
const MemberSection = ({ members, handleDeleteMember }) => (
  <div className="space-y-3">
    {members.length === 0 && (
      <div className="border rounded-lg p-4 text-center text-muted-foreground">
        추가된 멤버가 없습니다.
      </div>
    )}

    {members.length > 0 && (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-4 py-2">
          <span className="font-medium text-sm">참여 멤버</span>
        </div>

        <div className="bg-muted grid grid-cols-4 gap-4 p-3 font-medium text-sm">
          <div>이름</div>
          <div>소속</div>
          <div>권한</div>
          <div>삭제</div>
        </div>

        <div className="divide-y">
          {members.map((m, idx) => (
            <div key={m.id} className="grid grid-cols-4 gap-4 p-3 text-sm items-center">
              <div>{m.name}</div>
              <div className="text-muted-foreground">{m.company}</div>
              <div>{m.role}</div>
              <div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

