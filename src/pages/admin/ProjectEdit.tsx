// ----------------------------------------------
// AdminProjectEdit.tsx
// ----------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, X, Paperclip } from "lucide-react";

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
  ProjectPhase,
  fetchAdminProjectDetail,
  updateAdminProject,
  fetchAdminProjectMembers,
  addAdminProjectMember,
  removeAdminProjectMember,
} from "@/apis/adminProjects";

import { fetchAdminProjectSteps } from "@/apis/steps";
import { normalizeStages } from "@/utils/normalizeStages";

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
import { adminApi } from "@/apis/admin";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Popover as CmdPopover,
  PopoverContent as CmdPopoverContent,
  PopoverTrigger as CmdPopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import type { Company } from "@/apis/admin";
import {
  uploadFile,
  getAttachments,
  deleteAttachment,
  getAttachment,
} from "@/apis/attachmentApi";
import type { AttachmentResponse } from "@/apis/attachmentApi";
import { AttachmentType, TargetType } from "@/types/attachment";

// ----------------------------------------------
// SortableStage (ProjectCreate와 동일)
// ----------------------------------------------
type StagePhase = "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE";
type Stage = {
  key: string;
  id?: number;
  name: string;
  order: number;
  phase: StagePhase;
};

const phaseOptions: { value: StagePhase; label: string }[] = [
  { value: "CONTRACT", label: "계약" },
  { value: "IN_PROGRESS", label: "진행" },
  { value: "DELIVERY", label: "납품" },
  { value: "MAINTENANCE", label: "유지보수" },
];

const stageKey = (s: Stage) => s.key;

const SortableStage = ({
  stage,
  onDelete,
}: {
  stage: Stage;
  onDelete: (id: string) => void;
}) => {
  const sortableId = stage.key;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: sortableId,
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
      <span className="font-medium text-sm">{stage.name}</span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sortableId);
        }}
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

