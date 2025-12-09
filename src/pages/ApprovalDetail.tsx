import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelStepRequest, getStepRequest, updateStepRequest } from "@/apis/stepRequest";
import { getProjectSteps } from "@/apis/step";
import { getFeedback, sendFeedback } from "@/apis/feedback";
import { AttachmentInput, type UploadedAttachment } from "@/components/attachments/AttachmentInput";
import { AttachmentResponse, FeedbackResponseType, StepRequestAnswerResponse, StepRequestResponse, StepResponse } from "@/lib/stepTypes";
import { useToast } from "@/hooks/use-toast";
import { getMyInfo, MeResponse } from "@/apis/user";
import { stepRequestStatusMap } from "@/constants/stepRequestStatus";

export default function ApprovalDetail() {
  const { id, approvalId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionType, setDecisionType] = useState<FeedbackResponseType>("REJECT");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAttachments, setEditAttachments] = useState<UploadedAttachment[]>([]);
  const [decisionAttachments, setDecisionAttachments] = useState<UploadedAttachment[]>([]);

  const requestId = Number(approvalId);
  const projectId = Number(id);
  const { data: requestData, isLoading } = useQuery({
    queryKey: ["step-request-detail", requestId],
    queryFn: () => getStepRequest(requestId),
    enabled: !!requestId,
  });

  const { data: stepsData } = useQuery({
    queryKey: ["project-steps", projectId],
    queryFn: () => getProjectSteps(projectId),
    enabled: !!projectId,
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMyInfo,
  });

  const feedbackMutation = useMutation({
    mutationFn: (payload: { response: FeedbackResponseType; reasonText?: string; attachmentIds?: number[] }) =>
      sendFeedback(requestId, payload),
    onSuccess: () => {
      toast({ title: "처리되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["step-request-detail", requestId] });
      queryClient.invalidateQueries({ queryKey: ["step-request-feedback", requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-step-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: (error: unknown) =>
      toast({
        title: "처리에 실패했습니다.",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const updateRequestMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; attachmentIds?: number[]; links?: string[] }) =>
      updateStepRequest(requestId, payload),
    onSuccess: () => {
      toast({ title: "요청이 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["step-request-detail", requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-step-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
      setShowEditDialog(false);
    },
    onError: (error: unknown) =>
      toast({
        title: "수정 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const resubmitMutation = useMutation({
    mutationFn: () => updateStepRequest(requestId, { status: "REQUESTED" }),
    onSuccess: () => {
      toast({ title: "다시 승인 요청을 보냈습니다." });
      queryClient.invalidateQueries({ queryKey: ["step-request-detail", requestId] });
      queryClient.invalidateQueries({ queryKey: ["step-request-feedback", requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-step-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
    },
    onError: (error: unknown) =>
      toast({
        title: "재요청 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelStepRequest(requestId),
    onSuccess: () => {
      toast({ title: "요청이 취소되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["step-request-detail", requestId] });
      queryClient.invalidateQueries({ queryKey: ["project-step-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-steps", projectId] });
      navigate(`/project/${projectId}/approvals`);
    },
    onError: (error: unknown) =>
      toast({
        title: "취소 실패",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      }),
  });

  const approval = requestData?.data;
  const { data: feedbackData } = useQuery({
    queryKey: ["step-request-feedback", requestId],
    queryFn: () => getFeedback(requestId),
    enabled:
      !!requestId &&
      Boolean(
        approval?.status === "APPROVED" || approval?.status === "REJECTED" || approval?.status === "CHANGE_REQUESTED"
      ),
  });
  const feedback = useMemo(() => {
    const feedbackPayload = feedbackData?.data;
    if (Array.isArray(feedbackPayload)) return feedbackPayload[0];
    return feedbackPayload as StepRequestAnswerResponse | undefined;
  }, [feedbackData]);
  const me = meData?.data as MeResponse | undefined;

  useEffect(() => {
    if (showEditDialog && approval) {
      setEditTitle(approval.title);
      setEditDescription(approval.description || "");
      const requestAttachments = approval.attachments ?? approval.files ?? [];
      const linkValues = approval.links ?? [];
      const mapped: UploadedAttachment[] = [
        ...requestAttachments.map((file, index) => {
          const label = renderAttachmentLabel(file);
          const href = typeof file === "string" ? file : file?.url || file?.path;
          return {
            id: typeof file === "string" ? -(index + 1) : file?.id ?? index,
            name: label,
            url: href,
            isLink: Boolean(href),
          };
        }),
        ...linkValues.map((link, index) => {
          if (typeof link === "string") {
            return { id: -(requestAttachments.length + index + 1), name: link, url: link, isLink: true };
          }
          return {
            id: link?.id ?? -(requestAttachments.length + index + 1),
            name: link?.fileName || link?.url || link?.path || `링크 ${index + 1}`,
            url: link?.url || link?.path,
            isLink: true,
          };
        }),
      ];
      setEditAttachments(mapped);
    }
  }, [showEditDialog, approval]);

  if (!approval) {
    return (
      <ProjectLayout>
        <div className="text-center py-12">
          {isLoading ? (
            <p className="text-muted-foreground">승인 요청을 불러오는 중입니다...</p>
          ) : (
            <>
              <p className="text-muted-foreground">승인 요청을 찾을 수 없습니다.</p>
              <Button onClick={() => navigate(`/project/${id}/approvals`)} className="mt-4">
            목록으로 돌아가기
          </Button>
            </>
          )}
        </div>
      </ProjectLayout>
    );
  }

  const getStatusBadge = (status: StepRequestResponse["status"]) => {
    const mapped = stepRequestStatusMap[status];
    const label = mapped?.label ?? status;
    if (status === "APPROVED") return <Badge className="bg-green-500 text-white hover:bg-green-600">{label}</Badge>;
    if (status === "REJECTED") return <Badge variant="destructive">{label}</Badge>;
    if (status === "REQUESTED") return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">{label}</Badge>;
    if (status === "CHANGE_REQUESTED") return <Badge className="bg-amber-500 text-white hover:bg-amber-600">{label}</Badge>;
    if (status === "CANCELED") return <Badge variant="secondary">{label}</Badge>;
    if (mapped?.className) {
      return <Badge className={mapped.className}>{label}</Badge>;
    }
    return <Badge variant="secondary">{label}</Badge>;
  };

  const handleApprove = () => {
    if (!isRequested) {
      toast({ title: "승인할 수 없는 상태입니다.", variant: "destructive" });
      return;
    }
    feedbackMutation.mutate({ response: "APPROVE" });
  };

  const openDecisionDialog = (type: FeedbackResponseType) => {
    setDecisionType(type);
    setRejectReason("");
    setDecisionAttachments([]);
    setShowRejectDialog(true);
  };

  const handleDecision = () => {
    if (!isRequested) {
      toast({ title: "처리할 수 없는 상태입니다.", variant: "destructive" });
      return;
    }
    if ((decisionType === "REJECT" || decisionType === "CHANGE_REQUEST") && !rejectReason.trim()) {
      toast({ title: "사유를 입력해주세요.", variant: "destructive" });
      return;
    }
    const attachmentIds = decisionAttachments.map((a) => a.id);
    feedbackMutation.mutate({ response: decisionType, reasonText: rejectReason, attachmentIds: attachmentIds.length ? attachmentIds : undefined });
  };

  const handleResubmit = () => {
    if (!isChangeRequested) {
      toast({ title: "재요청할 수 없는 상태입니다.", variant: "destructive" });
      return;
    }
    resubmitMutation.mutate();
  };

  const renderAttachmentLabel = (file?: AttachmentResponse | string) => {
    if (typeof file === "string") return file;
    return file?.fileName || file?.name || file?.originalName || file?.url || (file?.id ? `파일 #${file.id}` : "첨부");
  };

  const isRequested = approval.status === "REQUESTED";
  const isChangeRequested = approval.status === "CHANGE_REQUESTED";
  const isRequestCancelable = isRequested;
  const isDecisionable = isRequested;
  const attachments = approval?.files ?? approval?.attachments ?? [];
  const links = approval?.links ?? (approval?.attachments ?? []);
  const statusLabelMap: Record<string, string> = {
    REQUESTED: stepRequestStatusMap.REQUESTED.label,
    APPROVED: stepRequestStatusMap.APPROVED.label,
    REJECTED: stepRequestStatusMap.REJECTED.label,
    CHANGE_REQUESTED: stepRequestStatusMap.CHANGE_REQUESTED.label,
    CANCELED: stepRequestStatusMap.CANCELED.label,
  };
  const feedbackLabelMap: Record<string, string> = {
    APPROVE: "승인",
    REJECT: "반려",
    CHANGE_REQUEST: "수정 요청",
  };
  const decisionCardStyle: Record<StepRequestResponse["status"], string> = {
    APPROVED: "bg-[#F1FFF4] border-emerald-200",
    REJECTED: "bg-[#FFF3F3] border-red-200",
    CHANGE_REQUESTED: "bg-[#FFF7EC] border-amber-200",
    REQUESTED: "bg-muted/40",
    CANCELED: "bg-slate-50 border-slate-200",
  };
  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  const role = (me?.role || "").toUpperCase();
  const isRequester = Boolean(me?.id && approval.requestedBy === me.id);
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  const isClient = role === "CLIENT";
  const isAgency = role === "AGENCY";
  const canDecide = isRequested && (isClient || isSystemAdmin);
  const canChangeRequest = isRequested && (isClient || isSystemAdmin);
  const canEditRequested = isRequested && (isSystemAdmin || (isRequester && isAgency));
  const canResubmit = isChangeRequested && (isSystemAdmin || isRequester);
  const canCancel = isRequested && (isSystemAdmin || isRequester);
  const showActions = canDecide || canChangeRequest || canEditRequested || canResubmit || canCancel;

  const handleSubmitEdit = () => {
    if (!editTitle.trim()) {
      toast({ title: "제목을 입력하세요.", variant: "destructive" });
      return;
    }
    updateRequestMutation.mutate({
      title: editTitle,
      description: editDescription,
      attachmentIds: editAttachments.map((a) => a.id).filter((id) => typeof id === "number" && id > 0),
    });
  };

  const isDecidedStatus = approval.status === "APPROVED" || approval.status === "REJECTED" || approval.status === "CHANGE_REQUESTED";
  const decisionReason = approval.decisionReason || feedback?.reasonText || "";
  const hasDecisionReason = (approval.status === "REJECTED" || approval.status === "CHANGE_REQUESTED") && Boolean(decisionReason?.trim());
  const decisionDisplayAttachments = ((feedback?.attachments ?? []) as (AttachmentResponse | string)[]);
  const decisionFiles = decisionDisplayAttachments.filter((item) => !(item as AttachmentResponse).isLink);
  const decisionLinks = decisionDisplayAttachments.filter((item) => (item as AttachmentResponse).isLink);
  const hasDecisionAttachments = Array.isArray(decisionDisplayAttachments) && decisionDisplayAttachments.length > 0;
  const decisionSectionTitle: Record<StepRequestResponse["status"], string> = {
    APPROVED: "승인 정보",
    REJECTED: "반려 정보",
    CHANGE_REQUESTED: "수정 요청 정보",
    REQUESTED: "결정 정보",
    CANCELED: "결정 정보",
  };
  const feedbackHistory = Array.isArray(feedbackData?.data)
    ? feedbackData.data
    : feedbackData?.data
      ? [feedbackData.data]
      : [];
  const phaseLabelMap: Record<string, string> = {
    CONTRACT: "계약",
    IN_PROGRESS: "진행",
    DELIVERY: "납품",
    MAINTENANCE: "유지보수",
    PENDING: "대기",
    COMPLETED: "완료",
    APPROVED: "승인",
  };
  const steps = (stepsData?.data.steps ?? []) as StepResponse[];
  const matchedStep = steps.find((step) => step.id === approval.stepId);
  const stepPhase = matchedStep?.phase || (approval as { stepPhase?: string }).stepPhase || (approval as { phase?: string }).phase;
  const phaseLabel = phaseLabelMap[stepPhase || ""] || stepPhase || "";
  const requestedByLabel = approval.requestedByName || approval.requestedBy || "-";
  const decidedByLabel = approval.decidedByName || approval.decidedBy || "-";
  const decidedByCompany =
    (approval as { decidedByCompanyName?: string; decidedByCompany?: string }).decidedByCompanyName ||
    (approval as { decidedByCompanyName?: string; decidedByCompany?: string }).decidedByCompany ||
    "";
  const decidedByDisplayCompany = decidedByCompany || "회사명"; // TODO: 결정자 회사 정보를 API로 수신하면 교체하세요.
  const metaDate = formatDateTime(approval.createdAt);

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => navigate(`/project/${id}/approvals`)}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>

        <Card>
          <CardHeader className="space-y-3 border-b">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-2xl">{approval.title}</CardTitle>
              {getStatusBadge(approval.status)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {phaseLabel ? (
                <span className="inline-flex items-center rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground">
                  {phaseLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground font-medium">{requestedByLabel}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground font-medium">{metaDate}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>설명</Label>
              <div className="text-sm text-muted-foreground whitespace-pre-line rounded-md border bg-muted/30 p-3">
                {approval.description || "설명이 없습니다."}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                첨부파일
              </Label>
              <div className="space-y-2">
                {attachments.length ? (
                  attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm flex-1">{renderAttachmentLabel(file)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                링크
              </Label>
              <div className="space-y-2">
                {links.length ? (
                  links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                      <LinkIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm flex-1">{renderAttachmentLabel(link)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">링크가 없습니다.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isDecidedStatus && (
          <Card className={cn("border", decisionCardStyle[approval.status] ?? "bg-muted/40")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {decisionSectionTitle[approval.status] ?? "결정 정보"}
              </CardTitle>
            </CardHeader>
              <CardContent className="pt-0 space-y-4 text-sm text-foreground">
                <Separator className="my-2" />

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap items-start sm:items-center">
                    <span className="text-sm text-muted-foreground min-w-[70px] font-semibold">결정자</span>
                    <span className="text-sm text-foreground/80 flex-1 break-words">
                      {decidedByLabel}
                      {` · ${decidedByDisplayCompany}`}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap items-start sm:items-center">
                    <span className="text-sm text-muted-foreground min-w-[70px] font-semibold">결정일</span>
                    <span className="text-sm text-foreground/80 flex-1 break-words whitespace-pre-line">
                      {formatDateTime(approval.decidedAt)}
                    </span>
                  </div>
                  {hasDecisionReason && (
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap items-start sm:items-center">
                      <span className="text-sm text-muted-foreground min-w-[70px] font-semibold">사유</span>
                      <span className="text-sm text-foreground/80 flex-1 break-words whitespace-pre-line leading-relaxed block">
                        {decisionReason}
                      </span>
                    </div>
                  )}
                </div>

              {hasDecisionAttachments && (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">첨부파일 / 링크</p>
                    <div className="space-y-2">
                      {decisionFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {(() => {
                            const label = renderAttachmentLabel(file);
                            const href = typeof file === "string" ? file : file?.url || file?.path;
                            if (href) {
                              return (
                                <a
                                  className="text-sm font-semibold text-blue-600 hover:underline break-all"
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {label}
                                </a>
                              );
                            }
                              return <span className="text-sm font-semibold break-words">{label}</span>;
                          })()}
                        </div>
                      ))}
                      {decisionLinks.map((link, index) => {
                        const label = renderAttachmentLabel(link);
                        const href = typeof link === "string" ? link : link?.url || link?.path;
                        return (
                          <div key={`link-${index}`} className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-blue-500" />
                            {href ? (
                              <a
                                className="text-sm font-semibold text-blue-600 hover:underline break-all"
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {label}
                              </a>
                            ) : (
                              <span className="text-sm font-semibold break-words">{label}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {feedbackHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">결정 이력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {feedbackHistory.map((item, index) => (
                <div key={`${item.id ?? item.response}-${index}`} className="flex items-start gap-3 text-sm">
                  <div className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
                    <div className="flex-1 space-y-0.5">
                      <div className="font-medium text-foreground">
                        {formatDateTime(item.decidedAt ?? item.createdAt)} · {feedbackLabelMap[item.response] ?? item.response} · {item.respondedByName || item.respondedBy || "결정자"}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 (TODO: 권한 및 상태에 따라 표시) */}
        {showActions && (
          <div className="flex gap-2 flex-wrap">
            {isRequested && (
              <>
                {canDecide && (
                  <>
                    <Button onClick={handleApprove} className="flex-1 bg-blue-500 hover:bg-blue-600" disabled={feedbackMutation.isPending}>
                      승인
                    </Button>
                    <Button 
                      onClick={() => openDecisionDialog("REJECT")} 
                      variant="destructive"
                      className="flex-1"
                      disabled={feedbackMutation.isPending}
                    >
                      반려
                    </Button>
                  </>
                )}
                {canChangeRequest && (
                  <Button
                    onClick={() => openDecisionDialog("CHANGE_REQUEST")}
                    variant="secondary"
                    className="flex-1"
                    disabled={feedbackMutation.isPending}
                  >
                    수정 요청
                  </Button>
                )}
                {canEditRequested && (
                  <Button
                    onClick={() => setShowEditDialog(true)}
                    variant="secondary"
                    className="flex-1"
                    disabled={updateRequestMutation.isPending}
                  >
                    요청 내용 수정
                  </Button>
                )}
                {canCancel && (
                  <Button
                    onClick={() => {
                      if (window.confirm("요청을 취소하시겠습니까?")) {
                        cancelMutation.mutate();
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={!isRequestCancelable || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? "취소 중..." : "요청 취소"}
                  </Button>
                )}
              </>
            )}

            {isChangeRequested && canResubmit && (
              <>
                <Button
                  onClick={() => setShowEditDialog(true)}
                  variant="secondary"
                  className="flex-1"
                  disabled={updateRequestMutation.isPending}
                >
                  요청 내용 수정
                </Button>
                <Button
                  onClick={handleResubmit}
                  className="flex-1"
                  disabled={resubmitMutation.isPending}
                >
                  {resubmitMutation.isPending ? "요청 중..." : "다시 승인 요청"}
                </Button>
              </>
            )}
          </div>
        )}

        {!isDecisionable && approval.status === "CANCELED" && (
          <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            요청이 취소되어 승인/반려를 진행할 수 없습니다.
          </div>
        )}
      </div>

      {/* 결정 입력 다이얼로그 (반려/변경 요청) */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionType === "CHANGE_REQUEST" ? "변경 요청" : "승인 반려"}</DialogTitle>
            <DialogDescription className="sr-only">결정 사유와 첨부를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{decisionType === "CHANGE_REQUEST" ? "변경 요청 사유" : "반려 사유"}</Label>
              <Textarea
                placeholder={decisionType === "CHANGE_REQUEST" ? "무엇을 수정해야 하는지 구체적으로 작성해주세요." : "반려 사유를 입력해주세요."}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <AttachmentInput
              targetType="STEP_REQUEST_ANSWER"
              attachments={decisionAttachments}
              onChange={setDecisionAttachments}
              label="첨부파일 / 링크"
              disabled={feedbackMutation.isPending}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setDecisionAttachments([]);
              }}
            >
              취소
            </Button>
            <Button variant={decisionType === "CHANGE_REQUEST" ? "secondary" : "destructive"} onClick={handleDecision} disabled={feedbackMutation.isPending}>
              {feedbackMutation.isPending ? "처리 중..." : decisionType === "CHANGE_REQUEST" ? "변경 요청" : "반려"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요청 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>요청 수정</DialogTitle>
            <DialogDescription className="sr-only">요청 내용을 수정하고 첨부를 업데이트하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>요청 제목</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>요청 내용</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[140px]"
              />
            </div>
            <AttachmentInput
              targetType="STEP_REQUEST"
              attachments={editAttachments}
              onChange={setEditAttachments}
              label="첨부파일 / 링크"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitEdit} disabled={updateRequestMutation.isPending}>
              {updateRequestMutation.isPending ? "수정 중..." : "수정 완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
