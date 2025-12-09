import api from "./api";

export type ProjectStatus =
  | "CONTRACT"
  | "IN_PROGRESS"
  | "DELIVERY"
  | "MAINTENANCE"
  | "CLOSED";

export type ProjectRole = "ADMIN" | "MEMBER";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* ===========================
      Project Responses
=========================== */

export interface ProjectSummaryResponse {
  projectId: number;
  name: string;
  status: ProjectStatus;
  projectRole?: ProjectRole | null;
}

export interface ProjectDetailResponse {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDateExpected: string | null;
  contractAmount: number | null;
}

/* ===========================
      API CALL HELPERS
=========================== */

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};

export const fetchMyProjects = () =>
  unwrap<ProjectSummaryResponse[]>(api.get("/api/projects/my"));

export const fetchProjectDetail = (projectId: number) =>
  unwrap<ProjectDetailResponse>(api.get(`/api/projects/${projectId}`));