const AdminProjectEdit = () => {
  const { id } = useParams();
  const projectId = Number(id);

  const navigate = useNavigate();
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor));

  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------
  // 프로젝트 정보
  // -------------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerCompanyId, setCustomerCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySelectOpen, setCompanySelectOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [status, setStatus] = useState<ProjectStatus>("OPEN");
  const [phase, setPhase] = useState<ProjectPhase>("CONTRACT");

  const [contractAmount, setContractAmount] = useState("");
  const [existingContractAttachment, setExistingContractAttachment] =
    useState<AttachmentResponse | null>(null);
  const [newContractFile, setNewContractFile] = useState<File | null>(null);
  const [contractDeleting, setContractDeleting] = useState(false);

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
  const [stages, setStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [newStagePhase, setNewStagePhase] = useState<StagePhase>("CONTRACT");
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  // -------------------------------
  // 멤버
  // -------------------------------
  const [members, setMembers] = useState<SelectedMember[]>([]);
  const [users, setUsers] = useState<MemberData[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  const initialMemberIds = useRef<Set<string>>(new Set());
  const [selectedClientCompany, setSelectedClientCompany] = useState<
    string | null
  >(null);

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.companyType === "AGENCY") return true;
      return selectedCompany ? u.companyId === selectedCompany.id : false;
    });
  }, [users, selectedCompany]);

  // -------------------------------
  // 초기 로딩
  // -------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [companiesRes, detail] = await Promise.all([
          adminApi.getCompanies(0, 9999), // 수정 시 비활성 고객사도 필요하므로 status 필터 제거
          fetchAdminProjectDetail(projectId),
        ]);

        const clientCompanies = (companiesRes.data.content ?? []).filter(
          (c) => c.companyType === "CLIENT" || !c.companyType
        );
        const sortedCompanies = [...clientCompanies].sort((a, b) =>
          a.name.localeCompare(b.name, "ko-KR")
        );
        setCompanies(sortedCompanies);

        // 프로젝트 정보
        setName(detail.name);
        setDescription(detail.description || "");
        setStatus((detail.status as ProjectStatus) ?? "OPEN");
        setPhase((detail.phase as ProjectPhase) ?? "CONTRACT");
        setCustomerCompanyId(
          detail.customerCompanyId ? String(detail.customerCompanyId) : ""
        );
        if (detail.customerCompanyId) {
          const found = companiesRes.data.content?.find(
            (c) => c.id === detail.customerCompanyId
          );

          if (found) {
            setSelectedCompany(found);
          } else {
            // 비활성/미노출 고객사도 선택 상태로 표시
            const fallbackCompany = {
              id: detail.customerCompanyId,
              name: detail.customerCompanyName ?? "고객사",
              businessNumber: null,
              representative: null,
              email: null,
              address: null,
              memo: null,
              status: "UNKNOWN",
              companyType: "CLIENT",
              createdAt: "",
              updatedAt: "",
              deletedAt: null,
            };
            setSelectedCompany(fallbackCompany);
            setCompanies((prev) => {
              const exists = prev.some((c) => c.id === fallbackCompany.id);
              return exists ? prev : [...prev, fallbackCompany];
            });
          }
        }
        setContractAmount(
          detail.contractAmount ? String(detail.contractAmount) : ""
        );

        setStartDate(detail.startDate ? new Date(detail.startDate) : null);
        setEndDate(
          detail.endDateExpected ? new Date(detail.endDateExpected) : null
        );
        setActualEndDate(detail.endDate ? new Date(detail.endDate) : null);

        try {
          const attachments = await getAttachments(
            TargetType.PROJECT_CONTRACT,
            projectId
          );
          let fileAttachment = attachments.find(
            (a) => a.attachmentType === AttachmentType.FILE
          );

          if (!fileAttachment && detail.contractAttachmentId) {
            const fallback = await getAttachment(detail.contractAttachmentId);
            if (fallback.attachmentType === AttachmentType.FILE) {
              fileAttachment = fallback;
            }
          }

          setExistingContractAttachment(fileAttachment ?? null);
        } catch (err) {
          console.error("계약서 첨부파일 조회 실패", err);
        }

        // 멤버 조회: 개발사 전체 + 해당 고객사만
        const usersRes = await fetchAllUsers({
          customerCompanyId: detail.customerCompanyId,
        });
        setUsers(usersRes);

        const [memberRes, stepRes] = await Promise.all([
          fetchAdminProjectMembers(projectId),
          fetchAdminProjectSteps(projectId),
        ]);

        // 멤버 (삭제된 멤버 제외)
        const mappedMembers = memberRes.members
          .filter((m) => !m.removedAt)
          .map((m) => {
            const u = usersRes.find((x) => x.id === String(m.userId));
            const companyType =
              u?.companyType ?? (m.userRole === "CLIENT" ? "CLIENT" : "AGENCY");
            return {
              id: String(m.userId),
              name: m.username,
              company: m.companyName,
              companyType,
              role: m.projectRole === "ADMIN" ? "최고권한" : "일반권한",
              canDelete: true,
            };
          });

        setMembers(mappedMembers);
        initialMemberIds.current = new Set(mappedMembers.map((m) => m.id));

        setStages(normalizeStages(stepRes));
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
      {
        key: `stage-${Date.now()}-${Math.random()}`,
        name: newStageName,
        order: stages.length + 1,
        phase: newStagePhase,
      },
    ]);

    setNewStageName("");
    setNewStagePhase("CONTRACT");
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (key: string) => {
    const filtered = stages.filter((s) => stageKey(s) !== key);
    setStages(filtered.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => stageKey(s) === active.id);
    const newIndex = stages.findIndex((s) => stageKey(s) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // phase 다르면 무시
    if (stages[oldIndex].phase !== stages[newIndex].phase) return;

    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));

    setStages(reordered);
  };

  const handleStatusChange = (next: ProjectStatus) => {
    if (status !== "CLOSED" && next === "CLOSED") {
      setActualEndDate(new Date());
    }
    setStatus(next);
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setNewContractFile(file);
    if (e.target) e.target.value = "";
  };

  const handleRemoveExistingContract = async () => {
    if (!existingContractAttachment) return;
    try {
      setContractDeleting(true);
      await deleteAttachment(existingContractAttachment.id);
      setExistingContractAttachment(null);
      toast({ title: "계약서가 삭제되었습니다." });
    } catch (err) {
      console.error(err);
      toast({
        title: "삭제 실패",
        description: "계약서 파일 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setContractDeleting(false);
    }
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
  // 필수값 검증 + 날짜 검증
  // -------------------------------
  const scrollToRef = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStartDateChange = (d: Date | null) => {
    setStartDate(d);
    if (endDate && d && d > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (d: Date | null) => {
    if (startDate && d && d < startDate) {
      return;
    }
    setEndDate(d);
  };

  const validateRequired = () => {
    if (!name.trim()) {
      scrollToRef(nameRef);
      nameInputRef.current?.focus();
      setSubmitError("프로젝트명을 입력하세요.");
      return false;
    }
    if (!selectedCompany) {
      scrollToRef(companyRef);
      companyButtonRef.current?.focus();
      setSubmitError("고객사를 선택하세요.");
      return false;
    }
    if (!status) {
      scrollToRef(statusRef);
      statusButtonRef.current?.focus();
      setSubmitError("상태를 선택하세요.");
      return false;
    }
    if (!startDate) {
      scrollToRef(dateRef);
      startDateButtonRef.current?.focus();
      setSubmitError("시작일을 선택하세요.");
      return false;
    }
    if (!endDate) {
      scrollToRef(dateRef);
      endDateButtonRef.current?.focus();
      setSubmitError("종료 예정일을 선택하세요.");
      return false;
    }
    setSubmitError(null);
    return true;
  };

  // -------------------------------
  // 저장
  // -------------------------------
  const handleSubmit = async () => {
    if (!validateRequired()) return;
    try {
      const orderedStages = [...stages].sort((a, b) => a.order - b.order);

      let uploadedContract: AttachmentResponse | null = null;

      if (newContractFile) {
        try {
          uploadedContract = await uploadFile(
            newContractFile,
            TargetType.PROJECT_CONTRACT,
            projectId
          );
        } catch (err) {
          console.error(err);
          setSubmitError("계약서 업로드에 실패했습니다.");
          return;
        }
      }

      await updateAdminProject(projectId, {
        name,
        description,
        status,
        phase,
        customerCompanyId: customerCompanyId ? Number(customerCompanyId) : null,
        contractAmount: contractAmount ? Number(contractAmount) : null,
        contractFileUrl:
          uploadedContract?.filePath ??
          existingContractAttachment?.filePath ??
          null,
        startDate: toLocal(startDate),
        endDateExpected: toLocal(endDate),
        endDate: toLocal(actualEndDate),
        steps: orderedStages.map((s, idx) => ({
          title: s.name,
          phase: s.phase,
          orderIndex: idx + 1,
        })),
      });

      if (newContractFile && existingContractAttachment?.id) {
        try {
          await deleteAttachment(existingContractAttachment.id);
        } catch (err) {
          console.error("기존 계약서 삭제 실패", err);
        }
      }

      const current = new Set(members.map((m) => m.id));

      for (const oldId of initialMemberIds.current) {
        if (!current.has(oldId)) {
          await removeAdminProjectMember(projectId, Number(oldId));
        }
      }

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
          <div ref={nameRef}>
            <Label>프로젝트명</Label>
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                    <CommandList className="max-h-72 overflow-auto">
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
                    </CommandList>
                  </Command>
                </CmdPopoverContent>
              </CmdPopover>
            </div>

            <div ref={statusRef}>
              <Label>상태</Label>
              <Select
                value={status}
                onValueChange={(v) => handleStatusChange(v as ProjectStatus)}
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

            <div>
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

            <div>
              <Label>계약 금액</Label>
              <Input
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
              />
            </div>
          </div>

          {/* 계약서 파일 첨부 */}
          <div className="space-y-2">
            <Label>계약서 파일 (1개만 선택 가능)</Label>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  ref={contractFileInputRef}
                  type="file"
                  accept="application/pdf, image/*"
                  onChange={handleContractFileChange}
                  className="hidden"
                  id="contract-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => contractFileInputRef.current?.click()}
                  className="gap-2 w-[150px]"
                >
                  <Plus className="h-4 w-4" />
                  파일 선택
                </Button>
                <span className="text-sm text-muted-foreground">
                  {newContractFile
                    ? "새 계약서가 선택되었습니다."
                    : existingContractAttachment
                    ? "기존 계약서가 등록되어 있습니다."
                    : "선택된 파일 없음"}
                </span>
              </div>

              {newContractFile && (
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {newContractFile.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs flex-shrink-0"
                    >
                      {(newContractFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setNewContractFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {!newContractFile && existingContractAttachment && (
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {existingContractAttachment.fileName ??
                        existingContractAttachment.filePath ??
                        "계약서"}
                    </span>
                    {existingContractAttachment.fileSize && (
                      <Badge
                        variant="secondary"
                        className="text-xs flex-shrink-0"
                      >
                        {(existingContractAttachment.fileSize / 1024).toFixed(
                          1
                        )}{" "}
                        KB
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={contractDeleting}
                    onClick={handleRemoveExistingContract}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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

          {/* 단계 */}
          <StageSection
            stages={stages}
            setStages={setStages}
            newStageName={newStageName}
            setNewStageName={setNewStageName}
            newStagePhase={newStagePhase}
            setNewStagePhase={setNewStagePhase}
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

          <div className="flex items-center gap-3">
            <Button
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

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/projects")}
            >
              취소
            </Button>
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
        existingAdminId={members.find((m) => m.role === "최고권한")?.id ?? null}
        users={filteredUsers}
        selectedClientCompany={selectedClientCompany}
        setSelectedClientCompany={setSelectedClientCompany}
        clientCompanies={selectedCompany ? [selectedCompany.name] : []}
      />
    </div>
  );
};

export default AdminProjectEdit;

// ----------------------------------------------
// SUPPORT COMPONENTS (ProjectCreate와 동일)
// ----------------------------------------------

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
  setDate: (d: Date | null) => void;
  optional?: boolean;
  required?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}) => {
  const [time, setTime] = useState("00:00");

  useEffect(() => {
    if (date) {
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    }
  }, [date]);

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
              ? `${date.toLocaleDateString()} ${time}`
              : optional
              ? "선택 (optional)"
              : "날짜 선택"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar mode="single" selected={date} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
      <Input type="time" value={time} onChange={handleTimeChange} />
    </div>
  );
};

// ----------------------------------------------
// StageSection
// ----------------------------------------------
const StageSection = ({
  stages,
  setStages,
  newStageName,
  setNewStageName,
  newStagePhase,
  setNewStagePhase,
  handleAddStage,
  handleDeleteStage,
  handleDragEnd,
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
  handleDeleteStage: (id: number | string) => void;
  handleDragEnd: (e: any) => void;
  isStageDialogOpen: boolean;
  setIsStageDialogOpen: (v: boolean) => void;
  sensors: any;
}) => {
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
      <p className="text-xs text-blue-600">
        단계는 최소 1개 이상 유지해주세요. 기본 단계를 모두 삭제했다면 새 단계를
        추가해야 합니다. 삭제하고 수정할 시에는 기본 단계로 들어갑니다.
      </p>

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
                items={group.items.map((s) => s.key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-3">
                  {group.items.map((stage) => (
                    <SortableStage
                      key={stage.key}
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

      {/* 단계 추가 모달 */}
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
                  <SelectValue />
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

// ----------------------------------------------
// MemberSection
// ----------------------------------------------
const MemberSection = ({
  members,
  handleDeleteMember,
}: {
  members: SelectedMember[];
  handleDeleteMember: (idx: number) => void;
}) => {
  const agency = members.filter((m) => m.companyType === "AGENCY");
  const client = members.filter((m) => m.companyType === "CLIENT");

  const renderTable = (title: string, list: SelectedMember[]) => (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">{list.length}명</span>
      </div>

      <div className="bg-muted grid grid-cols-4 gap-4 p-3 font-medium text-sm">
        <div>이름</div>
        <div>소속</div>
        <div>권한</div>
        <div>삭제</div>
      </div>

      <div className="divide-y">
        {list.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            추가된 멤버가 없습니다.
          </div>
        )}
        {list.map((m, idx) => {
          const globalIndex = members.findIndex((x) => x.id === m.id);
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
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMember(globalIndex)}
                  className="h-6 w-6 p-0"
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

  return (
    <div className="space-y-3">
      {renderTable("개발사", agency)}
      {renderTable("고객사", client)}
    </div>
  );
};
