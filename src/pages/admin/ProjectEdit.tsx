// ------------------------------------------------------
// AdminProjectEdit.tsx (FULL FILE)
// ------------------------------------------------------

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

// API
import {
  ProjectStatus,
  addAdminProjectMember,
  fetchAdminProjectDetail,
  fetchAdminProjectMembers,
  removeAdminProjectMember,
  updateAdminProject,
} from "@/apis/adminProjects";

import { fetchAllUsers } from "@/apis/adminUsers";

// Components
import MemberSelectDialog, { SelectedMember, MemberData } from "@/components/admin/MemberSelectDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

// Sortable Stage Component
const SortableStage = ({ stage, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: stage.order,
  });

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
            e.preventDefault();
            onDelete(stage.order);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </Badge>
    </div>
  );
};

// Type
interface ProjectMember {
  id: string;
  name: string;
  company: string;
  companyType: "agency" | "client";
  role: string;
  canDelete: boolean;
}

const AdminProjectEdit = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ? Number(idParam) : null;

  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));
  const initialMemberIdsRef = useRef<Set<string>>(new Set());

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Main Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("CONTRACT");
  const [contractAmount, setContractAmount] = useState("");
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [customerCompanyId, setCustomerCompanyId] = useState("");

  // Dates
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [actualEndDate, setActualEndDate] = useState<Date | null>(null);

  const toLocalDateTime = (date: Date | null) => {
    if (!date) return undefined;
    const withoutTz = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return withoutTz.toISOString().slice(0, 19);
  };

  const toProjectRole = (role: string) => (role.includes("최고") ? "ADMIN" : "MEMBER");

  // Stages
  const [stages, setStages] = useState([
    { name: "요구사항 정의", order: 1 },
    { name: "화면 설계", order: 2 },
    { name: "디자인", order: 3 },
    { name: "개발", order: 4 },
    { name: "테스트", order: 5 },
    { name: "납품", order: 6 },
  ]);

  // Members
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [usersFromApi, setUsersFromApi] = useState<MemberData[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedClientCompany, setSelectedClientCompany] = useState<string | null>(null);

  const [newStageName, setNewStageName] = useState("");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  // Load detail
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const users = await fetchAllUsers();
        setUsersFromApi(users);

        const [detail, memberRes] = await Promise.all([
          fetchAdminProjectDetail(id),
          fetchAdminProjectMembers(id),
        ]);

        setName(detail.name);
        setDescription(detail.description ?? "");
        setStatus((detail.status as ProjectStatus) ?? "CONTRACT");

        setStartDate(detail.startDate ? new Date(detail.startDate) : null);
        setEndDate(detail.endDateExpected ? new Date(detail.endDateExpected) : null);
        setActualEndDate(detail.endDate ? new Date(detail.endDate) : null);

        setContractAmount(detail.contractAmount ? String(detail.contractAmount) : "");
        setContractFileUrl(detail.contractFileUrl ?? "");

        setCustomerCompanyId(
          detail.customerCompanyId !== null && detail.customerCompanyId !== undefined
            ? String(detail.customerCompanyId)
            : ""
        );

        const mappedMembers = memberRes.members.map((m) => {
          const matched = users.find((u) => u.id === String(m.userId));

          return {
            id: String(m.userId),
            name: m.username,
            company: m.companyName,
            companyType: matched?.companyType ?? "agency",
            role: m.projectRole === "ADMIN" ? "최고권한" : "일반권한",
            canDelete: true,
          };
        });

        setMembers(mappedMembers);
        initialMemberIdsRef.current = new Set(mappedMembers.map((m) => m.id));
      } catch (err) {
        console.error(err);
        setError("프로젝트 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Member dialog handlers
  const existingMemberIds = members.map((m) => m.id);
  const existingAdminId =
    members.find((m) => m.companyType === "agency" && m.role === "최고권한")?.id ?? null;

  const handleAddMembers = (newMembers: SelectedMember[]) => {
    const fixed = members.filter((m) => !m.canDelete);
    const fixedIds = new Set(fixed.map((m) => m.id));

    const uniqueIds = new Set<string>(fixedIds);
    const deduped = newMembers.filter((m) => {
      if (uniqueIds.has(m.id)) return false;
      uniqueIds.add(m.id);
      return true;
    });

    setMembers([...fixed, ...deduped]);
    setIsMemberDialogOpen(false);
  };

  const handleDeleteMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  // Stage handlers
  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    setStages([
      ...stages,
      {
        name: newStageName,
        order: stages.length + 1,
      },
    ]);

    setNewStageName("");
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (order: number) => {
    const filtered = stages.filter((s) => s.order !== order);
    const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));
    setStages(reordered);
  };

  const handleDragEnd = (event: any) => {
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitError(null);

    const syncMembers = async () => {
      const currentIds = new Set(members.map((m) => m.id));

      const toAdd = members.filter((m) => !initialMemberIdsRef.current.has(m.id));
      const toRemove = Array.from(initialMemberIdsRef.current).filter(
        (oldId) => !currentIds.has(oldId)
      );

      await Promise.all([
        ...toAdd.map((member) =>
          addAdminProjectMember(id, {
            userId: Number(member.id),
            projectRole: toProjectRole(member.role),
          })
        ),
        ...toRemove.map((memberId) =>
          removeAdminProjectMember(id, Number(memberId))
        ),
      ]);
    };

    try {
      await updateAdminProject(id, {
        name,
        description,
        status,
        startDate: toLocalDateTime(startDate),
        endDateExpected: toLocalDateTime(endDate),
        endDate: toLocalDateTime(actualEndDate),
        contractAmount: contractAmount ? Number(contractAmount) : null,
        contractFileUrl: contractFileUrl || null,
        customerCompanyId: customerCompanyId ? Number(customerCompanyId) : null,
      });

      await syncMembers();

      navigate(`/admin/projects/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitError("프로젝트 수정에 실패했습니다.");
    }
  };

  const agencyMembers = members.filter((m) => m.companyType === "agency");
  const clientMembers = members.filter((m) => m.companyType === "client");

  // UI Rendering
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">프로젝트 관리 {'>'} 프로젝트 수정</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 수정</CardTitle>
        </CardHeader>

        <CardContent>
          {loading && <p className="text-muted-foreground">불러오는 중...</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>프로젝트명</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>

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
                  <Input type="number" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>계약서 파일 URL</Label>
                <Input value={contractFileUrl} onChange={(e) => setContractFileUrl(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DateSelector label="시작일" date={startDate} setDate={setStartDate} />
                <DateSelector label="종료 예정일" date={endDate} setDate={setEndDate} />
              </div>

              <DateSelector label="실제 종료일" date={actualEndDate} setDate={setActualEndDate} optional />

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

              <MemberSection
                agencyMembers={agencyMembers}
                clientMembers={clientMembers}
                members={members}
                handleDeleteMember={handleDeleteMember}
              />

              <Button type="button" variant="outline" size="sm" onClick={() => setIsMemberDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> 멤버 추가
              </Button>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate("/admin/projects")}>취소</Button>
                <Button type="submit">저장</Button>
              </div>

              {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            </form>
          )}
        </CardContent>
      </Card>

      <MemberSelectDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        onConfirm={handleAddMembers}
        existingMemberIds={existingMemberIds}
        existingAdminId={existingAdminId}
        selectedClientCompany={selectedClientCompany}
        setSelectedClientCompany={setSelectedClientCompany}
        users={usersFromApi}
      />
    </div>
  );
};

export default AdminProjectEdit;

// ------------------------------------------------------
// Sub Components
// ------------------------------------------------------

const DateSelector = ({
  label,
  date,
  setDate,
  optional = false,
}: {
  label: string;
  date: Date | null;
  setDate: (d: Date | null) => void;
  optional?: boolean;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left">
          {date ? date.toLocaleDateString() : optional ? "선택 (optional)" : "날짜 선택"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  </div>
);

// ------------------------------------------------------

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

    {/* Stage dialog */}
    {/* 여기에는 Dialog 구현 생략 — 기존 그대로 사용*/}
  </div>
);

// ------------------------------------------------------

const MemberSection = ({ agencyMembers, clientMembers, members, handleDeleteMember }) => (
  <div className="space-y-3">
    {agencyMembers.length > 0 && (
      <MemberTable title="개발사" members={agencyMembers} allMembers={members} onDelete={handleDeleteMember} />
    )}

    {clientMembers.length > 0 && (
      <MemberTable title="고객사" members={clientMembers} allMembers={members} onDelete={handleDeleteMember} />
    )}

    {members.length === 0 && (
      <div className="border rounded-lg p-4 text-center text-muted-foreground">
        추가된 멤버가 없습니다.
      </div>
    )}
  </div>
);

// ------------------------------------------------------

const MemberTable = ({ title, members, allMembers, onDelete }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-primary/10 px-4 py-2">
      <span className="font-medium text-sm">{title}</span>
    </div>

    <div className="bg-muted grid grid-cols-4 gap-4 p-3 text-sm font-medium">
      <div>이름</div>
      <div>소속</div>
      <div>권한</div>
      <div>삭제</div>
    </div>

    <div className="divide-y">
      {members.map((member) => {
        const idx = allMembers.findIndex((m) => m.id === member.id);

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
                  onClick={() => onDelete(idx)}
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
);
