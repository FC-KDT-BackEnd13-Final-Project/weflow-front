import { apiRequest } from "./http";
import { StepApiResponse, StepListResponse, StepResponse } from "./stepTypes";

export async function getProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  return apiRequest<StepListResponse>(`/api/projects/${projectId}/steps${query}`);
}

export async function getAdminProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  return apiRequest<StepListResponse>(`/api/admin/projects/${projectId}/steps${query}`);
}

export async function getStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  return apiRequest<StepResponse>(`/api/steps/${stepId}`);
}

export async function getAdminStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  return apiRequest<StepResponse>(`/api/admin/steps/${stepId}`);
}

export async function createStep(projectId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  return apiRequest<StepResponse>(`/api/admin/projects/${projectId}/steps`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateStep(stepId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  return apiRequest<StepResponse>(`/api/admin/steps/${stepId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteStep(stepId: number): Promise<StepApiResponse<null>> {
  return apiRequest<null>(`/api/admin/steps/${stepId}`, {
    method: "DELETE",
  });
}

export async function reorderSteps(projectId: number, steps: { stepId: number; orderIndex: number }[]): Promise<StepApiResponse<StepListResponse>> {
  return apiRequest<StepListResponse>("/api/admin/steps/reorder", {
    method: "PATCH",
    body: JSON.stringify({ projectId, steps }),
  });
}
