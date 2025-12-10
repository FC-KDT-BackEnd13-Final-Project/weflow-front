import api from "./api";
import type {
  ApiResponse,
  CommentListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  ReplyListResponse,
} from "@/types/comment";

// ===== Comment API Functions =====

/**
 * 댓글 목록 조회
 * GET /api/posts/{postId}/comments
 */
export const getComments = async (postId: number): Promise<CommentListResponse> => {
  const response = await api.get<ApiResponse<CommentListResponse>>(
    `/api/posts/${postId}/comments`
  );
  return response.data.data;
};

/**
 * 댓글 작성
 * POST /api/posts/{postId}/comments
 */
export const createComment = async (
  postId: number,
  request: CommentCreateRequest
): Promise<CommentCreateResponse> => {
  const response = await api.post<ApiResponse<CommentCreateResponse>>(
    `/api/posts/${postId}/comments`,
    request
  );
  return response.data.data;
};

/**
 * 대댓글 목록 조회 (페이징)
 * GET /api/comments/{commentId}/replies
 */
export const getReplies = async (
  commentId: number,
  page: number = 0,
  size: number = 10
): Promise<ReplyListResponse> => {
  const response = await api.get<ApiResponse<ReplyListResponse>>(
    `/api/comments/${commentId}/replies`,
    {
      params: { page, size },
    }
  );
  return response.data.data;
};

/**
 * 대댓글 작성
 * POST /api/comments/{commentId}/replies
 */
export const createReply = async (
  commentId: number,
  request: CommentCreateRequest
): Promise<CommentCreateResponse> => {
  const response = await api.post<ApiResponse<CommentCreateResponse>>(
    `/api/comments/${commentId}/replies`,
    request
  );
  return response.data.data;
};

/**
 * 댓글 삭제
 * DELETE /api/comments/{commentId}
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/api/comments/${commentId}`);
};
