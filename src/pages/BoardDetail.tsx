import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Paperclip, Link2, MessageSquare, Clock3, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  boardStatusLabels,
  boardStatusStyles,
  BoardPostStatus,
  BoardApprovalStatus,
} from "@/constants/boardStatus";

type ApiPostStatus = "IN_PROGRESS" | "COMPLETED";

interface AuthorInfo {
  memberId: number;
  name: string;
  role: string;
  companyName: string;
}

interface StepInfo {
  stepId: number;
  stepName: string;
}

interface Attachment {
  fileId: number;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

interface LinkItem {
  linkId: number;
  url: string;
  title: string;
}

interface RespondentInfo {
  memberId: number;
  name: string;
}

interface QuestionAnswer {
  response: "YES" | "NO" | "ETC";
  respondent: RespondentInfo;
  respondedAt: string;
}

interface PostQuestion {
  questionId: number;
  content: string;
  buttonLabels: {
    yes: string;
    no: string;
  };
  answer: QuestionAnswer | null;
  answerAction?: "confirm" | "reject";
}

interface PostComment {
  id: string;
  author: string;
  role: string;
  createdAt: string;
  content: string;
  replies?: PostComment[];
}

interface BoardPostDetail {
  id: number;
  title: string;
  content: string;
  status: ApiPostStatus;
  author: AuthorInfo;
  projectStatus: ApiPostStatus;
  step: StepInfo;
  files: Attachment[];
  links: LinkItem[];
  questions: PostQuestion[];
  parentPost: number | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  comments: PostComment[];
}

const mockPostDetails: BoardPostDetail[] = [
  {
    id: 42,
    title: "디자인 시안 검토 요청",
    content: "메인 페이지 디자인 시안입니다. 검토 부탁드립니다.",
    status: "IN_PROGRESS",
    projectStatus: "IN_PROGRESS",
    author: {
      memberId: 3,
      name: "이개발",
      role: "DEVELOPER",
      companyName: "비엔시스템",
    },
    step: {
      stepId: 3,
      stepName: "디자인",
    },
    files: [
      {
        fileId: 10,
        fileName: "메인페이지_시안_v1.png",
        fileSize: 2048000,
        downloadUrl: "/api/files/10/download",
      },
    ],
    links: [
      {
        linkId: 5,
        url: "https://figma.com/file/xxx",
        title: "Figma 디자인 링크",
      },
    ],
    questions: [
      {
        questionId: 1,
        content: "메인 배너 색상 이대로 진행할까요?",
        buttonLabels: {
          yes: "승인",
          no: "수정요청",
        },
        answer: {
          response: "YES",
          respondent: {
            memberId: 5,
            name: "김고객",
          },
          respondedAt: "2025-01-16T14:00:00",
        },
        answerAction: "confirm",
      },
      {
        questionId: 2,
        content: "서브 페이지도 같은 스타일로 진행할까요?",
        buttonLabels: {
          yes: "네",
          no: "아니오",
        },
        answer: null,
      },
    ],
    parentPost: null,
    isEdited: false,
    createdAt: "2025-01-16T10:30:00",
    updatedAt: "2025-01-16T10:30:00",
    comments: [
      {
        id: "c-1",
        author: "김고객",
        role: "고객사",
        createdAt: "2025-01-16 12:00",
        content: "메인 배너 이미지는 조금 더 따뜻한 색감으로 부탁드립니다.",
      },
      {
        id: "c-2",
        author: "이개발",
        role: "DEVELOPER",
        createdAt: "2025-01-16 12:20",
        content: "네, 수정 시안 바로 공유드리겠습니다.",
      },
    ],
  },
  {
    id: 43,
    title: "요구사항 정리본 공유",
    content: "최신 요구사항 정리본입니다. 변경 사항 참고 부탁드립니다.",
    status: "COMPLETED",
    projectStatus: "COMPLETED",
    author: {
      memberId: 4,
      name: "박PM",
      role: "PM",
      companyName: "위플로우",
    },
    step: {
      stepId: 1,
      stepName: "요구사항 정의",
    },
    files: [
      {
        fileId: 11,
        fileName: "요구사항정리_v4.xlsx",
        fileSize: 512000,
        downloadUrl: "/api/files/11/download",
      },
    ],
    links: [
      {
        linkId: 6,
        url: "https://docs.google.com/document/d/req",
        title: "회의록 링크",
      },
    ],
    questions: [
      {
        questionId: 3,
        content: "관리자 메뉴에서 통계 항목 5개로 확정할까요?",
        buttonLabels: {
          yes: "가능",
          no: "재논의",
        },
        answer: {
          response: "NO",
          respondent: {
            memberId: 6,
            name: "최고객",
          },
          respondedAt: "2025-01-15T09:30:00",
        },
        answerAction: "reject",
      },
    ],
    parentPost: null,
    isEdited: true,
    createdAt: "2025-01-15T08:00:00",
    updatedAt: "2025-01-15T10:10:00",
    comments: [
      {
        id: "c-3",
        author: "최고객",
        role: "고객사",
        createdAt: "2025-01-15 09:35",
        content: "통계 항목은 7개로 늘려주세요.",
      },
    ],
  },
];

const apiStatusToBoardStatus: Record<ApiPostStatus, BoardPostStatus> = {
  IN_PROGRESS: "progress",
  COMPLETED: "complete",
};

const projectStatusLabels: Record<ApiPostStatus, string> = {
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { hour12: false });
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
};

