import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  ProjectPhase,
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

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { uploadFile } from "@/apis/attachmentApi";
import { TargetType } from "@/types/attachment";
import { adminApi } from "@/apis/admin";
import {
  Popover as CmdPopover,
  PopoverContent as CmdPopoverContent,
  PopoverTrigger as CmdPopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import type { Company } from "@/apis/admin";

type StagePhase = "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE";
type Stage = { id: string; name: string; phase: StagePhase; order: number };
const phaseOptions: { value: StagePhase; label: string }[] = [
  { value: "CONTRACT", label: "계약" },
  { value: "IN_PROGRESS", label: "진행" },
  { value: "DELIVERY", label: "납품" },
  { value: "MAINTENANCE", label: "유지보수" },
];

// ---------------------------
// Sortable Stage Item
// ---------------------------
const SortableStage = ({
  stage,
  onDelete,
}: {
  stage: Stage;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: stage.id,
    });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between w-full
                 px-4 py-3 rounded-xl border bg-white shadow-sm
                 hover:bg-accent cursor-grab transition"
    >
      {/* 단계명 */}
      <span className="font-medium text-sm">{stage.name}</span>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(stage.id);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-7 w-7 flex items-center justify-center rounded-md
                   hover:bg-destructive/10 transition"
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
};

// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------

