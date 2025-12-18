import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage, unwrapData } from "@/lib/apiUtils";
import { StepApiResponse, StepListResponse, StepResponse } from "@/lib/stepTypes";

export async function getProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  try {
    const response = await api.get<StepApiResponse<StepListResponse>>(`/api/projects/${projectId}/steps${query}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getAdminProjectSteps(projectId: number, phase?: string): Promise<StepApiResponse<StepListResponse>> {
  const query = phase ? `?phase=${phase}` : "";
  try {
    const response = await api.get<StepApiResponse<StepListResponse>>(`/api/admin/projects/${projectId}/steps${query}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  try {
    const response = await api.get<StepApiResponse<StepResponse>>(`/api/steps/${stepId}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getAdminStep(stepId: number): Promise<StepApiResponse<StepResponse>> {
  try {
    const response = await api.get<StepApiResponse<StepResponse>>(`/api/admin/steps/${stepId}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function createStep(projectId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  try {
    const response = await api.post<StepApiResponse<StepResponse>>(`/api/admin/projects/${projectId}/steps`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function updateStep(stepId: number, body: Partial<StepResponse>): Promise<StepApiResponse<StepResponse>> {
  try {
    const response = await api.patch<StepApiResponse<StepResponse>>(`/api/admin/steps/${stepId}`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function deleteStep(stepId: number): Promise<StepApiResponse<null>> {
  try {
    const response = await api.delete<StepApiResponse<null>>(`/api/admin/steps/${stepId}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function reorderSteps(
  projectId: number,
  steps: { stepId: number; orderIndex: number }[]
): Promise<StepApiResponse<StepListResponse>> {
  try {
    const response = await api.patch<StepApiResponse<StepListResponse>>("/api/admin/steps/reorder", { projectId, steps });
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function reorderStepsByPhase(
  projectId: number,
  payload: { phase: string; orderedStepIds: number[] }
): Promise<StepListResponse> {
  try {
    const response = await api.patch<StepApiResponse<StepListResponse>>(
      `/api/admin/projects/${projectId}/steps/reorder`,
      payload
    );
    return unwrapData(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}
