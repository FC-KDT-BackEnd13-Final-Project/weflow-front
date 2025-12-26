import api from "./api";

export type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface StepResponse {
  id: number;
  phase?: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: StepStatus;
  projectId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/* ======================================================
   GET: 프로젝트 단계 조회
====================================================== */
export const fetchProjectSteps = async (projectId: number) => {
  const response = await api.get(`/api/projects/${projectId}/steps`);
  return response.data.data.steps as StepResponse[];
};

/* ======================================================
   GET: 프로젝트 단계 조회 (관리자)
   - 관리자가 프로젝트 멤버가 아니어도 단계 조회 가능
   - 백엔드 응답 형태가 data.steps 또는 data로 올 수 있어 모두 커버
====================================================== */
export const fetchAdminProjectSteps = async (projectId: number) => {
  const response = await api.get(`/api/admin/projects/${projectId}/steps`);
  const data = response.data?.data;
  const steps = data?.steps ?? data ?? [];
  return steps as StepResponse[];
};

/* ======================================================
   POST: 단계 생성 (관리자)
====================================================== */
export const createStep = async (
  projectId: number,
  payload: { title: string; phase?: string; orderIndex?: number }
) => {
  const response = await api.post(`/api/admin/projects/${projectId}/steps`, payload);
  return response.data.data; // 여기 안에 {id: number, ...}
};

/* ======================================================
   PATCH: 단계 수정 (관리자)
====================================================== */
export const updateStep = async (
  projectId: number,
  stepId: number,
  payload: { title?: string; orderIndex?: number; phase?: string }
) => {
  const response = await api.patch(`/api/admin/steps/${stepId}`, payload);
  return response.data.data;
};

/* ======================================================
   DELETE: 단계 삭제 (관리자)
====================================================== */
export const deleteStep = async (projectId: number, stepId: number) => {
  const response = await api.delete(`/api/admin/steps/${stepId}`);
  return response.data.data;
};

/* ======================================================
   PATCH: 단계 reorder (관리자)
====================================================== */
export const reorderSteps = async (
  projectId: number,
  payload: { steps: { stepId: number; orderIndex: number }[] }
) => {
  const response = await api.patch(`/api/admin/steps/reorder`, {
    projectId,
    ...payload
  });

  return response.data.data;
};
