import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelStepRequest, getStepRequest, updateStepRequest } from "@/lib/stepRequest";
import { getFeedback, sendFeedback } from "@/lib/feedback";
import { AttachmentResponse, FeedbackResponseType, StepRequestAnswerResponse, StepRequestResponse } from "@/lib/stepTypes";
import { useToast } from "@/hooks/use-toast";
import { getMyInfo, MeResponse } from "@/lib/user";

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
  const [editAttachmentIds, setEditAttachmentIds] = useState<number[]>([]);
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [editAttachmentInput, setEditAttachmentInput] = useState("");
  const [editLinkInput, setEditLinkInput] = useState("");

  const requestId = Number(approvalId);
  const projectId = Number(id);

  const { data: requestData, isLoading } = useQuery({
    queryKey: ["step-request-detail", requestId],
    queryFn: () => getStepRequest(requestId),
    enabled: !!requestId,
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMyInfo,
  });

  const { data: feedbackData } = useQuery({
    queryKey: ["step-request-feedback", requestId],
    queryFn: () => getFeedback(requestId),
    enabled: !!requestId,
  });

  const feedbackMutation = useMutation({
    mutationFn: (payload: { response: FeedbackResponseType; reasonText?: string }) =>
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
      const attachmentIds = (approval.files ?? approval.attachments ?? [])
        .map((file) => (typeof file === "object" && file?.id ? file.id : undefined))
        .filter((id): id is number => typeof id === "number");
      setEditAttachmentIds(attachmentIds);
      const linkValues = (approval.links ?? []).map((link) => {
        if (typeof link === "string") return link;
        return link?.url || link?.path || link?.fileName || "";
      }).filter(Boolean);
      setEditLinks(linkValues as string[]);
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
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">승인 완료</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">반려됨</Badge>;
      case "REQUESTED":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">승인 요청 중</Badge>;
      case "CHANGE_REQUESTED":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">변경 요청됨</Badge>;
      case "CANCELED":
        return <Badge variant="secondary">취소됨</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: StepRequestResponse["status"]) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 border-green-600 bg-green-50";
      case "REJECTED":
        return "text-red-600 border-red-600 bg-red-50";
      case "REQUESTED":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      case "CHANGE_REQUESTED":
        return "text-amber-600 border-amber-600 bg-amber-50";
      case "CANCELED":
        return "text-slate-600 border-slate-200 bg-slate-50";
      default:
        return "text-muted-foreground border-dashed";
    }
  };

  const getStatusDotColor = (status: StepRequestResponse["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "REQUESTED":
        return "bg-yellow-500";
      case "CHANGE_REQUESTED":
        return "bg-amber-500";
      case "CANCELED":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
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
    feedbackMutation.mutate({ response: decisionType, reasonText: rejectReason });
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
  const links = approval?.links ?? [];
  const statusLabelMap: Record<string, string> = {
    REQUESTED: "승인 요청 중",
    APPROVED: "승인 완료",
    REJECTED: "반려됨",
    CHANGE_REQUESTED: "변경 요청됨",
    CANCELED: "요청 취소",
  };
  const isRequester = Boolean(me?.id && approval.requestedBy === me.id);
  const isSystemAdmin = me?.role === "SYSTEM_ADMIN";
  const isClient = me?.role === "CLIENT";
  const isAgency = me?.role === "AGENCY";
  const canDecide = isRequested && (isClient || isSystemAdmin);
  const canChangeRequest = isRequested && (isClient || isSystemAdmin);
  const canEditRequested = isRequested && (isSystemAdmin || (isRequester && isAgency));
  const canEditChangeRequested = isChangeRequested && (isSystemAdmin || (isRequester && isAgency));
  const canCancel = isRequested && (isSystemAdmin || isRequester);
  const showActions = canDecide || canChangeRequest || canEditRequested || canEditChangeRequested || canCancel;

  const handleEditAddAttachment = () => {
    if (!editAttachmentInput.trim()) return;
    const value = Number(editAttachmentInput.trim());
    if (Number.isNaN(value)) {
      toast({ title: "첨부 ID는 숫자여야 합니다.", variant: "destructive" });
      return;
    }
    setEditAttachmentIds(prev => [...prev, value]);
    setEditAttachmentInput("");
  };

  const handleEditRemoveAttachment = (index: number) => {
    setEditAttachmentIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditAddLink = () => {
    if (!editLinkInput.trim()) return;
    setEditLinks(prev => [...prev, editLinkInput.trim()]);
    setEditLinkInput("");
  };

  const handleEditRemoveLink = (index: number) => {
    setEditLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEdit = () => {
    if (!editTitle.trim()) {
      toast({ title: "제목을 입력하세요.", variant: "destructive" });
      return;
    }
    updateRequestMutation.mutate({
      title: editTitle,
      description: editDescription,
      attachmentIds: editAttachmentIds,
      links: editLinks,
    });
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/project/${id}/approvals`)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{approval.category}</h1>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{approval.title}</CardTitle>
              {getStatusBadge(approval.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* 제목 선택 */}
            <div className="space-y-2">
              <Select defaultValue={String(approval.id)}>
                <SelectTrigger className={cn("w-full h-12", getStatusColor(approval.status))}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", getStatusDotColor(approval.status))} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(approval.id)}>{approval.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label>설명</Label>
              <div className="text-sm text-muted-foreground whitespace-pre-line p-3 bg-muted/30 rounded-md">
                {approval.description || "설명이 없습니다."}
              </div>
            </div>

            {/* 첨부파일 */}
            <div className="space-y-2">
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

            {/* 링크 */}
            <div className="space-y-2">
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

            {/* 요청자 */}
            <div className="space-y-2">
              <Label>요청자</Label>
              <Input value={approval.requestedByName || approval.requestedBy || ""} readOnly />
            </div>

            {/* 요청일 */}
            <div className="space-y-2">
              <Label>요청일</Label>
              <Input value={new Date(approval.createdAt).toLocaleString("ko-KR")} readOnly />
            </div>

            {/* 상태 */}
            <div className="space-y-2">
              <Label>상태</Label>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  approval.status === "APPROVED" && "bg-green-500",
                  approval.status === "REJECTED" && "bg-red-500",
                  approval.status === "REQUESTED" && "bg-yellow-500",
                  approval.status === "CHANGE_REQUESTED" && "bg-amber-500",
                  approval.status === "CANCELED" && "bg-slate-400"
                )}>
                  {statusLabelMap[approval.status] || approval.status}
                </Badge>
              </div>
            </div>

            {/* 반려 정보 (반려/변경 요청 등) */}
            {approval.status === "REJECTED" && (
              <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                <div className="flex items-center gap-2 pb-2 border-b border-red-200">
                  <div className="font-semibold text-red-700">반려 정보</div>
                </div>
                
                <div className="space-y-2">
                  <Label>반려자</Label>
                  <Input value={approval.decidedByName || approval.decidedBy || ""} readOnly className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>반려일</Label>
                  <Input value={approval.decidedAt ? new Date(approval.decidedAt).toLocaleString("ko-KR") : ""} readOnly className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>반려사유</Label>
                  <Textarea 
                    value={approval.decisionReason || feedback?.reasonText || ""} 
                    readOnly 
                    className="min-h-[80px] bg-white"
                  />
                </div>

                {/* 첨부파일 */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      첨부파일
                    </Label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm flex-1">{renderAttachmentLabel(file)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 링크 */}
                {links.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      링크
                    </Label>
                    <div className="space-y-2">
                      {links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                          <LinkIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm flex-1">{renderAttachmentLabel(link)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 승인자/승인일 (승인된 경우에만 표시) */}
            {approval.status === "APPROVED" && (
              <>
                <div className="space-y-2">
                  <Label>승인자</Label>
                  <Input value={approval.decidedByName || approval.decidedBy || ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>승인일</Label>
                  <Input value={approval.decidedAt ? new Date(approval.decidedAt).toLocaleString("ko-KR") : ""} readOnly />
                </div>
              </>
            )}

            {/* 액션 버튼 (권한 및 상태에 따라 표시) */}
            {showActions && (
              <div className="flex gap-2 pt-4 flex-wrap">
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
                    변경 요청
                  </Button>
                )}
                {(canEditRequested || canEditChangeRequested) && (
                  <Button
                    onClick={() => setShowEditDialog(true)}
                    variant="secondary"
                    className="flex-1"
                    disabled={updateRequestMutation.isPending}
                  >
                    {isChangeRequested ? "요청 수정(재제출)" : "요청 수정"}
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
              </div>
            )}

            {!isDecisionable && approval.status === "CANCELED" && (
              <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                요청이 취소되어 승인/반려를 진행할 수 없습니다.
              </div>
            )}
            {feedback && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-semibold">최근 결정</p>
                <p className="text-muted-foreground mt-1">
                  {feedback.response} · {feedback.decidedAt ? new Date(feedback.decidedAt).toLocaleString("ko-KR") : feedback.createdAt}
                </p>
                {feedback.reasonText && <p className="mt-1 whitespace-pre-line text-muted-foreground">{feedback.reasonText}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 결정 입력 다이얼로그 (반려/변경 요청) */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionType === "CHANGE_REQUEST" ? "변경 요청" : "승인 반려"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{decisionType === "CHANGE_REQUEST" ? "변경 요청 사유" : "반려 사유"}</Label>
              <Textarea
                placeholder={decisionType === "CHANGE_REQUEST" ? "무엇을 수정해야 하는지 구체적으로 작성해주세요." : "반려 사유를 입력해주세요."}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
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
            <div className="space-y-2">
              <Label>첨부파일 ID</Label>
              <div className="flex gap-2">
                <Input
                  value={editAttachmentInput}
                  onChange={(event) => setEditAttachmentInput(event.target.value)}
                  placeholder="첨부 ID를 입력하세요"
                />
                <Button type="button" variant="secondary" onClick={handleEditAddAttachment}>
                  추가
                </Button>
              </div>
              {editAttachmentIds.length > 0 && (
                <div className="space-y-2">
                  {editAttachmentIds.map((file, index) => (
                    <div
                      key={`${file}-${index}`}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>첨부 ID {file}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleEditRemoveAttachment(index)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>링크</Label>
              <div className="flex gap-2">
                <Input
                  value={editLinkInput}
                  onChange={(event) => setEditLinkInput(event.target.value)}
                  placeholder="링크를 입력하세요"
                />
                <Button type="button" variant="secondary" onClick={handleEditAddLink}>
                  추가
                </Button>
              </div>
              {editLinks.length > 0 && (
                <div className="space-y-2">
                  {editLinks.map((link, index) => (
                    <div
                      key={`${link}-${index}`}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span className="truncate">{link}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleEditRemoveLink(index)}>
                        제거
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
