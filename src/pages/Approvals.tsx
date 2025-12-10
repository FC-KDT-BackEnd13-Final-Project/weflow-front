import { useMemo, useState } from "react";
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
import { getProjectSteps } from "@/apis/step";
import { createStepRequest, getProjectStepRequests } from "@/apis/stepRequest";
import { deleteAttachment } from "@/apis/attachments";
import { AttachmentInput, type UploadedAttachment } from "@/components/attachments/AttachmentInput";
import { StepResponse, StepRequestSummaryResponse } from "@/lib/stepTypes";
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

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const attachmentIds = useMemo(() => uploadedAttachments.map((a) => a.id), [uploadedAttachments]);

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ["project-steps", projectId],
    queryFn: () => getProjectSteps(projectId),
    enabled: !!projectId,
  });

  const { data: requestData, isLoading: requestsLoading } = useQuery({
    queryKey: ["project-step-requests", projectId, page],
    queryFn: () => getProjectStepRequests(projectId, page, pageSize),
    enabled: !!projectId,
  });

  const createRequestMutation = useMutation({
    mutationFn: () => {
      if (!selectedStepId) throw new Error("단계를 선택해주세요.");
      return createStepRequest(selectedStepId, {
        title: requestTitle,
        description: requestDescription,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
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

  const steps = stepsData?.data.steps ?? [];
  const {
    stepRequestSummaryResponses: stepRequestSummaries = [],
    totalCount = 0,
    page: currentPageFromApi,
    size: pageSizeFromApi,
  } = requestData ?? {};
  const currentPage = currentPageFromApi ?? page;
  const pageSizeForCalc = pageSizeFromApi ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSizeForCalc));

  const phaseLabelMap: Record<string, string> = {
    CONTRACT: "계약",
    IN_PROGRESS: "진행",
    DELIVERY: "납품",
    MAINTENANCE: "유지보수",
  };

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

  const filteredSteps = useMemo(() => {
    if (currentPhase === "ALL") return steps;
    return steps.filter(step => step.phase === currentPhase);
  }, [steps, currentPhase]);

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
  const handleRemoveAttachment = async (index: number) => {
    const target = uploadedAttachments[index];
    setUploadedAttachments(prev => prev.filter((_, i) => i !== index));
    try {
      await deleteAttachment(target.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "첨부 삭제 실패", description: message, variant: "destructive" });
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">단계별 승인 요청</h1>
            <p className="text-sm text-muted-foreground mt-1">프로젝트 단계별 승인 상태를 확인하세요</p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepsLoading && <p className="text-sm text-muted-foreground">단계 정보를 불러오는 중입니다...</p>}
          {!stepsLoading && steps.length === 0 && (
            <Card className="md:col-span-3">
              <CardContent className="p-6 text-muted-foreground text-sm">표시할 단계가 없습니다.</CardContent>
            </Card>
          )}
        {filteredSteps.map((step: StepResponse) => {
            const requests = (stepRequestSummaries || []).filter((r) => r.stepId === step.id);
            const status = stepStatusBadge(step.status, requests.length > 0);
            const phaseLabel = phaseLabelMap[step.phase] || step.phase || "단계";
            const isApproved = step.status === "APPROVED";
            return (
              <Card
                key={step.id}
                className={cn(
                  "flex flex-col",
                  isApproved && "bg-gray-50 border-gray-200 hover:bg-gray-50"
                )}
              >
                <CardHeader className="border-b space-y-2">
                  {currentPhase === "ALL" && (
                    <div className="flex">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground bg-muted/40">
                        {phaseLabel}
                      </span>
                    </div>
                  )}
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
                      !isApproved && (
                        <div className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground text-center space-y-3">
                          <div>승인 요청이 없습니다.</div>
                          <Button type="button" variant="secondary" onClick={() => openRequestDialog(step.id)}>
                            승인 요청 생성
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                  {!isApproved && requests.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => openRequestDialog(step.id)}
                    >
                      승인 요청 생성
                    </Button>
                  )}
                  {isApproved && requests.length === 0 && (
                    <div className="w-full rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground text-center">
                      완료된 단계에서는 추가 승인 요청을 생성할 수 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
                  {steps.map(step => (
                    <SelectItem
                      key={step.id}
                      value={String(step.id)}
                      disabled={step.status === "APPROVED"}
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
              label="첨부파일 / 링크"
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
