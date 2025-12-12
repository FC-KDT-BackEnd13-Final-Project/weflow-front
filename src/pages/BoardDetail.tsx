import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Paperclip, Link2, MessageSquare, Clock3, Download, Pencil, Trash2 } from "lucide-react";
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
import { getPost, deletePost } from "@/apis/postApi";
import { getDownloadUrl } from "@/apis/attachmentApi";
import { getComments, createComment, createReply, deleteComment as deleteCommentApi, getReplies } from "@/apis/commentApi";
import { useUserStore } from "@/stores/user";
import type { CommentResponse, ReplyDto } from "@/types/comment";

type ApiPostApprovalStatus = "PENDING" | "CONFIRMED" | "REJECTED";
type ApiPostOpenStatus = "OPEN" | "CLOSED";
type ApiProjectPhase = "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE";

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

interface BoardPostDetail {
  id: number;
  title: string;
  content: string;
  status: ApiPostApprovalStatus;
  openStatus: ApiPostOpenStatus;
  author: AuthorInfo;
  projectPhase: ApiProjectPhase;
  step: StepInfo;
  files: Attachment[];
  links: LinkItem[];
  questions: PostQuestion[];
  parentPost: number | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  comments: CommentResponse[];
}

const apiApprovalStatusToBoardStatus: Record<ApiPostApprovalStatus, BoardApprovalStatus> = {
  PENDING: "request",
  CONFIRMED: "approved",
  REJECTED: "rejected",
};

