import { apiRequest } from "./http";
import {
  StepApiResponse,
  StepRequestListResponse,
  StepRequestResponse,
  StepRequestSummaryResponse,
} from "./stepTypes";

export async function createStepRequest(
  stepId: number,
  body: Partial<StepRequestResponse> & { attachmentIds?: number[]; links?: string[] }
): Promise<StepApiResponse<StepRequestResponse>> {
  return apiRequest<StepRequestResponse>(`/api/steps/${stepId}/requests`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getStepRequests(stepId: number, page = 0, size = 20): Promise<StepApiResponse<StepRequestListResponse>> {
  return apiRequest<StepRequestListResponse>(`/api/steps/${stepId}/requests?page=${page}&size=${size}`);
}

export async function getProjectStepRequests(
  projectId: number,
  page = 0,
  size = 20
): Promise<StepApiResponse<StepRequestListResponse>> {
  return apiRequest<StepRequestListResponse>(`/api/projects/${projectId}/requests?page=${page}&size=${size}`);
}

export async function getStepRequest(id: number): Promise<StepApiResponse<StepRequestResponse>> {
  return apiRequest<StepRequestResponse>(`/api/requests/${id}`);
}

export async function updateStepRequest(
  id: number,
  body: Partial<StepRequestResponse> & { attachmentIds?: number[] | null; links?: string[] }
): Promise<StepApiResponse<StepRequestResponse>> {
  return apiRequest<StepRequestResponse>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function cancelStepRequest(id: number): Promise<StepApiResponse<StepRequestResponse>> {
  return apiRequest<StepRequestResponse>(`/api/requests/${id}`, { method: "DELETE" });
}
