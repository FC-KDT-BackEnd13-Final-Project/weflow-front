import api from "./api";
import type {
  ApiResponse,
  PostDetailResponse,
  PostListResponse,
  PostCreateRequest,
  PostCreateResponse,
  PostUpdateRequest,
  PostStatusUpdateRequest,
  PostAnswerRequest,
  PostAnswerResponse,
  ProjectPhase,
} from "@/types/post";

// ===== Query Parameters Interface =====
export interface GetPostsParams {
  projectPhase?: ProjectPhase;
  stepId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "ASC" | "DESC";
}

// ===== Post API Functions =====

/**
 * 게시글 상세 조회
 * GET /api/projects/{projectId}/posts/{postId}
 */
export const getPost = async (
  projectId: number,
  postId: number
): Promise<PostDetailResponse> => {
  const response = await api.get<ApiResponse<PostDetailResponse>>(
    `/api/projects/${projectId}/posts/${postId}`
  );
  return response.data.data;
};

/**
 * 게시글 목록 조회
 * GET /api/projects/{projectId}/posts
 */
export const getPosts = async (
  projectId: number,
  params?: GetPostsParams
): Promise<PostListResponse> => {
  const response = await api.get<ApiResponse<PostListResponse>>(
    `/api/projects/${projectId}/posts`,
    { params }
  );
  return response.data.data;
};

/**
 * 게시글 작성
 * POST /api/projects/{projectId}/posts
 */
export const createPost = async (
  projectId: number,
  request: PostCreateRequest
): Promise<PostCreateResponse> => {
  const response = await api.post<ApiResponse<PostCreateResponse>>(
    `/api/projects/${projectId}/posts`,
    request
  );
  return response.data.data;
};

/**
 * 게시글 수정
 * PATCH /api/projects/{projectId}/posts/{postId}
 */
export const updatePost = async (
  projectId: number,
  postId: number,
  request: PostUpdateRequest
): Promise<PostDetailResponse> => {
  const response = await api.patch<ApiResponse<PostDetailResponse>>(
    `/api/projects/${projectId}/posts/${postId}`,
    request
  );
  return response.data.data;
};

/**
 * 게시글 삭제 (Soft Delete)
 * DELETE /api/projects/{projectId}/posts/{postId}
 */
export const deletePost = async (
  projectId: number,
  postId: number
): Promise<void> => {
  await api.delete(`/api/projects/${projectId}/posts/${postId}`);
};

/**
 * 질문에 대한 답변 등록
 * POST /api/projects/{projectId}/posts/{postId}/questions/{questionId}/answer
 */
export const answerQuestion = async (
  projectId: number,
  postId: number,
  questionId: number,
  request: PostAnswerRequest
): Promise<PostAnswerResponse> => {
  const response = await api.post<ApiResponse<PostAnswerResponse>>(
    `/api/projects/${projectId}/posts/${postId}/questions/${questionId}/answer`,
    request
  );
  return response.data.data;
};

/**
 * 게시글 승인 상태 변경 (CONFIRMED/REJECTED)
 * PATCH /api/projects/{projectId}/posts/{postId}/status
 */
export const updatePostStatus = async (
  projectId: number,
  postId: number,
  request: PostStatusUpdateRequest
): Promise<void> => {
  await api.patch(
    `/api/projects/${projectId}/posts/${postId}/status`,
    request
  );
};

/**
 * 게시글 완료 (OPEN -> CLOSED)
 * PATCH /api/projects/{projectId}/posts/{postId}/close
 */
export const closePost = async (
  projectId: number,
  postId: number
): Promise<void> => {
  await api.patch(`/api/projects/${projectId}/posts/${postId}/close`);
};