const ProjectCreate = () => {
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerCompanyId, setCustomerCompanyId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("OPEN");
  const [phase, setPhase] = useState<ProjectPhase>("CONTRACT");

  const [contractAmount, setContractAmount] = useState("");
  const [contractFileName, setContractFileName] = useState("");
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [contractUploading, setContractUploading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [actualEndDate, setActualEndDate] = useState<Date | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySelectOpen, setCompanySelectOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const companyRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const companyButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusButtonRef = useRef<HTMLButtonElement | null>(null);
  const startDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const endDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const contractFileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toLocalDateTime = (d: Date | null) => {
    if (!d) return undefined;
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return t.toISOString().slice(0, 19);
  };

  const validateRequired = () => {
    if (!name.trim()) {
      toast({ title: "프로젝트명을 입력하세요.", variant: "destructive" });
      scrollToRef(nameRef);
      nameInputRef.current?.focus();
      return false;
    }
    if (!selectedCompany) {
      toast({ title: "고객사를 선택하세요.", variant: "destructive" });
      scrollToRef(companyRef);
      companyButtonRef.current?.focus();
      return false;
    }
    if (!status) {
      toast({ title: "상태를 선택하세요.", variant: "destructive" });
      scrollToRef(statusRef);
      statusButtonRef.current?.focus();
      return false;
    }
    if (!startDate) {
      toast({ title: "시작일을 선택하세요.", variant: "destructive" });
      scrollToRef(dateRef);
      startDateButtonRef.current?.focus();
      return false;
    }
    if (!endDate) {
      toast({ title: "종료 예정일을 선택하세요.", variant: "destructive" });
      scrollToRef(dateRef);
      endDateButtonRef.current?.focus();
      return false;
    }
    return true;
  };

  // ---------------------------
  // STAGE STATE
  // ---------------------------
  const [stages, setStages] = useState<Stage[]>([
    { id: "s1", name: "요구사항 정의", order: 1, phase: "IN_PROGRESS" },
    { id: "s2", name: "화면 설계", order: 2, phase: "IN_PROGRESS" },
    { id: "s3", name: "디자인", order: 3, phase: "IN_PROGRESS" },
    { id: "s4", name: "개발", order: 4, phase: "IN_PROGRESS" },
    { id: "s5", name: "테스트", order: 5, phase: "IN_PROGRESS" },
    { id: "s6", name: "납품", order: 6, phase: "DELIVERY" },
  ]);
  const [newStageName, setNewStageName] = useState("");
  const [newStagePhase, setNewStagePhase] = useState<StagePhase>("CONTRACT");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  // ---------------------------
  // MEMBERS
  // ---------------------------
  const [members, setMembers] = useState<SelectedMember[]>([]);
  const [users, setUsers] = useState<MemberData[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedClientCompany, setSelectedClientCompany] = useState<
    string | null
  >(null);

  const existingMemberIds = members.map((m) => m.id);

  useEffect(() => {
    fetchAllUsers().then(setUsers);
  }, []);

  useEffect(() => {
    adminApi.getCompanies().then((res) => {
      setCompanies(res.data.content ?? []);
    });
  }, []);

  const handleAddMembers = (newMembers: SelectedMember[]) => {
    setMembers(newMembers);
    setIsMemberDialogOpen(false);
  };

  const handleDeleteMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredUsers = useMemo(() => {
    // 개발사(agency)는 항상 전체 표시, 고객사(client)는 선택된 고객사에 한정
    return users.filter((u) => {
      if (u.companyType === "agency") return true;
      return selectedCompany ? u.companyId === selectedCompany.id : false;
    });
  }, [users, selectedCompany]);

  // ---------------------------
  // DATE VALIDATION HANDLERS  ← 여기 추가
  // ---------------------------
  const handleStartDateChange = (d: Date | null) => {
    setStartDate(d);

    if (endDate && d && d > endDate) {
      toast({
        title: "날짜 오류",
        description: "시작일은 종료 예정일보다 늦을 수 없습니다.",
        variant: "destructive",
      });
      setEndDate(null);
    }
  };

  const handleEndDateChange = (d: Date | null) => {
    if (startDate && d && d < startDate) {
      toast({
        title: "날짜 오류",
        description: "종료 예정일은 시작일보다 빠를 수 없습니다.",
        variant: "destructive",
      });
      return; // 저장하지 않음
    }
    setEndDate(d);
  };

  // ---------------------------
  // STAGE HANDLERS
  // ---------------------------
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    setStages((prev) => [
      ...prev,
      {
        id: `stage-${Date.now()}-${Math.random()}`,
        name: newStageName,
        order: prev.length + 1,
        phase: newStagePhase,
      },
    ]);
    setNewStageName("");
    setNewStagePhase("CONTRACT");
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (id: string) => {
    const filtered = stages.filter((s) => s.id !== id);
    const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));
    setStages(reordered);
  };

  const handleContractFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    try {
      setContractUploading(true);
      // 프로젝트 생성 전이라 targetId는 임시로 0 사용
      // 백엔드가 지원하는 enum 내에서 저장하기 위해 SUPPORT 타입으로 업로드
      const uploaded = await uploadFile(file, TargetType.PROJECT_CONTRACT, 0);
      setContractFileName(uploaded.fileName ?? file.name);
      setContractFileUrl(uploaded.filePath ?? "");
      toast({ title: "계약서가 업로드되었습니다." });
    } catch (err) {
      console.error(err);
      toast({
        title: "업로드 실패",
        description: "계약서 파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setContractUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // ---------------------------
  // SUBMIT
  // ---------------------------
  const handleSubmit = async () => {
    if (!validateRequired()) return;

    try {
      const payload = {
        name,
        description,
        status,
        phase,
        customerCompanyId: customerCompanyId ? Number(customerCompanyId) : null,
        startDate: toLocalDateTime(startDate),
        endDateExpected: toLocalDateTime(endDate),
        contractAmount: contractAmount ? Number(contractAmount) : null,
        contractFileUrl: contractFileUrl || null,

        stages: stages.map((s) => ({
          title: s.name,
          orderIndex: s.order,
          phase: s.phase,
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
          <div className="space-y-2" ref={nameRef}>
            <Label>프로젝트명</Label>
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2" ref={companyRef}>
              <Label>고객사 선택</Label>
              <CmdPopover
                open={companySelectOpen}
                onOpenChange={setCompanySelectOpen}
              >
                <CmdPopoverTrigger asChild>
                  <Button
                    ref={companyButtonRef}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {selectedCompany ? selectedCompany.name : "고객사 선택"}
                  </Button>
                </CmdPopoverTrigger>
                <CmdPopoverContent className="p-0 w-[320px]">
                  <Command>
                    <CommandInput placeholder="고객사 검색..." />
                    <CommandEmpty>검색 결과 없음</CommandEmpty>
                    <CommandGroup>
                      {companies.map((company) => (
                        <CommandItem
                          key={company.id}
                          value={company.name}
                          onSelect={() => {
                            setSelectedCompany(company);
                            setCustomerCompanyId(String(company.id));
                            setSelectedClientCompany(company.name);
                            setCompanySelectOpen(false);
                          }}
                        >
                          {company.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </CmdPopoverContent>
              </CmdPopover>
              {!selectedCompany && (
                <p className="text-xs text-destructive">
                  고객사를 선택해주세요.
                </p>
              )}
            </div>

            <div className="space-y-2" ref={statusRef}>
              <Label>상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
              >
                <SelectTrigger ref={statusButtonRef}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">활성</SelectItem>
                  <SelectItem value="CLOSED">종료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>프로젝트 단계</Label>
              <Select
                value={phase}
                onValueChange={(v) => setPhase(v as ProjectPhase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRACT">계약</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행</SelectItem>
                  <SelectItem value="DELIVERY">납품</SelectItem>
                  <SelectItem value="MAINTENANCE">유지보수</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>계약 금액</Label>
              <Input
                value={contractAmount}
                type="number"
                onChange={(e) => setContractAmount(e.target.value)}
              />
            </div>
          </div>

          {/* 계약서 파일 첨부 */}
          <div className="space-y-2">
            <Label>계약서 파일</Label>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-3">
              <Input
                ref={contractFileInputRef}
                type="file"
                accept="application/pdf, image/*"
                disabled={contractUploading}
                onChange={handleContractFileChange}
                className="hidden"
                id="contract-file"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => contractFileInputRef.current?.click()}
                className="gap-2 w-[150px]"
                disabled={contractUploading}
              >
                <Plus className="h-4 w-4" />
                파일 선택
              </Button>

              <span className="text-sm text-muted-foreground">
                {contractFileName
                  ? "업로드됨"
                  : contractUploading
                  ? "업로드 중..."
                  : "선택된 파일 없음"}
              </span>

              <div className="flex-1 flex items-center text-sm text-muted-foreground gap-2 min-w-0">
                <span className="flex-1 border-b border-muted-foreground/40" />
                <span className="truncate max-w-[240px]">
                  {contractFileName || ""}
                </span>
              </div>

              {contractFileName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContractFileName("");
                    setContractFileUrl("");
                  }}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={dateRef}>
            <DateSelector
              label="시작일"
              date={startDate}
              setDate={handleStartDateChange}
              required
              buttonRef={startDateButtonRef}
            />
            <DateSelector
              label="종료 예정일"
              date={endDate}
              setDate={handleEndDateChange}
              required
              buttonRef={endDateButtonRef}
            />
          </div>

          <DateSelector
            label="실제 종료일"
            date={actualEndDate}
            setDate={setActualEndDate}
            optional
          />

          {/* 단계 설정 */}
          <StageSection
            stages={stages}
            setStages={setStages}
            newStageName={newStageName}
            setNewStageName={setNewStageName}
            newStagePhase={newStagePhase}
            setNewStagePhase={setNewStagePhase}
            handleAddStage={handleAddStage}
            handleDeleteStage={handleDeleteStage}
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedCompany}
              onClick={() => setIsMemberDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> 멤버 추가
            </Button>
            {!selectedCompany && (
              <span className="text-sm text-muted-foreground">
                멤버를 추가하려면 먼저 고객사를 선택해주세요.
              </span>
            )}
          </div>

          {/* 저장 */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/projects")}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSubmit}>
              저장
            </Button>
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
        users={filteredUsers}
      />
    </div>
  );
};

export default ProjectCreate;

// ----------------------------
// SUPPORT COMPONENTS
// ----------------------------
const DateSelector = ({
  label,
  date,
  setDate,
  optional = false,
  required = false,
  buttonRef,
}: {
  label: string;
  date: Date | null;
  setDate: (date: Date | null) => void;
  optional?: boolean;
  required?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}) => {
  const [time, setTime] = useState("00:00");

  const handleSelect = (selectedDate: Date | null) => {
    if (!selectedDate) {
      setDate(null);
      return;
    }

    const [hh, mm] = time.split(":").map(Number);
    selectedDate.setHours(hh);
    selectedDate.setMinutes(mm);

    setDate(new Date(selectedDate));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (date) {
      const [hh, mm] = newTime.split(":").map(Number);
      const updated = new Date(date);
      updated.setHours(hh);
      updated.setMinutes(mm);
      setDate(updated);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            className="w-full text-left"
          >
            {date
              ? date.toLocaleDateString() + " " + time
              : optional
              ? "선택 (optional)"
              : "날짜 선택"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0">
          <Calendar mode="single" selected={date} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>

      {/* 시간 선택 */}
      <Input type="time" value={time} onChange={handleTimeChange} />
    </div>
  );
};

const StageSection = ({
  stages,
  setStages,
  newStageName,
  setNewStageName,
  newStagePhase,
  setNewStagePhase,
  handleAddStage,
  handleDeleteStage,
  isStageDialogOpen,
  setIsStageDialogOpen,
  sensors,
}: {
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  newStageName: string;
  setNewStageName: (v: string) => void;
  newStagePhase: StagePhase;
  setNewStagePhase: (v: StagePhase) => void;
  handleAddStage: () => void;
  handleDeleteStage: (id: string) => void;
  isStageDialogOpen: boolean;
  setIsStageDialogOpen: (v: boolean) => void;
  sensors: any;
}) => {
  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i + 1,
      }));
    });
  };

  const phases = [
    { key: "CONTRACT", label: "계약" },
    { key: "IN_PROGRESS", label: "진행" },
    { key: "DELIVERY", label: "납품" },
    { key: "MAINTENANCE", label: "유지보수" },
  ];

  const grouped = phases.map((p) => ({
    phase: p.key,
    label: p.label,
    items: stages.filter((s) => s.phase === p.key),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>프로젝트 단계 설정</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsStageDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> 단계 추가
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-2 gap-4">
          {grouped.map((group) => (
            <div
              key={group.phase}
              className="bg-muted/40 p-4 rounded-xl border space-y-4"
            >
              <h3 className="text-lg font-semibold">{group.label}</h3>

              <SortableContext
                items={group.items.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-3">
                  {group.items.map((stage) => (
                    <SortableStage
                      key={stage.id}
                      stage={stage}
                      onDelete={handleDeleteStage}
                    />
                  ))}

                  {group.items.length === 0 && (
                    <p className="text-sm text-muted-foreground pl-2">
                      단계 없음
                    </p>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
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

            <div className="space-y-2">
              <Label>Phase</Label>
              <Select
                value={newStagePhase}
                onValueChange={(v) => setNewStagePhase(v as StagePhase)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Phase 선택" />
                </SelectTrigger>
                <SelectContent>
                  {phaseOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsStageDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="button" onClick={handleAddStage}>
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MemberSection = ({
  agencyMembers,
  clientMembers,
  members,
  handleDeleteMember,
}) => (
  <div className="space-y-3">
    {agencyMembers.length > 0 && (
      <MemberTable
        title="개발사"
        members={agencyMembers}
        allMembers={members}
        onDelete={handleDeleteMember}
      />
    )}
    {clientMembers.length > 0 && (
      <MemberTable
        title="고객사"
        members={clientMembers}
        allMembers={members}
        onDelete={handleDeleteMember}
      />
    )}

    {members.length === 0 && (
      <div className="border rounded-lg p-4 text-center text-muted-foreground">
        추가된 멤버가 없습니다.
      </div>
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
          <div
            key={m.id}
            className="grid grid-cols-4 gap-4 p-3 text-sm items-center"
          >
            <div>{m.name}</div>
            <div className="text-muted-foreground">{m.company}</div>
            <div>{m.role}</div>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onDelete(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
