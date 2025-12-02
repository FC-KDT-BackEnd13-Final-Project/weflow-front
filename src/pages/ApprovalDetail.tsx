import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Link as LinkIcon, ArrowLeft, X } from "lucide-react";

type StepRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED";

interface StepFile {
  id: number;
  fileUrl: string;
  fileName: string;
}

interface StepLink {
  id: number;
  url: string;
  displayName: string;
}

interface ReviewerInfo {
  userId: number;
  name: string;
  role: string;
  companyName: string;
}

interface StepFeedback {
  approved: boolean;
  reviewer: ReviewerInfo;
  reviewedAt: string;
  reason: string;
  files: StepFile[];
  links: StepLink[];
}

interface StepRequestDetail {
  id: number;
  title: string;
  description: string;
  status: StepRequestStatus;
  requestedBy: number;
  createdAt: string;
  files: StepFile[];
  links: StepLink[];
  feedback: StepFeedback | null;
}

const mockStepRequestDetails: StepRequestDetail[] = [
  {
    id: 501,
    title: "디자인 시안 승인 요청드립니다",
    description: "최종 디자인입니다.",
    status: "REJECTED",
    requestedBy: 17,
    createdAt: "2025-02-05T11:00:00",
    files: [
      { id: 801, fileUrl: "https://cdn/design.png", fileName: "design.png" },
    ],
    links: [
      { id: 901, url: "https://figma.com/xxx", displayName: "Figma 링크" },
    ],
    feedback: {
      approved: false,
      reviewer: {
        userId: 7,
        name: "김철수",
        role: "CUSTOMER",
        companyName: "ABC전자",
      },
      reviewedAt: "2025-11-20T14:30:00",
      reason: "기능 누락으로 수정이 필요합니다.",
      files: [
        { id: 701, fileUrl: "https://cdn/reject.docx", fileName: "화면명세서_v1.docx" },
      ],
      links: [
        { id: 801, url: "https://drive.google.com/xxx", displayName: "Google Drive - 화면설계 회의록" },
      ],
    },
  },
  {
    id: 502,
    title: "퍼블리싱 결과물 승인 요청",
    description: "최신 퍼블리싱 산출물 승인 요청입니다.",
    status: "APPROVED",
    requestedBy: 21,
    createdAt: "2025-02-04T16:30:00",
    files: [
      { id: 900, fileUrl: "https://cdn/publish.zip", fileName: "publish_bundle.zip" },
    ],
    links: [],
    feedback: {
      approved: true,
      reviewer: {
        userId: 5,
        name: "박고객",
        role: "CUSTOMER",
        companyName: "위플로우",
      },
      reviewedAt: "2025-02-04T17:00:00",
      reason: "좋습니다. 일정대로 진행해주세요.",
      files: [],
      links: [],
    },
  },
  {
    id: 503,
    title: "테스트 시나리오 승인 요청",
    description: "시나리오 초안입니다.",
    status: "REQUESTED",
    requestedBy: 18,
    createdAt: "2025-02-02T09:45:00",
    files: [],
    links: [],
    feedback: null,
  },
];

const statusConfig: Record<StepRequestStatus, { label: string; badge: string }> = {
  REQUESTED: { label: "요청 중", badge: "bg-yellow-500 text-white" },
  APPROVED: { label: "승인 완료", badge: "bg-green-500 text-white" },
  REJECTED: { label: "반려", badge: "bg-red-500 text-white" },
};

const formatDateTime = (value: string) => new Date(value).toLocaleString("ko-KR", { hour12: false });

