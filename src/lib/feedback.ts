import { apiRequest } from "./http";
import { FeedbackResponseType, StepApiResponse, StepRequestAnswerResponse } from "./stepTypes";

export async function sendFeedback(
  requestId: number,
  body: { response: FeedbackResponseType; reasonText?: string }
): Promise<StepApiResponse<StepRequestAnswerResponse>> {
  return apiRequest<StepRequestAnswerResponse>(`/api/requests/${requestId}/feedback`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getFeedback(requestId: number): Promise<StepApiResponse<StepRequestAnswerResponse | StepRequestAnswerResponse[]>> {
  return apiRequest<StepRequestAnswerResponse | StepRequestAnswerResponse[]>(`/api/requests/${requestId}/feedback`);
}
