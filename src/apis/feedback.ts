import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage } from "@/lib/apiUtils";
import { FeedbackResponseType, StepApiResponse, StepRequestAnswerResponse, StepAttachmentFileInput, StepAttachmentLinkInput } from "@/lib/stepTypes";

export async function sendFeedback(
  requestId: number,
  body: { response: FeedbackResponseType; reasonText?: string; files?: StepAttachmentFileInput[]; links?: StepAttachmentLinkInput[] }
): Promise<StepApiResponse<StepRequestAnswerResponse>> {
  try {
    const response = await api.post<StepApiResponse<StepRequestAnswerResponse>>(`/api/requests/${requestId}/feedback`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getFeedback(
  requestId: number
): Promise<StepApiResponse<StepRequestAnswerResponse | StepRequestAnswerResponse[]>> {
  try {
    const response = await api.get<StepApiResponse<StepRequestAnswerResponse | StepRequestAnswerResponse[]>>(
      `/api/requests/${requestId}/feedback`
    );
    return unwrapApiResponse(response.data);
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return { success: true, message: "답변 없음", data: null } as StepApiResponse<null>;
    }
    throw new Error(buildApiErrorMessage(error));
  }
}
