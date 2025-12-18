import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectSteps, createStep, updateStep, deleteStep, reorderStepsByPhase } from "@/apis/step";
import { createStepRequest, getProjectStepRequests } from "@/apis/stepRequest";
import { AttachmentInput, type UploadedAttachment } from "@/components/attachments/AttachmentInput";
import { StepResponse, StepRequestSummaryResponse, StepPhase } from "@/lib/stepTypes";
import { useToast } from "@/hooks/use-toast";
import { boardStatusLabels, boardStatusStyles } from "@/constants/boardStatus";
import { stepRequestStatusMap } from "@/constants/stepRequestStatus";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUserStore } from "@/stores/user";
import { Plus, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const getDefaultPhaseByTab = (tab: string): StepPhase => {
  if (tab === "IN_PROGRESS") return "IN_PROGRESS";
  if (tab === "DELIVERY") return "DELIVERY";
  if (tab === "MAINTENANCE") return "MAINTENANCE";
  return "CONTRACT";
};
const isRequestableStep = (step?: StepResponse) => Boolean(step && step.status !== "APPROVED" && step.status !== "CANCELED");

const PHASE_LABEL_MAP: Record<StepPhase, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const DraggableStepCard = ({
  step,
  children,
  isCrossPhaseBlocked,
  isDragging,
  disabled,
}: {
  step: StepResponse;
  children: ReactNode;
  isCrossPhaseBlocked: boolean;
  isDragging: boolean;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isSorting } = useSortable({
    id: step.id,
    disabled,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col",
        (isCrossPhaseBlocked || disabled) && "cursor-not-allowed opacity-60",
        isSorting && "shadow-lg",
        isDragging && "ring-2 ring-primary/40",
        step.status === "APPROVED" && "bg-gray-50 border-gray-200 hover:bg-gray-50"
      )}
    >
      {children}
    </Card>
  );
};

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultProjectId = Number(import.meta.env.VITE_DEFAULT_PROJECT_ID ?? 1);
  const parsedProjectId = Number(id);
  const projectId = Number.isFinite(parsedProjectId) && parsedProjectId > 0 ? parsedProjectId : defaultProjectId;
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const tabParam = searchParams.get("tab") ?? "ALL";
  const currentPhase = ["ALL", "CONTRACT", "IN_PROGRESS", "DELIVERY", "MAINTENANCE"].includes(tabParam) ? tabParam : "ALL";
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const [isCreateStepDialogOpen, setIsCreateStepDialogOpen] = useState(false);
  const [newStepPhase, setNewStepPhase] = useState<StepPhase>(() => getDefaultPhaseByTab(currentPhase));
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const [editingStepDescription, setEditingStepDescription] = useState("");
  const [openMenuStepId, setOpenMenuStepId] = useState<number | null>(null);
  const [orderedSteps, setOrderedSteps] = useState<StepResponse[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const stepsQueryKey = useMemo(() => ["project-steps", projectId], [projectId]);

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: stepsQueryKey,
    queryFn: () => getProjectSteps(projectId),
    enabled: !!projectId,
  });
  const serverSteps = stepsData?.data.steps ?? [];

  const { data: requestData, isLoading: requestsLoading } = useQuery({
    queryKey: ["project-step-requests", projectId, page],
    queryFn: () => getProjectStepRequests(projectId, page, pageSize),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!serverSteps.length) return;
    if (isDirty) return;
    const sameLength = serverSteps.length === orderedSteps.length;
    const isSameOrder =
      sameLength &&
      serverSteps.every((step, index) => {
        const current = orderedSteps[index];
        return (
          current &&
          current.id === step.id &&
          current.orderIndex === step.orderIndex &&
          current.status === step.status &&
          current.phase === step.phase
        );
      });
    if (!isSameOrder || !isInitialized) {
      setOrderedSteps(serverSteps);
      setIsInitialized(true);
    }
  }, [serverSteps, orderedSteps, isDirty, isInitialized]);

  const createRequestMutation = useMutation({
    mutationFn: () => {
      if (!selectedStepId) throw new Error("단계를 선택해주세요.");
      const { files, links } = buildAttachmentPayload(uploadedAttachments);
      return createStepRequest(selectedStepId, {
        title: requestTitle,
        description: requestDescription,
        files,
        links,
      });
    },
    onSuccess: () => {
      toast({ title: "승인 요청이 생성되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["project-step-requests", projectId] });
      handleRequestDialogChange(false);
    },
    onError: (error: unknown) =>
      toast({
        title: "요청 생성 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const {
    stepRequestSummaryResponses: stepRequestSummaries = [],
    totalCount = 0,
    page: currentPageFromApi,
    size: pageSizeFromApi,
  } = requestData ?? {};
  const currentPage = currentPageFromApi ?? page;
  const pageSizeForCalc = pageSizeFromApi ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSizeForCalc));

  const phaseOptions = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      { value: "CONTRACT", label: "계약" },
      { value: "IN_PROGRESS", label: "진행" },
      { value: "DELIVERY", label: "납품" },
      { value: "MAINTENANCE", label: "유지보수" },
    ],
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredSteps = useMemo(() => {
    if (currentPhase === "ALL") return orderedSteps;
    return orderedSteps.filter(step => step.phase === currentPhase);
  }, [orderedSteps, currentPhase]);

  const activeStep = activeId ? orderedSteps.find((s) => s.id === activeId) : null;
  const overStep = overId ? orderedSteps.find((s) => s.id === overId) : null;
  const isCrossPhase = Boolean(activeStep && overStep && activeStep.phase !== overStep.phase);

  const nextAvailableStepId = useMemo(() => {
    if (!orderedSteps.length) return null;
    for (let i = 0; i < orderedSteps.length; i += 1) {
      const step = orderedSteps[i];
      if (step.status === "APPROVED") continue;
      const allPrevApproved = orderedSteps.slice(0, i).every((prev) => prev.status === "APPROVED");
      if (allPrevApproved) return step.id;
      break;
    }
    return null;
  }, [orderedSteps]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
    setIsDirty(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over;
    setOverId(over ? Number(over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const activeStepData = orderedSteps.find((s) => s.id === active.id);
    const overStepData = orderedSteps.find((s) => s.id === over.id);
    if (!activeStepData || !overStepData) return;
    if (activeStepData.phase !== overStepData.phase) {
      setIsDirty(false);
      toast({
        title: "순서 변경 불가",
        description: "다른 단계로는 순서를 변경할 수 없습니다. 같은 단계 내에서만 순서 변경이 가능합니다.",
        variant: "destructive",
      });
      return;
    }
    if (overStepData.status !== "PENDING") {
      setIsDirty(false);
      toast({
        title: "순서 변경 불가",
        description: "잔행 전인 단계만 순서를 변경할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    const previousSteps = [...orderedSteps];
    const phase = activeStepData.phase;
    const phaseSteps = orderedSteps.filter((s) => s.phase === phase);
    const pendingSteps = phaseSteps.filter((s) => s.status === "PENDING");
    const oldPendingIndex = pendingSteps.findIndex((s) => s.id === active.id);
    if (oldPendingIndex < 0) return;

    let newPendingIndex = pendingSteps.length - 1;
    let pendingSeen = 0;
    for (const step of phaseSteps) {
      if (step.id === over.id) {
        newPendingIndex = pendingSeen;
        break;
      }
      if (step.status === "PENDING") pendingSeen += 1;
    }

    const reorderedPending = arrayMove(pendingSteps, oldPendingIndex, newPendingIndex);
    if (oldPendingIndex === newPendingIndex) {
      setIsDirty(false);
      return;
    }
    const pendingQueue = [...reorderedPending];

    const rebuiltPhase = phaseSteps.map((step) =>
      step.status === "PENDING" ? pendingQueue.shift() ?? step : step
    );

    const nextSteps = orderedSteps.map((step) =>
      step.phase === phase ? rebuiltPhase.shift() ?? step : step
    );

    setOrderedSteps(nextSteps);

    const orderedIdsByPhase = reorderedPending.map((s) => s.id);

    reorderStepsByPhase(projectId, { phase, orderedStepIds: orderedIdsByPhase })
      .then((data) => {
        const responseSteps = data.steps ?? [];
        if (!responseSteps.length) return;
        setOrderedSteps(responseSteps);
        queryClient.setQueryData(stepsQueryKey, (prev: any) => {
          if (!prev) return { data: { steps: responseSteps } };
          return { ...prev, data: { ...(prev.data ?? {}), steps: responseSteps } };
        });
        setIsDirty(false);
      })
      .catch(() => {
        setOrderedSteps(previousSteps);
        setIsDirty(false);
        toast({
          title: "순서 변경 실패",
          description: "진행 중이거나 완료된 단계는 순서를 변경할 수 없습니다.",
          variant: "destructive",
        });
      });
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setIsDirty(false);
  };
  const stepStatusBadge = (status: StepResponse["status"], hasRequests: boolean) => {
    const isComplete = status === "APPROVED";
    const labelKey = isComplete ? "complete" : "progress";
    const label = boardStatusLabels[labelKey];
    const style = boardStatusStyles[labelKey];

    if (!isComplete && hasRequests) {
      return { label, className: style };
    }

    if (isComplete) {
      return { label, className: style };
    }

    return { label: "진행 전", className: "bg-gray-500 text-white" };
  };

  const requestStatusBadge = (status: StepRequestSummaryResponse["status"]) => {
    const mapped = stepRequestStatusMap[status];
    if (mapped) return mapped;
    return { label: status, className: "bg-slate-500 text-white" };
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const openRequestDialog = (stepId: number) => {
    const targetStep = orderedSteps.find((s) => s.id === stepId);
    if (!targetStep || targetStep.status === "APPROVED" || targetStep.status === "CANCELED") {
      toast({ title: "요청 생성 불가", description: "생성할 수 없는 단계입니다.", variant: "destructive" });
      return;
    }
    const targetIsNext = nextAvailableStepId === stepId;
    if (!targetIsNext) {
      toast({ title: "요청 생성 불가", description: "이전 단계를 완료한 뒤 승인 요청을 생성할 수 있습니다.", variant: "destructive" });
      return;
    }
    setSelectedStepId(stepId);
    setRequestTitle("");
    setRequestDescription("");
    setUploadedAttachments([]);
    setIsRequestDialogOpen(true);
  };

  const handleRequestDialogChange = (open: boolean) => {
    setIsRequestDialogOpen(open);
    if (!open) {
      setSelectedStepId(null);
      setRequestTitle("");
      setRequestDescription("");
      setUploadedAttachments([]);
    }
  };
  const resetCreateStepDialog = () => {
    setIsCreateStepDialogOpen(false);
    setNewStepPhase(getDefaultPhaseByTab(currentPhase));
    setNewStepTitle("");
    setNewStepDescription("");
  };
  const resetEditStepDialog = () => {
    setIsEditStepDialogOpen(false);
    setEditingStepId(null);
    setEditingStepTitle("");
    setEditingStepDescription("");
  };
  const buildAttachmentPayload = (items: UploadedAttachment[]) => {
    const files = items
      .filter((a) => !a.isLink)
      .map((a) => ({
        fileName: a.fileName || a.name,
        fileSize: a.fileSize ?? 0,
        filePath: a.filePath || "",
        contentType: a.contentType || "application/octet-stream",
      }))
      .filter((f) => f.fileName && f.filePath);
    const links = items
      .filter((a) => a.isLink)
      .map((a) => {
        const url = (a.url || a.name || "").trim();
        return { url };
      })
      .filter((l) => Boolean(l.url));
    return { files, links };
  };

  const createStepMutation = useMutation({
    mutationFn: () =>
      createStep(projectId, {
        phase: newStepPhase,
        title: newStepTitle,
        description: newStepDescription || undefined,
        orderIndex: null, // 백엔드가 phase 내 마지막에 배치
      }),
    onSuccess: () => {
      toast({ title: "단계가 생성되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
      resetCreateStepDialog();
    },
    onError: (error: unknown) =>
      toast({
        title: "단계 생성 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const updateStepMutation = useMutation({
    mutationFn: () => {
      if (!editingStepId) throw new Error("단계가 선택되지 않았습니다.");
      return updateStep(editingStepId, {
        title: editingStepTitle,
        description: editingStepDescription || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "단계가 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
      resetEditStepDialog();
    },
    onError: (error: unknown) =>
      toast({
        title: "단계 수정 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: number) => deleteStep(stepId),
    onSuccess: () => {
      toast({ title: "단계가 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
    },
    onError: (error: unknown) =>
      toast({
        title: "단계 삭제 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const userRole = (user?.role || "").toUpperCase();
  const userType = (user as { userRole?: string } | undefined)?.userRole?.toUpperCase?.() || "";
  const projectRole = (user as { projectRole?: string } | undefined)?.projectRole?.toUpperCase?.() || "";
  const canManageStep = userRole === "SYSTEM_ADMIN" || (projectRole === "ADMIN" && userType === "AGENCY");

  const stepTooltipMessage = {
    cannotEdit: "진행 중인 단계는 수정할 수 없습니다.",
    cannotDeleteStatus: "진행 중인 단계는 삭제할 수 없습니다.",
    cannotDeleteRequests: "승인요청이 있어 삭제할 수 없습니다.",
    cannotDeleteChecklist: "체크리스트가 연결된 단계는 삭제할 수 없습니다.",
    cannotDeletePosts: "관련 게시글이 있어 삭제할 수 없습니다.",
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">단계별 승인 요청</h1>
            <p className="text-sm text-muted-foreground mt-1">프로젝트 단계별 승인 상태를 확인하세요</p>
          </div>
          {canManageStep && (
            <Button
              onClick={() => {
                setNewStepPhase(getDefaultPhaseByTab(currentPhase));
                setIsCreateStepDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              단계 생성
            </Button>
          )}
        </div>

        <div className="w-full flex flex-wrap gap-2 items-center">
          {phaseOptions.map((phase) => {
            const isActive = currentPhase === phase.value;
            return (
              <button
                key={phase.value}
                onClick={() => setSearchParams({ tab: phase.value })}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm rounded-full border transition-colors",
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "text-muted-foreground border-input hover:text-foreground"
                )}
              >
                {phase.label}
              </button>
            );
          })}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={filteredSteps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stepsLoading && <p className="text-sm text-muted-foreground">단계 정보를 불러오는 중입니다...</p>}
              {!stepsLoading && filteredSteps.length === 0 && (
                <Card className="md:col-span-3">
                  <CardContent className="p-6 text-muted-foreground text-sm">표시할 단계가 없습니다.</CardContent>
                </Card>
              )}
              {filteredSteps.map((step: StepResponse) => {
                const requests = (stepRequestSummaries || []).filter((r) => r.stepId === step.id);
                const status = stepStatusBadge(step.status, requests.length > 0);
                const phaseLabel = PHASE_LABEL_MAP[step.phase as StepPhase] || step.phase || "단계";
                const isApproved = step.status === "APPROVED";
                const isPending = step.status === "PENDING";
                const isNextAvailable = nextAvailableStepId === step.id;
                const canShowCreateButton = isRequestableStep(step) && isNextAvailable;
                const hasRequests = requests.length > 0;
                const canEditStep = canManageStep && isPending;
                const canDeleteStep = canManageStep && isPending && !hasRequests;
                const deleteTooltip = !isPending
                  ? stepTooltipMessage.cannotDeleteStatus
                  : hasRequests
                    ? stepTooltipMessage.cannotDeleteRequests
                    : undefined;
                const isCrossPhaseBlocked = Boolean(isCrossPhase && overStep && overStep.id === step.id);
                const isDragging = activeId === step.id;
                const isDraggable = step.status === "PENDING";
                return (
                  <DraggableStepCard
                    key={step.id}
                    step={step}
                    isCrossPhaseBlocked={isCrossPhaseBlocked}
                    isDragging={isDragging}
                    disabled={!isDraggable}
                  >
                    <CardHeader className={cn("border-b space-y-2 py-2", !canManageStep && "pt-4")}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {currentPhase === "ALL" && (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground bg-muted/40">
                              {phaseLabel}
                            </span>
                          )}
                        </div>
                        {canManageStep ? (
                          <DropdownMenu
                            open={openMenuStepId === step.id}
                            onOpenChange={(open) => setOpenMenuStepId(open ? step.id : null)}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        if (!canEditStep) return;
                                        setEditingStepId(step.id);
                                        setEditingStepTitle(step.title);
                                        setEditingStepDescription(step.description || "");
                                        setOpenMenuStepId(null);
                                        setIsEditStepDialogOpen(true);
                                      }}
                                      className={cn(!canEditStep && "opacity-50 cursor-not-allowed")}
                                    >
                                      단계 수정
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  {!canEditStep && <TooltipContent>{stepTooltipMessage.cannotEdit}</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        if (!canDeleteStep) return;
                                        if (window.confirm("단계를 삭제하시겠습니까?")) {
                                          setOpenMenuStepId(null);
                                          deleteStepMutation.mutate(step.id);
                                        }
                                      }}
                                      className={cn(!canDeleteStep && "opacity-50 cursor-not-allowed")}
                                    >
                                      단계 삭제
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  {!canDeleteStep && deleteTooltip && <TooltipContent>{deleteTooltip}</TooltipContent>}
                                </Tooltip>
                              </TooltipProvider>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <Badge className={cn(status.className, "pointer-events-none cursor-default")}>
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4 space-y-4 flex flex-col">
                      <div className="space-y-2 flex-1">
                        {requests.length > 0 ? (
                          requests.map((approval) => {
                            const badge = requestStatusBadge(approval.status);
                            const showDecidedAt = approval.decidedAt && (approval.status === "APPROVED" || approval.status === "REJECTED" || approval.status === "CHANGE_REQUESTED");
                            const createdLabel = formatDate(approval.createdAt);
                            const decidedLabel = showDecidedAt ? formatDate(approval.decidedAt) : null;
                            return (
                              <button
                                key={approval.id}
                                onClick={() => navigate(`/project/${projectId}/approvals/${approval.id}?tab=${currentPhase}`)}
                                className={cn(
                                  "w-full rounded-lg border-2 bg-white p-3 text-left transition-shadow",
                                  approval.status === "CANCELED"
                                    ? "border-gray-200 bg-gray-50 text-muted-foreground"
                                    : "border-gray-200 hover:border-gray-200 hover:shadow-md"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium text-sm line-clamp-2 flex-1 min-w-0">{approval.title}</div>
                                  <Badge className={cn(badge.className, "pointer-events-none cursor-default")}>
                                    {badge.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-col text-xs text-muted-foreground mt-2">
                                  <span>
                                    {(approval.requestedByName || approval.requestedBy || "요청자") ?? "요청자"}
                                    {createdLabel && ` · ${createdLabel}`}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground text-center space-y-3 flex flex-col items-center justify-center min-h-[140px]">
                            {canShowCreateButton ? (
                              <Button type="button" variant="secondary" onClick={() => openRequestDialog(step.id)}>
                                승인 요청 생성
                              </Button>
                            ) : (
                              <div className="text-muted-foreground">이전 단계 완료 후 <br></br> 승인 요청이 가능합니다.</div>
                            )}
                          </div>
                        )}
                      </div>
                      {canShowCreateButton && requests.length > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => openRequestDialog(step.id)}
                        >
                          승인 요청 생성
                        </Button>
                      )}
                      {!canShowCreateButton && !isApproved && requests.length > 0 && (
                        <div className="w-full rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center flex items-center justify-center min-h-[140px]">
                          이전 단계 완료 후 승인 요청이 가능합니다.
                        </div>
                      )}
                    </CardContent>
                  </DraggableStepCard>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Dialog open={isRequestDialogOpen} onOpenChange={handleRequestDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>승인 요청 작성</DialogTitle>
            <DialogDescription className="sr-only">승인 요청 내용을 입력하고 첨부를 추가하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">단계</Label>
              <Select
                value={selectedStepId ? String(selectedStepId) : ""}
                onValueChange={(value) => setSelectedStepId(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="단계를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {orderedSteps.map((step) => (
                    <SelectItem
                      key={step.id}
                      value={String(step.id)}
                      disabled={!isRequestableStep(step) || nextAvailableStepId !== step.id}
                    >
                      {step.title} {step.status === "APPROVED" ? "(완료)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>제목</Label>
              <Input placeholder="승인 요청 제목을 입력하세요" value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea placeholder="승인 요청에 대한 설명을 입력하세요" className="min-h-[120px]" value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} />
            </div>
            <AttachmentInput
              targetType="STEP_REQUEST"
              attachments={uploadedAttachments}
              onChange={setUploadedAttachments}
              label="파일 첨부"
              linkLabel="관련 링크"
              linkButtonText="추가"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleRequestDialogChange(false)}>
              취소
            </Button>
            <Button
              onClick={() => createRequestMutation.mutate()}
              disabled={!selectedStepId || !requestTitle || !requestDescription || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "작성 중..." : "작성 완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditStepDialogOpen} onOpenChange={setIsEditStepDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>단계 수정</DialogTitle>
            <DialogDescription className="sr-only">단계 제목과 설명을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>단계명</Label>
              <Input value={editingStepTitle} onChange={(e) => setEditingStepTitle(e.target.value)} placeholder="단계명을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                value={editingStepDescription}
                onChange={(e) => setEditingStepDescription(e.target.value)}
                className="min-h-[120px]"
                placeholder="단계 설명을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditStepDialog}>
              취소
            </Button>
            <Button
              onClick={() => updateStepMutation.mutate()}
              disabled={!editingStepTitle.trim() || updateStepMutation.isPending}
            >
              {updateStepMutation.isPending ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateStepDialogOpen} onOpenChange={setIsCreateStepDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>단계 생성</DialogTitle>
            <DialogDescription className="sr-only">새 단계를 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>상위 단계</Label>
              <Select value={newStepPhase} onValueChange={(value) => setNewStepPhase(value as StepPhase)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Phase를 선택하세요" />
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
              <Label>단계명</Label>
              <Input value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} placeholder="단계명을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                value={newStepDescription}
                onChange={(e) => setNewStepDescription(e.target.value)}
                className="min-h-[120px]"
                placeholder="단계 설명을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCreateStepDialog}>
              취소
            </Button>
            <Button
              onClick={() => createStepMutation.mutate()}
              disabled={!newStepTitle.trim() || createStepMutation.isPending}
            >
              {createStepMutation.isPending ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex justify-center">
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => page > 0 && setPage(page - 1)} className={page === 0 ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm">
                {currentPage + 1} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage + 1 < totalPages && setPage(currentPage + 1)}
                className={currentPage + 1 >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </ProjectLayout>
  );
}
