import api from "./api";
import axios from "axios";
import type {
  ApiResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  AttachmentFileRequest,
  AttachmentLinkRequest,
  AttachmentResponse,
  TargetType,
} from "@/types/attachment";

// ===== File Upload API Functions =====

/**
 * S3 Presigned URL 요청
 * GET /api/files/presigned-url?key={key}&contentType={contentType}
 */
export const getPresignedUrl = async (
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  const response = await api.get<ApiResponse<PresignedUrlResponse>>(
    "/api/files/presigned-url",
    {
      params: request,
    }
  );
  return response.data.data;
};

/**
 * S3에 파일 직접 업로드
 * PUT (presigned URL)
 */
export const uploadFileToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
};

/**
 * 파일 업로드 완료 후 메타데이터 저장
 * POST /api/attachments/files
 */
export const saveFileMetadata = async (
  request: AttachmentFileRequest
): Promise<AttachmentResponse> => {
  const response = await api.post<ApiResponse<AttachmentResponse>>(
    "/api/attachments/files",
    request
  );
  return response.data.data;
};

/**
 * 파일 업로드 전체 플로우 (Presigned URL → S3 업로드 → 메타데이터 저장)
 */
export const uploadFile = async (
  file: File,
  targetType: TargetType,
  targetId: number
): Promise<AttachmentResponse> => {
  // 1. Presigned URL 요청
  const key = `${targetType.toLowerCase()}/${targetId}/${Date.now()}_${file.name}`;
  const presignedUrlResponse = await getPresignedUrl({
    key,
    contentType: file.type,
  });

  // 2. S3에 파일 업로드
  await uploadFileToS3(presignedUrlResponse.url, file);

  // 3. 메타데이터 저장
  const metadata = await saveFileMetadata({
    targetType,
    targetId,
    filePath: presignedUrlResponse.key,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
  });

  return metadata;
};

// ===== Link API Functions =====

/**
 * 링크 추가
 * POST /api/attachments/links
 */
export const addLink = async (
  request: AttachmentLinkRequest
): Promise<AttachmentResponse> => {
  const response = await api.post<ApiResponse<AttachmentResponse>>(
    "/api/attachments/links",
    request
  );
  return response.data.data;
};

// ===== Attachment API Functions =====

/**
 * 첨부파일 목록 조회
 * GET /api/attachments?targetType={targetType}&targetId={targetId}
 */
export const getAttachments = async (
  targetType: TargetType,
  targetId: number
): Promise<AttachmentResponse[]> => {
  const response = await api.get<ApiResponse<AttachmentResponse[]>>(
    "/api/attachments",
    {
      params: { targetType, targetId },
    }
  );
  return response.data.data;
};

/**
 * 첨부파일 상세 조회
 * GET /api/attachments/{attachmentId}
 */
export const getAttachment = async (
  attachmentId: number
): Promise<AttachmentResponse> => {
  const response = await api.get<ApiResponse<AttachmentResponse>>(
    `/api/attachments/${attachmentId}`
  );
  return response.data.data;
};

/**
 * 첨부파일 다운로드 URL 조회
 * GET /api/attachments/{attachmentId}/download-url
 */
export const getDownloadUrl = async (
  attachmentId: number
): Promise<string> => {
  const response = await api.get<ApiResponse<string>>(
    `/api/attachments/${attachmentId}/download-url`
  );
  return response.data.data;
};

/**
 * 첨부파일 삭제
 * DELETE /api/attachments/{attachmentId}
 */
export const deleteAttachment = async (
  attachmentId: number
): Promise<void> => {
  await api.delete(`/api/attachments/${attachmentId}`);
};