const projectPhaseLabels: Record<ApiProjectPhase, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const postOpenStatusLabels: Record<ApiPostOpenStatus, string> = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
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
  const { user } = useUserStore();
  const [newComment, setNewComment] = useState("");
  const [questionSelections, setQuestionSelections] = useState<Record<number, "confirm" | "reject">>({});
  const [actionDialog, setActionDialog] = useState<{ questionId: number; action: "confirm" | "reject" } | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [visibleReplyForms, setVisibleReplyForms] = useState<Record<number, boolean>>({});
  const [post, setPost] = useState<BoardPostDetail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<number, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, ReplyDto[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<number, boolean>>({});
  const replyTextareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  // 백엔드에서 게시글 상세 조회 및 댓글 조회
  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!id || !postId) return;

      setIsLoading(true);
      try {
        // 게시글과 댓글을 병렬로 조회
        const [postResponse, commentsResponse] = await Promise.all([
          getPost(Number(id), Number(postId)),
          getComments(Number(postId)),
        ]);

        // 백엔드 데이터를 프론트 형식으로 변환
        const convertedPost: BoardPostDetail = {
          id: postResponse.postId,
          title: postResponse.title,
          content: postResponse.content,
          status: postResponse.status as ApiPostApprovalStatus,
          openStatus: postResponse.openStatus as ApiPostOpenStatus,
          author: {
            memberId: postResponse.author.memberId,
            name: postResponse.author.name,
            role: postResponse.author.role,
            companyName: postResponse.author.companyName,
          },
          projectPhase: postResponse.projectPhase as ApiProjectPhase,
          step: {
            stepId: postResponse.step.stepId,
            stepName: postResponse.step.stepName,
          },
          files: postResponse.files.map(file => ({
            fileId: file.fileId,
            fileName: file.fileName,
            fileSize: file.fileSize,
            downloadUrl: file.downloadUrl,
          })),
          links: postResponse.links.map(link => ({
            linkId: link.linkId,
            url: link.url,
            title: link.title,
          })),
          questions: postResponse.questions.map(q => ({
            questionId: q.questionId,
            content: q.content,
            buttonLabels: {
              yes: q.buttonLabels.yes,
              no: q.buttonLabels.no,
            },
            answer: q.answer ? {
              response: q.answer.response as "YES" | "NO" | "ETC",
              respondent: {
                memberId: q.answer.respondent.memberId,
                name: q.answer.respondent.name,
              },
              respondedAt: q.answer.respondedAt,
            } : null,
          })),
          parentPost: postResponse.parentPost?.postId || null,
          isEdited: postResponse.isEdited,
          createdAt: postResponse.createdAt,
          updatedAt: postResponse.updatedAt,
          comments: commentsResponse.comments, // 댓글 목록 설정
        };

        setPost(convertedPost);

        // 모든 레벨의 답장을 재귀적으로 로드하는 함수
        const loadAllRepliesRecursively = async (replies: ReplyDto[], expandedData: Record<number, ReplyDto[]>) => {
          for (const reply of replies) {
            try {
              const repliesResponse = await getReplies(reply.commentId, 0, 100);
              if (repliesResponse.replies.length > 0) {
                expandedData[reply.commentId] = repliesResponse.replies;
                // 재귀적으로 하위 답장도 로드
                await loadAllRepliesRecursively(repliesResponse.replies, expandedData);
              }
            } catch (error) {
              console.error(`댓글 ${reply.commentId}의 답장 로드 실패:`, error);
            }
          }
        };

        // 답장이 있는 모든 댓글의 전체 답장 목록 자동 로드 (재귀적)
        const commentsWithReplies = commentsResponse.comments.filter(c => c.replyCount > 0);
        if (commentsWithReplies.length > 0) {
          const expandedRepliesData: Record<number, ReplyDto[]> = {};

          for (const comment of commentsWithReplies) {
            try {
              const repliesResponse = await getReplies(comment.commentId, 0, 100);
              expandedRepliesData[comment.commentId] = repliesResponse.replies;

              // 재귀적으로 하위 답장들도 로드
              await loadAllRepliesRecursively(repliesResponse.replies, expandedRepliesData);
            } catch (error) {
              console.error(`댓글 ${comment.commentId}의 답장 로드 실패:`, error);
            }
          }

          setExpandedReplies(expandedRepliesData);
        }
      } catch (error) {
        console.error("게시글 또는 댓글 조회 실패:", error);
        toast({
          title: "게시글 조회 실패",
          description: "게시글을 불러올 수 없습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, postId]);

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

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <p className="text-lg font-medium text-foreground">게시글을 불러오는 중...</p>
        </div>
      </ProjectLayout>
    );
  }

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

  const approvalStatusVariant = apiApprovalStatusToBoardStatus[post.status] ?? "request";
  const projectPhaseLabelText = projectPhaseLabels[post.projectPhase];
  const postOpenStatusLabelText = postOpenStatusLabels[post.openStatus];
  const overallQuestionStatus: BoardApprovalStatus = post.questions.some((q) => q.answer?.response === "NO")
    ? "rejected"
    : post.questions.every((q) => q.answer)
      ? "approved"
      : "request";

  // 작성자의 role을 CLIENT/AGENCY/ADMIN으로 매핑
  const getAuthorUserRole = (authorRole: string): "CLIENT" | "AGENCY" | "ADMIN" => {
    if (authorRole === "CLIENT") return "CLIENT";
    if (authorRole === "ADMIN") return "ADMIN";
    return "AGENCY"; // DEVELOPER, PM 등은 모두 AGENCY로 간주
  };

  // 현재 사용자가 질문에 답변할 수 있는지 체크
  const canAnswerQuestion = () => {
    if (!user) return false;

    // 자문자답 방지: 작성자 본인이면 답변 불가
    if (user.id === post.author.memberId) return false;

    const authorUserRole = getAuthorUserRole(post.author.role);
    const currentUserRole = user.projectRole === "ADMIN" ? "ADMIN" : user.userRole;

    // 관리자는 모든 게시글에 답변 가능 (자신이 작성한 게시글 제외)
    if (currentUserRole === "ADMIN") return true;

    // 작성자가 관리자면 AGENCY, CLIENT 모두 답변 가능
    if (authorUserRole === "ADMIN") return true;

    // 작성자와 다른 역할인 경우에만 답변 가능
    return currentUserRole !== authorUserRole;
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await createComment(Number(postId), { content: newComment.trim() });

      // 댓글 목록 다시 조회
      const commentsResponse = await getComments(Number(postId));
      setPost(prev => prev ? { ...prev, comments: commentsResponse.comments } : prev);

      toast({
        title: "댓글이 작성되었습니다."
      });
      setNewComment("");
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      toast({
        title: "댓글 작성 실패",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleReplyForm = (commentId: number) => {
    const isOpening = !visibleReplyForms[commentId];

    setVisibleReplyForms(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: prev[commentId] ?? "",
    }));

    // 폼을 여는 경우 다음 렌더링 후 포커스
    if (isOpening) {
      setTimeout(() => {
        replyTextareaRefs.current[commentId]?.focus();
      }, 0);
    }
  };

  const handleReplyInputChange = (commentId: number, value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value,
    }));
  };

  const handleReplySubmit = async (commentId: number) => {
    const content = (replyInputs[commentId] ?? "").trim();
    if (!content || !postId || isSubmittingReply[commentId]) return;

    setIsSubmittingReply(prev => ({ ...prev, [commentId]: true }));
    try {
      await createReply(commentId, { content });

      // 댓글 목록 다시 조회
      const commentsResponse = await getComments(Number(postId));
      setPost(prev => prev ? { ...prev, comments: commentsResponse.comments } : prev);

      // 답글을 작성한 댓글의 전체 답글 목록을 로드하여 새로 작성한 답글 표시
      const response = await getReplies(commentId, 0, 100);
      setExpandedReplies(prev => ({ ...prev, [commentId]: response.replies }));

      toast({
        title: "답장이 작성되었습니다.",
      });
      setReplyInputs(prev => ({
        ...prev,
        [commentId]: "",
      }));
      setVisibleReplyForms(prev => ({
        ...prev,
        [commentId]: false,
      }));
    } catch (error) {
      console.error("답장 작성 실패:", error);
      toast({
        title: "답장 작성 실패",
        description: "답장 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleReplyCancel = (commentId: number) => {
    setVisibleReplyForms(prev => ({
      ...prev,
      [commentId]: false,
    }));
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: "",
    }));
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteCommentApi(commentId);

      // 댓글 목록 다시 조회
      const commentsResponse = await getComments(Number(postId!));
      setPost(prev => prev ? { ...prev, comments: commentsResponse.comments } : prev);

      // 확장된 답글들 다시 로드 (삭제 반영)
      const expandedCommentIds = Object.keys(expandedReplies).map(Number);
      for (const id of expandedCommentIds) {
        try {
          const response = await getReplies(id, 0, 100);
          setExpandedReplies(prev => ({ ...prev, [id]: response.replies }));
        } catch (error) {
          // 댓글이 삭제되었거나 접근 불가한 경우 제거
          setExpandedReplies(prev => {
            const newExpanded = { ...prev };
            delete newExpanded[id];
            return newExpanded;
          });
        }
      }

      toast({
        title: "댓글이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      toast({
        title: "댓글 삭제 실패",
        description: "댓글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLoadMoreReplies = async (commentId: number) => {
    if (loadingReplies[commentId]) return;

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await getReplies(commentId, 0, 100); // 페이지 0, 최대 100개
      setExpandedReplies(prev => ({ ...prev, [commentId]: response.replies }));
    } catch (error) {
      console.error("답장 조회 실패:", error);
      toast({
        title: "답장 조회 실패",
        description: "답장 조회 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // 대댓글 재귀 렌더링 (depth 추적)
  const renderReply = (reply: ReplyDto, depth: number): React.ReactNode => (
    <div key={reply.commentId} className="space-y-2">
      <div className="rounded-lg border p-3 bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">{reply.author.name}</span>
            <Badge variant="secondary" className="text-xs">
              {reply.author.role}
            </Badge>
            <span>{reply.author.companyName}</span>
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {formatDateTime(reply.createdAt)}
            </span>
          </div>
          <div className="flex gap-2">
            {user && user.id === reply.author.memberId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive h-6 px-2"
                onClick={() => handleDeleteComment(reply.commentId)}
              >
                삭제
              </Button>
            )}
            {depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => toggleReplyForm(reply.commentId)}
              >
                {visibleReplyForms[reply.commentId] ? "답장 닫기" : "답장"}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground whitespace-pre-line">{reply.content}</p>
      </div>

      {/* 답장 폼 (2단계 미만인 경우만) */}
      {depth < 2 && visibleReplyForms[reply.commentId] && (
        <div className="ml-6 space-y-2">
          <Textarea
            ref={(el) => {
              replyTextareaRefs.current[reply.commentId] = el;
            }}
            value={replyInputs[reply.commentId] ?? ""}
            onChange={(event) => handleReplyInputChange(reply.commentId, event.target.value)}
            placeholder="답장을 입력하세요"
            className="min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleReplyCancel(reply.commentId)}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleReplySubmit(reply.commentId)}
              disabled={!(replyInputs[reply.commentId] ?? "").trim() || isSubmittingReply[reply.commentId]}
            >
              {isSubmittingReply[reply.commentId] ? "등록 중..." : "답장 등록"}
            </Button>
          </div>
        </div>
      )}

      {/* 확장된 대댓글 표시 (재귀) */}
      {expandedReplies[reply.commentId] && expandedReplies[reply.commentId].length > 0 && (
        <div className="ml-6 space-y-2">
          {expandedReplies[reply.commentId].map((childReply) => renderReply(childReply, depth + 1))}
        </div>
      )}
    </div>
  );

  const renderComments = (comments: CommentResponse[]) =>
    comments.map((comment) => (
      <div
        key={comment.commentId}
        className="rounded-lg border p-4 space-y-2 bg-muted/30"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{comment.author.name}</span>
            <Badge variant="secondary" className="text-xs">
              {comment.author.role}
            </Badge>
            <span className="text-xs text-muted-foreground">{comment.author.companyName}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <div className="flex gap-2">
            {user && user.id === comment.author.memberId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => handleDeleteComment(comment.commentId)}
              >
                삭제
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => toggleReplyForm(comment.commentId)}
            >
              {visibleReplyForms[comment.commentId] ? "답장 닫기" : `답장${comment.replyCount > 0 ? ` (${comment.replyCount})` : ""}`}
            </Button>
          </div>
        </div>
        <p className="text-sm text-foreground whitespace-pre-line">{comment.content}</p>

        {/* 대댓글 표시 */}
        {comment.replyCount > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {/* 확장된 대댓글이 있으면 전체 표시, 없으면 미리보기 3개 */}
            {expandedReplies[comment.commentId] ? (
              expandedReplies[comment.commentId].map((reply) => renderReply(reply, 1))
            ) : (
              <>
                {comment.replies.map((reply) => renderReply(reply, 1))}
                {comment.replyCount > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadMoreReplies(comment.commentId)}
                    disabled={loadingReplies[comment.commentId]}
                  >
                    {loadingReplies[comment.commentId]
                      ? "로딩 중..."
                      : `+${comment.replyCount - 3}개의 답장 더보기`}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {visibleReplyForms[comment.commentId] && (
          <div className="space-y-2">
            <Textarea
              ref={(el) => {
                replyTextareaRefs.current[comment.commentId] = el;
              }}
              value={replyInputs[comment.commentId] ?? ""}
              onChange={(event) => handleReplyInputChange(comment.commentId, event.target.value)}
              placeholder="답장을 입력하세요"
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReplyCancel(comment.commentId)}
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleReplySubmit(comment.commentId)}
                disabled={!(replyInputs[comment.commentId] ?? "").trim() || isSubmittingReply[comment.commentId]}
              >
                {isSubmittingReply[comment.commentId] ? "등록 중..." : "답장 등록"}
              </Button>
            </div>
          </div>
        )}
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

  const handleEdit = () => {
    navigate(`/project/${id}/board/${postId}/edit`);
  };

  // 작성자 본인 여부
  const isAuthor = user?.id === post.author.memberId;

  // 수정 가능 여부: 작성자 본인이고, 댓글이 없고, 질문에 답변이 없을 때만 가능
  const canEdit = isAuthor && post.comments.length === 0 && !post.questions.some(q => q.answer !== null);

  // 삭제 가능 여부: 작성자 본인만 가능
  const canDelete = isAuthor;

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deletePost(Number(id), Number(postId));
      toast({
        title: "게시글 삭제 완료",
        description: "게시글이 성공적으로 삭제되었습니다.",
      });
      navigate(`/project/${id}/board`);
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      toast({
        title: "게시글 삭제 실패",
        description: "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (fileId: number) => {
    try {
      const downloadUrl = await getDownloadUrl(fileId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      toast({
        title: "파일 다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="-ml-2 w-fit"
            onClick={() => navigate(`/project/${id}/board`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <div className="flex gap-2">
            {isAuthor && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleEdit}
                  disabled={!canEdit}
                >
                  <Pencil className="h-4 w-4" />
                  수정
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleDelete}
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </Button>
              </>
            )}
            <Button className="gap-2" onClick={handleReply}>
              <MessageSquare className="h-4 w-4" />
              답글 작성
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {projectPhaseLabelText}
                </Badge>
                <Badge variant="outline" className="bg-purple-50">
                  {post.step.stepName}
                </Badge>
                <Badge className={cn("border", boardStatusStyles[overallQuestionStatus])}>
                  {boardStatusLabels[overallQuestionStatus]}
                </Badge>
              </div>
              <Badge variant="outline" className="bg-slate-50">
                {postOpenStatusLabelText}
              </Badge>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">프로젝트 단계 (Phase)</p>
                <p className="font-medium">{projectPhaseLabelText}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">세부 단계 (Step)</p>
                <p className="font-medium">{post.step.stepName}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">게시글 상태</p>
                <p className="font-medium">{postOpenStatusLabelText}</p>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file.fileId)}
                          aria-label={`${file.fileName} 다운로드`}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">다운로드</span>
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
                        className="block rounded-lg border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <div className="font-medium break-all line-clamp-2">{link.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 break-all line-clamp-1">{link.url}</div>
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
                              disabled={isAnswered || !canAnswerQuestion()}
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
                              disabled={isAnswered || !canAnswerQuestion()}
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
                <Button type="button" onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingComment}>
                  {isSubmittingComment ? "작성 중..." : "댓글 작성"}
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
