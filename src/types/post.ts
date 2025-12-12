// Post API 관련 타입 정의 (백엔드 DTO와 동일한 구조)

// ===== Enums =====
export enum PostApprovalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
}

export enum PostOpenStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum ProjectPhase {
  CONTRACT = "CONTRACT",
  IN_PROGRESS = "IN_PROGRESS",
  DELIVERY = "DELIVERY",
  MAINTENANCE = "MAINTENANCE",
}

// ===== Response Types =====

// 게시글 상세 조회 응답
export interface PostDetailResponse {
  postId: number;
  title: string;
  content: string;
  status: PostApprovalStatus;
  openStatus: PostOpenStatus;
  author: AuthorDto;
  projectPhase: ProjectPhase;
  step: StepDto;
  files: FileDto[];
  links: LinkDto[];
  questions: QuestionDto[];
  parentPost: ParentPostDto | null;
  isEdited: boolean;
  createdAt: string; // LocalDateTime -> ISO 8601 string
  updatedAt: string;
}

export interface AuthorDto {
  memberId: number;
  name: string;
  role: string;
  companyName: string;
}

export interface StepDto {
  stepId: number;
  stepName: string;
}

export interface FileDto {
  fileId: number;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

export interface LinkDto {
  linkId: number;
  url: string;
  title: string;
}

export interface QuestionDto {
  questionId: number;
  content: string;
  buttonLabels: ButtonLabelsDto;
  answer: AnswerDto | null;
}

export interface ButtonLabelsDto {
  yes: string;
  no: string;
}

export interface AnswerDto {
  response: string;
  respondent: RespondentDto;
  respondedAt: string;
}

export interface RespondentDto {
  memberId: number;
  name: string;
}

export interface ParentPostDto {
  postId: number;
  title: string;
  author: AuthorDto;
}

// 게시글 목록 조회 응답
export interface PostListResponse {
  posts: PostItem[];
  pageInfo: PageInfo;
}

export interface PostItem {
  postId: number;
  title: string;
  status: PostApprovalStatus;
  projectPhase: ProjectPhase;
  stepId: number;
  author: AuthorDto;
  hasFiles: boolean;
  hasLinks: boolean;
  hasQuestions: boolean;
  commentCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageInfo {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 게시글 작성 응답
export interface PostCreateResponse {
  postId: number;
  title: string;
  createdAt: string;
}

// 답변 등록 응답
export interface PostAnswerResponse {
  answerId: number;
  questionId: number;
  response: string;
  respondedAt: string;
}

// ===== Request Types =====

// 게시글 작성 요청
export interface PostCreateRequest {
  title: string;
  content: string;
  stepId: number;
  parentPostId?: number; // 답글인 경우 (optional)
  projectPhase: ProjectPhase;
  files?: FileRequest[];
  links?: LinkRequest[];
  questions?: QuestionRequest[];
}

export interface FileRequest {
  fileName: string;
  fileSize: number;
  filePath: string;
  contentType: string;
}

export interface LinkRequest {
  url: string;
}

export interface QuestionRequest {
  questionText: string;
  confirmLabel: string;
  rejectLabel: string;
}

// 게시글 수정 요청
export interface PostUpdateRequest {
  title?: string;
  content?: string;
  stepId?: number;
  projectPhase?: ProjectPhase;
  files?: FileRequest[];
  links?: LinkRequest[];
  questions?: QuestionRequest[];
}

// 게시글 상태 변경 요청
export interface PostStatusUpdateRequest {
  status: PostApprovalStatus;
}

// 답변 등록 요청
export interface PostAnswerRequest {
  response: string; // "CONFIRM" 또는 "REJECT"
}

// ===== API Response Wrapper =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
