// ===== Enums =====
export enum TargetType {
  POST = "POST",
  POST_COMMENT = "POST_COMMENT",
  STEP_REQUEST = "STEP_REQUEST",
  SUPPORT = "SUPPORT",
  SUPPORT_COMMENT = "SUPPORT_COMMENT",
}

export enum AttachmentType {
  FILE = "FILE",
  LINK = "LINK",
}

// ===== Request Types =====
export interface PresignedUrlRequest {
  key: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

export interface AttachmentFileRequest {
  targetType: TargetType;
  targetId: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface AttachmentLinkRequest {
  targetType: TargetType;
  targetId: number;
  url: string;
}

// ===== Response Types =====
export interface AttachmentResponse {
  id: number;
  targetType: TargetType;
  targetId: number;
  attachmentType: AttachmentType;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  url?: string;
  createdAt: string;
}

// ===== API Response Wrapper =====
export interface ApiResponse<T> {
  message: string;
  data: T;
}
