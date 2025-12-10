import api from "./api";
import type { ApiResponse, StepListResponse, StepResponse } from "@/types/step";

/**
 * 프로젝트 단계 목록 조회
 * GET /api/projects/{projectId}/steps
 */
export const getStepsByProject = async (
  projectId: number,
  phase?: string
): Promise<StepListResponse> => {
  const params = phase ? { phase } : undefined;
  const response = await api.get<ApiResponse<StepListResponse>>(
    `/api/projects/${projectId}/steps`,
    { params }
  );
  return response.data.data;
};

/**
 * 단일 단계 조회
 * GET /api/steps/{stepId}
 */
export const getStep = async (stepId: number): Promise<StepResponse> => {
  const response = await api.get<ApiResponse<StepResponse>>(
    `/api/steps/${stepId}`
  );
  return response.data.data;
};