export default function BoardDetail() {
  const navigate = useNavigate();
  const { id, postId } = useParams();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [questionSelections, setQuestionSelections] = useState<Record<number, "confirm" | "reject">>({});
  const [actionDialog, setActionDialog] = useState<{ questionId: number; action: "confirm" | "reject" } | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [visibleReplyForms, setVisibleReplyForms] = useState<Record<string, boolean>>({});

  const post = useMemo(() => {
    if (!postId) return undefined;
    return mockPostDetails.find((item) => item.id.toString() === postId);
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    const initialSelections: Record<number, "confirm" | "reject"> = {};
    post.questions.forEach((question) => {
      const derivedAction = question.answerAction
        ?? (question.answer ? (question.answer.response === "NO" ? "reject" : "confirm") : undefined);
      if (derivedAction) {
        initialSelections[question.questionId] = derivedAction;
      }
    });
    setQuestionSelections(initialSelections);
  }, [post]);

  if (!post) {
    return (
      <ProjectLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <p className="text-lg font-medium text-foreground">게시글을 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground">삭제되었거나 존재하지 않는 게시글입니다.</p>
          <Button onClick={() => navigate(`/project/${id}/board`)} className="mt-4">
            게시판으로 돌아가기
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const postStatusVariant = apiStatusToBoardStatus[post.status] ?? "progress";
  const projectStatusLabelText = projectStatusLabels[post.projectStatus] ?? post.projectStatus;
  const overallQuestionStatus: BoardApprovalStatus = post.questions.some((q) => q.answer?.response === "NO")
    ? "rejected"
    : post.questions.every((q) => q.answer)
      ? "approved"
      : "request";

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    toast({
      title: "댓글이 작성되었습니다."
    });
    setNewComment("");
  };

  const toggleReplyForm = (commentId: string) => {
    setVisibleReplyForms(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: prev[commentId] ?? "",
    }));
  };

  const handleReplyInputChange = (commentId: string, value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value,
    }));
  };

  const handleReplySubmit = (commentId: string) => {
    const content = (replyInputs[commentId] ?? "").trim();
    if (!content) return;
    toast({
      title: "답글이 작성되었습니다.",
      description: content,
    });
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: "",
    }));
    setVisibleReplyForms(prev => ({
      ...prev,
      [commentId]: false,
    }));
  };

  const handleReplyCancel = (commentId: string) => {
    setVisibleReplyForms(prev => ({
      ...prev,
      [commentId]: false,
    }));
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: "",
    }));
  };

  const renderComments = (comments: PostComment[], depth = 0) =>
    comments.map((comment) => (
      <div
        key={comment.id}
        className={cn(
          "rounded-lg border p-4 space-y-2 bg-muted/30",
          depth > 0 ? "ml-6 mt-2" : ""
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{comment.author}</span>
            <Badge variant="secondary" className="text-xs">
              {comment.role}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {comment.createdAt}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => toggleReplyForm(comment.id)}
          >
            {visibleReplyForms[comment.id] ? "답글 닫기" : "답글"}
          </Button>
        </div>
        <p className="text-sm text-foreground whitespace-pre-line">{comment.content}</p>
        {visibleReplyForms[comment.id] && (
          <div className="space-y-2">
            <Textarea
              value={replyInputs[comment.id] ?? ""}
              onChange={(event) => handleReplyInputChange(comment.id, event.target.value)}
              placeholder="답글을 입력하세요"
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReplyCancel(comment.id)}
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleReplySubmit(comment.id)}
                disabled={!(replyInputs[comment.id] ?? "").trim()}
              >
                답글 등록
              </Button>
            </div>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, depth + 1)}
      </div>
    ));

  const openQuestionAction = (questionId: number, action: "confirm" | "reject") => {
    if (!post) return;
    const question = post.questions.find((item) => item.questionId === questionId);
    if (!question || question.answer) return;

    setActionDialog({ questionId, action });
    setActionComment("");
  };

  const handleSubmitQuestionAction = () => {
    if (!actionDialog || !actionComment.trim()) return;
    const trimmedComment = actionComment.trim();
    setQuestionSelections((prev) => ({
      ...prev,
      [actionDialog.questionId]: actionDialog.action,
    }));

    toast({
      title: `${actionDialogLabel} 처리 완료`,
      description: trimmedComment,
    });

    setActionDialog(null);
    setActionComment("");
  };

  const activeDialogQuestion = actionDialog
    ? post.questions.find((question) => question.questionId === actionDialog.questionId)
    : null;
  const actionDialogLabel = actionDialog
    ? actionDialog.action === "confirm"
      ? activeDialogQuestion?.buttonLabels.yes ?? "승인"
      : activeDialogQuestion?.buttonLabels.no ?? "반려"
    : "";

  const handleReply = () => {
    navigate(`/project/${id}/board/new`, {
      state: {
        parentPostId: post.id,
        parentTitle: post.title,
      },
    });
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="-ml-2 w-fit"
            onClick={() => navigate(`/project/${id}/board`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <Button className="gap-2" onClick={handleReply}>
            <MessageSquare className="h-4 w-4" />
            답글 작성
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-2 border-b">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", boardStatusStyles[postStatusVariant])}>
                {boardStatusLabels[postStatusVariant]}
              </Badge>
              <Badge variant="outline">{projectStatusLabelText}</Badge>
              <Badge variant="outline">{post.step.stepName}</Badge>
              <div
                className={cn(
                  "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                  boardStatusStyles[overallQuestionStatus]
                )}
              >
                {boardStatusLabels[overallQuestionStatus]}
              </div>
            </div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
              <span>
                {post.author.name} · {post.author.companyName} ({post.author.role})
              </span>
              <span>작성 {formatDateTime(post.createdAt)}</span>
              <span>최종 업데이트 {formatDateTime(post.updatedAt)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">단계</p>
                <p className="font-medium">{post.step.stepName}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">상태</p>
                <p className="font-medium">{projectStatusLabelText}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm text-muted-foreground">내용</Label>
              <div className="mt-2 whitespace-pre-line rounded-lg border bg-muted/30 p-4 text-sm">
                {post.content}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Paperclip className="h-4 w-4" />
                  첨부파일
                </Label>
                {post.files.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {post.files.map((file) => (
                      <div
                        key={file.fileId}
                        className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="icon">
                          <a
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${file.fileName} 다운로드`}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">다운로드</span>
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">첨부파일이 없습니다.</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Link2 className="h-4 w-4" />
                  링크
                </Label>
                {post.links.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {post.links.map((link) => (
                      <a
                        key={link.linkId}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <span className="truncate font-medium">{link.title}</span>
                        <span className="text-xs text-muted-foreground ml-3">{link.url}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">등록된 링크가 없습니다.</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  질문 및 답변
                </Label>
                {post.questions.length > 0 ? (
                  <div className="mt-2 space-y-4">
                    {post.questions.map((question) => {
                      const isAnswered = Boolean(question.answer);
                      const selectedAction = questionSelections[question.questionId];
                      const answeredResponse = question.answer?.response;
                      const questionStatus: BoardApprovalStatus = answeredResponse
                        ? answeredResponse === "NO"
                          ? "rejected"
                          : "approved"
                        : "request";
                      const confirmLabel = question.buttonLabels.yes;
                      const rejectLabel = question.buttonLabels.no;
                      return (
                        <div key={question.questionId} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-foreground">{question.content}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("border", boardStatusStyles[questionStatus])}
                            >
                              {boardStatusLabels[questionStatus]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant={selectedAction === "confirm" ? "default" : "outline"}
                              className={cn(
                                "flex-1 min-w-[120px] transition-colors",
                                selectedAction === "confirm"
                                  ? "ring-2 ring-primary hover:bg-primary/90"
                                  : "border-primary/40 text-primary hover:bg-primary/10"
                              )}
                              disabled={isAnswered}
                              aria-pressed={selectedAction === "confirm"}
                              onClick={() => openQuestionAction(question.questionId, "confirm")}
                            >
                              {confirmLabel}
                            </Button>
                            <Button
                              type="button"
                              variant={selectedAction === "reject" ? "destructive" : "outline"}
                              className={cn(
                                "flex-1 min-w-[120px] transition-colors",
                                selectedAction === "reject"
                                  ? "ring-2 ring-destructive hover:bg-destructive/90 text-white"
                                  : "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              )}
                              disabled={isAnswered}
                              aria-pressed={selectedAction === "reject"}
                              onClick={() => openQuestionAction(question.questionId, "reject")}
                            >
                              {rejectLabel}
                            </Button>
                          </div>
                          {question.answer ? (
                            <div className="rounded-md border bg-background p-3 space-y-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>응답 {question.answer.response}</span>
                                <span>by {question.answer.respondent.name}</span>
                                <span>{formatDateTime(question.answer.respondedAt)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">아직 답변이 등록되지 않았습니다.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">등록된 질문이 없습니다.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              댓글
              <Badge variant="secondary">{post.comments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              {post.comments.length > 0 ? (
                renderComments(post.comments)
              ) : (
                <p className="text-sm text-muted-foreground">등록된 댓글이 없습니다.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>댓글 남기기</Label>
              <Textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="댓글을 입력하세요"
                className="min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleAddComment} disabled={!newComment.trim()}>
                  댓글 작성
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(actionDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setActionComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {actionDialogLabel || "처리 의견 작성"}
            </DialogTitle>
          </DialogHeader>
          {activeDialogQuestion && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {activeDialogQuestion.content}
              </p>
              <div className="space-y-2">
                <Label htmlFor="action-comment">
                  의견 / 사유
                </Label>
                <Textarea
                  id="action-comment"
                  placeholder={`${actionDialog?.action === "confirm" ? "승인 의견" : "반려 사유"}를 입력하세요`}
                  value={actionComment}
                  onChange={(event) => setActionComment(event.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setActionComment("");
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmitQuestionAction}
              disabled={!actionDialog || !actionComment.trim()}
            >
              제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
