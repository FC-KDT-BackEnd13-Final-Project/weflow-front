import api from "@/apis/api";
import { unwrapApiResponse, unwrapData } from "@/lib/apiUtils";
import { StepApiResponse, StepListResponse, StepResponse } from "@/lib/stepTypes";

export async function getProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  const response = await api.get<StepApiResponse<StepListResponse>>(`/api/projects/${projectId}/steps${query}`);
  return unwrapApiResponse(response.data);
}

export async function getAdminProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  const response = await api.get<StepApiResponse<StepListResponse>>(`/api/projects/${projectId}/steps${query}`);
  return unwrapApiResponse(response.data);
}

export async function getStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  const response = await api.get<StepApiResponse<StepResponse>>(`/api/steps/${stepId}`);
  return unwrapApiResponse(response.data);
}

export async function getAdminStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  const response = await api.get<StepApiResponse<StepResponse>>(`/api/steps/${stepId}`);
  return unwrapApiResponse(response.data);
}

export async function createStep(projectId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  const response = await api.post<StepApiResponse<StepResponse>>(`/api/projects/${projectId}/steps`, body);
  return unwrapApiResponse(response.data);
}

export async function updateStep(stepId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  const response = await api.patch<StepApiResponse<StepResponse>>(`/api/projects/steps/${stepId}`, body);
  return unwrapApiResponse(response.data);
}

export async function deleteStep(stepId: number): Promise<StepApiResponse<null>> {
  const response = await api.delete<StepApiResponse<null>>(`/api/projects/steps/${stepId}`);
  return unwrapApiResponse(response.data);
}

export async function reorderSteps(
  projectId: number,
  steps: { stepId: number; orderIndex: number }[]
): Promise<StepApiResponse<StepListResponse>> {
  const response = await api.patch<StepApiResponse<StepListResponse>>(
    `/api/projects/${projectId}/steps/reorder`,
    { steps }
  );
  return unwrapApiResponse(response.data);
}

export async function reorderStepsByPhase(
  projectId: number,
  payload: { phase: string; orderedStepIds: number[] }
): Promise<StepListResponse> {
  const response = await api.patch<StepApiResponse<StepListResponse>>(
    `/api/projects/${projectId}/steps/reorder`,
    payload
  );
  return unwrapData(response.data);
}
