// Comment API 관련 타입 정의 (백엔드 DTO와 동일한 구조)

// ===== Response Types =====

// 작성자 정보
export interface CommentAuthorDto {
  memberId: number;
  name: string;
  role: string;
  companyName: string;
}

// 대댓글 DTO
export interface ReplyDto {
  commentId: number;
  content: string;
  author: CommentAuthorDto;
  createdAt: string;
}

// 댓글 상세 정보
export interface CommentResponse {
  commentId: number;
  content: string;
  author: CommentAuthorDto;
  createdAt: string;
  replyCount: number; // 대댓글 개수
  replies: ReplyDto[]; // 대댓글 미리보기 (최대 3개)
}

// 댓글 목록 조회 응답
export interface CommentListResponse {
  comments: CommentResponse[];
  totalCount: number;
}

// 댓글 작성 응답
export interface CommentCreateResponse {
  commentId: number;
}

// 대댓글 목록 조회 응답 (페이징)
export interface ReplyListResponse {
  replies: ReplyDto[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

// ===== Request Types =====

// 댓글/대댓글 작성 요청
export interface CommentCreateRequest {
  content: string;
}

// ===== API Response Wrapper =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
