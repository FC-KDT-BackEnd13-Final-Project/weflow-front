import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage } from "@/lib/apiUtils";
import { AttachmentResponse, StepApiResponse } from "@/lib/stepTypes";

export type TargetType = "STEP_REQUEST" | "STEP_REQUEST_ANSWER" | string;

export async function uploadAttachmentFile(file: File, targetType: TargetType): Promise<StepApiResponse<AttachmentResponse>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<StepApiResponse<AttachmentResponse>>(`/api/attachments/files?targetType=${targetType}`, formData);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function createAttachmentLink(payload: { url: string; name?: string; targetType: TargetType }): Promise<StepApiResponse<AttachmentResponse>> {
  try {
    const { targetType, ...rest } = payload;
    const body = { ...rest, name: rest.name || rest.url };
    const response = await api.post<StepApiResponse<AttachmentResponse>>(`/api/attachments/links?targetType=${targetType}`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function deleteAttachment(attachmentId: number): Promise<StepApiResponse<null>> {
  try {
    const response = await api.delete<StepApiResponse<null>>(`/api/attachments/${attachmentId}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}