export default function ApprovalDetail() {
  const { id, approvalId } = useParams();
  const navigate = useNavigate();
  const [reviewReason, setReviewReason] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewLinks, setReviewLinks] = useState<Array<{ url: string; displayName: string }>>([]);
  const [linkInput, setLinkInput] = useState("");
  const [reviewDialogAction, setReviewDialogAction] = useState<null | "APPROVE" | "REJECT">(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const request = useMemo(() => {
    if (!approvalId) return undefined;
    return mockStepRequestDetails.find((item) => item.id.toString() === approvalId);
  }, [approvalId]);

  if (!request) {
    return (
      <ProjectLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">승인 요청을 찾을 수 없습니다.</p>
          <Button onClick={() => navigate(`/project/${id}/approvals`)} className="mt-4">
            목록으로 돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const statusBadge = statusConfig[request.status];
  const isPending = request.status === "REQUESTED";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setReviewFiles(prev => [...prev, ...Array.from(files)]);
    event.target.value = "";
  };

  const removeReviewFile = (index: number) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addReviewLink = () => {
    if (!linkInput.trim()) return;
    setReviewLinks(prev => [...prev, { url: linkInput.trim(), displayName: linkInput.trim() }]);
    setLinkInput("");
  };

  const removeReviewLink = (index: number) => {
    setReviewLinks(prev => prev.filter((_, i) => i !== index));
  };

  const resetReviewForm = () => {
    setReviewReason("");
    setReviewFiles([]);
    setReviewLinks([]);
    setLinkInput("");
  };

  const openReviewDialog = (action: "APPROVE" | "REJECT") => {
    resetReviewForm();
    setReviewDialogAction(action);
  };

  const handleSubmitReview = (response: "APPROVE" | "REJECT") => {
    if (response === "REJECT" && !reviewReason.trim()) {
      alert("반려 시 사유를 입력해주세요.");
      return;
    }
    const trimmedComment = reviewReason.trim();
    console.log("STEP REVIEW SUBMIT", {
      requestId: request.id,
      response,
      reasonText: trimmedComment,
      files: reviewFiles.map((file) => ({
        fileName: file.name,
        fileUrl: file.name,
        fileSize: file.size,
      })),
      links: reviewLinks,
    });
    resetReviewForm();
    setReviewDialogAction(null);
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/project/${id}/approvals`)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-2xl font-bold text-foreground">단계별 승인 상세</h1>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <Badge className={statusBadge.badge}>{statusBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>요청 설명</Label>
              <div className="text-sm text-muted-foreground whitespace-pre-line p-3 bg-muted/30 rounded-md">
                {request.description}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>요청자</Label>
                <div className="text-sm text-muted-foreground">사용자 ID {request.requestedBy}</div>
              </div>
              <div className="space-y-2">
                <Label>요청일</Label>
                <div className="text-sm text-muted-foreground">{formatDateTime(request.createdAt)}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                첨부파일
              </Label>
              {request.files.length > 0 ? (
                <div className="space-y-2">
                  {request.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg bg-background text-sm hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>{file.fileName}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">첨부파일 없음</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                링크
              </Label>
              {request.links.length > 0 ? (
                <div className="space-y-2">
                  {request.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg bg-background text-sm hover:bg-muted"
                    >
                      <LinkIcon className="h-4 w-4 text-blue-500" />
                      <span className="truncate">{link.displayName}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">등록된 링크 없음</p>
              )}
            </div>

            {request.feedback ? (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">검토 결과</p>
                  <Badge variant={request.feedback.approved ? "default" : "destructive"}>
                    {request.feedback.approved ? "승인" : "반려"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.feedback.reviewer.companyName} · {request.feedback.reviewer.name} ({request.feedback.reviewer.role})
                </div>
                <div className="text-xs text-muted-foreground">
                  검토일 {formatDateTime(request.feedback.reviewedAt)}
                </div>
                <div className="space-y-1 text-sm">
                  <Label>사유</Label>
                  <div className="text-muted-foreground">{request.feedback.reason}</div>
                </div>
                <div className="space-y-2">
                  <Label>검토 첨부</Label>
                  {request.feedback.files.length > 0 ? (
                    request.feedback.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2 border rounded"
                      >
                        <FileText className="h-4 w-4" />
                        {file.fileName}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">없음</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>검토 링크</Label>
                  {request.feedback.links.length > 0 ? (
                    request.feedback.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2 border rounded"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {link.displayName}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">없음</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4 bg-muted/20 text-sm text-muted-foreground">
                아직 검토가 이루어지지 않았습니다.
              </div>
            )}

            {isPending && (
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => openReviewDialog("APPROVE")}>
                  승인
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => openReviewDialog("REJECT")}
                >
                  반려
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={reviewDialogAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialogAction(null);
            resetReviewForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{reviewDialogAction === "REJECT" ? "반려 사유 입력" : "승인 의견 입력"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{reviewDialogAction === "REJECT" ? "반려 사유" : "승인 의견"}</Label>
              <Textarea
                placeholder="내용을 입력하세요"
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                첨부파일
              </Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <FileText className="h-4 w-4" />
                  파일 선택
                </Button>
                <span className="text-sm text-muted-foreground">
                  {reviewFiles.length > 0 ? `${reviewFiles.length}개 파일 선택됨` : "선택된 파일 없음"}
                </span>
              </div>
              {reviewFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {reviewFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeReviewFile(index)}
                      >
                        <X className="h-4 w-4" />
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
                  placeholder="https://example.com"
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                />
                <Button type="button" onClick={addReviewLink}>
                  추가
                </Button>
              </div>
              {reviewLinks.length > 0 && (
                <div className="space-y-2">
                  {reviewLinks.map((link, index) => (
                    <div key={`${link.url}-${index}`} className="flex items-center justify-between text-sm border rounded px-3 py-2 bg-muted/40">
                      <span>{link.displayName}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeReviewLink(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogAction(null)}>
              취소
            </Button>
            <Button
              className={reviewDialogAction === "REJECT" ? "bg-destructive text-white hover:bg-destructive/90" : ""}
              onClick={() => reviewDialogAction && handleSubmitReview(reviewDialogAction)}
              disabled={!reviewDialogAction || (reviewDialogAction === "REJECT" && !reviewReason.trim())}
            >
              {reviewDialogAction === "REJECT" ? "반려" : "승인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
