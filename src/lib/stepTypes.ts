import { ApiResponse } from "@/types/api";

export type StepPhase = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | string;
export type StepStatus = "PENDING" | "IN_PROGRESS" | "APPROVED" | "CANCELED" | string;

export interface StepResponse {
  id: number;
  phase: StepPhase;
  title: string;
  description?: string;
  orderIndex: number;
  status: StepStatus;
  projectId: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepListResponse {
  totalCount: number;
  page: number;
  size: number;
  steps: StepResponse[];
  isPhaseCompleted?: Record<string, boolean>;
}

export type StepRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELED" | "DRAFT" | "CHANGE_REQUESTED" | string;

export interface AttachmentResponse {
  id: number;
  name?: string;
  url?: string;
  isLink?: boolean;
  fileName?: string;
  originalName?: string;
  path?: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
}

export interface StepAttachmentFileInput {
  fileName: string;
  fileSize: number;
  filePath: string;
  contentType?: string;
}

export interface StepAttachmentLinkInput {
  url: string;
}

export interface StepRequestResponse {
  id: number;
  title: string;
  description?: string;
  status: StepRequestStatus;
  decidedAt?: string;
  stepId: number;
  projectId: number;
  requestedBy?: number;
  requestedByName?: string;
  decidedBy?: number;
  decidedByName?: string;
  decisionReason?: string;
  files?: AttachmentResponse[];
  attachments?: AttachmentResponse[]; // 백엔드 응답이 attachments로 내려오는 경우 대비
  links?: (AttachmentResponse | string)[];
  createdAt: string;
  updatedAt?: string;
}

export interface StepRequestSummaryResponse {
  id: number;
  title: string;
  status: StepRequestStatus;
  createdAt: string;
  decidedAt?: string;
  updatedAt?: string;
  stepId: number;
  stepTitle?: string;
  projectId?: number;
  projectName?: string;
  requestedBy?: number;
  requestedByName?: string;
  hasAttachment?: boolean;
  phase?: string;
}

export interface StepRequestListResponse {
  totalCount: number;
  page: number;
  size: number;
  stepRequestSummaryResponses: StepRequestSummaryResponse[];
}

export type FeedbackResponseType = "APPROVE" | "REJECT" | "CHANGE_REQUEST";

export interface StepRequestAnswerResponse {
  id: number;
  response: FeedbackResponseType;
  requestId: number;
  respondedBy?: number;
  respondedByName?: string;
  reasonText?: string;
  attachments?: AttachmentResponse[];
  decidedAt?: string;
  createdAt: string;
}

export type StepApiResponse<T> = ApiResponse<T>;
