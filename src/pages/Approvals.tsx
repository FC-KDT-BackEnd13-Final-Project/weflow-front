import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectSteps } from "@/lib/step";
import { createStepRequest, getProjectStepRequests } from "@/lib/stepRequest";
import { StepResponse, StepRequestSummaryResponse } from "@/lib/stepTypes";
import { useToast } from "@/hooks/use-toast";
import { boardStatusLabels, boardStatusStyles } from "@/constants/boardStatus";

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectId = Number(id);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("ALL");
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestAttachmentIds, setRequestAttachmentIds] = useState<number[]>([]);
  const [requestLinks, setRequestLinks] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  const [linkInput, setLinkInput] = useState("");

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ["project-steps", projectId],
    queryFn: () => getProjectSteps(projectId),
    enabled: !!projectId,
  });

  const { data: requestData, isLoading: requestsLoading } = useQuery({
    queryKey: ["project-step-requests", projectId],
    queryFn: () => getProjectStepRequests(projectId, 0, 100),
    enabled: !!projectId,
  });

  const createRequestMutation = useMutation({
    mutationFn: () => {
      if (!selectedStepId) throw new Error("단계를 선택해주세요.");
      return createStepRequest(selectedStepId, {
        title: requestTitle,
        description: requestDescription,
        attachmentIds: requestAttachmentIds.length ? requestAttachmentIds : undefined,
        links: requestLinks,
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
  const stepRequestSummaries = requestData?.data.stepRequestSummaryResponses ?? [];

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

  const requestStatusLabel: Record<string, string> = {
    REQUESTED: "승인 요청",
    APPROVED: "승인",
    REJECTED: "반려",
    CANCELED: "요청 취소",
    CHANGE_REQUESTED: "수정 요청",
  };

  const requestStatusBadge = (status: StepRequestSummaryResponse["status"]) => {
    switch (status) {
      case "REQUESTED":
        return { label: boardStatusLabels.request, className: boardStatusStyles.request };
      case "CHANGE_REQUESTED":
        return { label: requestStatusLabel[status], className: boardStatusStyles.request };
      case "APPROVED":
        return { label: boardStatusLabels.approved, className: boardStatusStyles.approved };
      case "REJECTED":
        return { label: boardStatusLabels.rejected, className: boardStatusStyles.rejected };
      case "CANCELED":
        return { label: requestStatusLabel[status], className: "bg-slate-500 text-white" };
      default:
        return { label: status, className: "bg-slate-500 text-white" };
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const openRequestDialog = (stepId: number) => {
    setSelectedStepId(stepId);
    setRequestTitle("");
    setRequestDescription("");
    setRequestAttachmentIds([]);
    setRequestLinks([]);
    setAttachmentInput("");
    setLinkInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRequestDialogChange = (open: boolean) => {
    setIsRequestDialogOpen(open);
    if (!open) {
      setSelectedStepId(null);
      setRequestTitle("");
      setRequestDescription("");
      setRequestAttachmentIds([]);
      setRequestLinks([]);
      setAttachmentInput("");
      setLinkInput("");
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    const value = Number(attachmentInput.trim());
    if (Number.isNaN(value)) {
      toast({ title: "첨부 ID는 숫자여야 합니다.", variant: "destructive" });
      return;
    }
    setRequestAttachmentIds(prev => [...prev, value]);
    setAttachmentInput("");
  };

  const handleRemoveAttachment = (index: number) => {
    setRequestAttachmentIds(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    setPendingLinks(prev => [...prev, linkInput.trim()]);
    setLinkInput("");
  };

  const removeLink = (index: number) => {
    setPendingLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = () => {
    if (!selectedStepId) {
      toast({ title: "단계를 선택해주세요.", variant: "destructive" });
      return;
    }
    createRequestMutation.mutate();
  };

  const groupedRequests = useMemo(() => {
    const summaries = requestData?.data.stepRequestSummaryResponses ?? [];
    return summaries.reduce<Record<number, typeof summaries>>((acc, request) => {
      if (!acc[request.stepId]) acc[request.stepId] = [];
      acc[request.stepId].push(request);
      return acc;
    }, {});
  }, [requestData]);

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
                onClick={() => setCurrentPhase(phase.value)}
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
            const requests = groupedRequests[step.id] || [];
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
                        const isCanceled = approval.status === "CANCELED";
                        const showDecidedAt = approval.decidedAt && (approval.status === "APPROVED" || approval.status === "REJECTED");
                        return (
                          <button
                            key={approval.id}
                            onClick={() => navigate(`/project/${id}/approvals/${approval.id}`)}
                            className={cn(
                              "w-full rounded-lg border-2 bg-white p-3 text-left transition-shadow",
                              isCanceled
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
                              <span>작성일 {formatDateTime(approval.createdAt)}</span>
                              {showDecidedAt && <span>결정일 {formatDateTime(approval.decidedAt)}</span>}
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
                    {stepStatus.label !== "완료" && requests.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => openDialog(category)}>
                        승인 요청 생성
                      </Button>
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

      <Dialog
        open={selectedStep !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>승인 요청 작성</DialogTitle>
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
              <Input placeholder="승인 요청 제목을 입력하세요" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea placeholder="승인 요청에 대한 설명을 입력하세요" className="min-h-[120px]" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>첨부파일</Label>
              <div className="flex gap-2">
                <Input
                  value={attachmentInput}
                  onChange={(event) => setAttachmentInput(event.target.value)}
                  placeholder="첨부 ID를 입력하세요 (STEP_REQUEST 업로드)"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  파일 선택
                </Button>
                <span className="text-sm text-muted-foreground">
                  {pendingFiles.length}개 파일 선택됨
                </span>
              </div>
              {requestAttachmentIds.length > 0 && (
                <div className="space-y-2">
                  {requestAttachmentIds.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-muted/30"
                    >
                      <span>첨부 ID {file}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>관련 링크</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                />
                <Button type="button" variant="outline" onClick={addLink}>
                  추가
                </Button>
              </div>
              {pendingLinks.length > 0 && (
                <div className="space-y-2">
                  {pendingLinks.map((link, index) => (
                    <div key={`${link}-${index}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <LinkIcon className="h-4 w-4 flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate underline-offset-2 hover:underline"
                        >
                          {link}
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeLink(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              취소
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!selectedStepId || !requestTitle || !requestDescription || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "작성 중..." : "작성 완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
