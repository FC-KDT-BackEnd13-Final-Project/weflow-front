import api from "./api";

export type ProjectStatus = "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE" | "CLOSED";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminProjectSummary {
  id: number;
  name: string;
  status: ProjectStatus;
  customerCompanyId: number | null;
  createdBy: number | null;
  deleted: boolean;
  deletedAt: string | null;
}

export interface AdminProjectListResponse {
  totalCount: number;
  page: number;
  size: number;
  projects: AdminProjectSummary[];
}

export interface AdminProjectMember {
  userId: number;
  role: string;
}

export interface AdminProjectDetailResponse {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus | string;
  startDate: string | null;
  endDateExpected: string | null;
  endDate: string | null;
  contractAmount: number | null;
  contractFileUrl: string | null;
  customerCompanyId: number | null;
  createdBy: number | null;
  deleted: boolean;
  deletedAt: string | null;
  members: AdminProjectMember[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminProjectMemberListItem {
  projectMemberId: number;
  userId: number;
  username: string;
  email: string;
  phone: string;
  companyName: string;
  projectRole: string;
  userRole: string;
  createdAt: string;
  removedAt: string | null;
}

export interface AdminProjectMemberListResponse {
  totalCount: number;
  members: AdminProjectMemberListItem[];
}

export interface AdminProjectCreateRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDateExpected?: string;
  contractAmount?: number | null;
  contractFileUrl?: string | null;
  customerCompanyId?: number | null;
}

export interface AdminProjectUpdateRequest extends AdminProjectCreateRequest {
  endDate?: string | null;
}

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};

export const fetchAdminProjects = (params: {
  status?: ProjectStatus;
  companyId?: number;
  keyword?: string;
  page?: number;
  size?: number;
}) =>
  unwrap<AdminProjectListResponse>(
    api.get("/api/admin/projects", {
      params: {
        status: params.status,
        companyId: params.companyId,
        keyword: params.keyword,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),
  );

export const fetchAdminProjectDetail = (projectId: number) =>
  unwrap<AdminProjectDetailResponse>(api.get(`/api/admin/projects/${projectId}`));

export const createAdminProject = (payload: AdminProjectCreateRequest) =>
  unwrap<{ id: number; name: string; status: ProjectStatus; createdAt: string }>(
    api.post("/api/admin/projects", payload),
  );

export const updateAdminProject = (projectId: number, payload: AdminProjectUpdateRequest) =>
  unwrap<{ id: number; name: string; status: ProjectStatus; updatedAt?: string }>(
    api.patch(`/api/admin/projects/${projectId}`, payload),
  );

export const deleteAdminProject = (projectId: number) =>
  unwrap<void>(api.delete(`/api/admin/projects/${projectId}`));

export const fetchAdminProjectMembers = (projectId: number) =>
  unwrap<AdminProjectMemberListResponse>(api.get(`/api/admin/projects/${projectId}/members`));

export const addAdminProjectMember = (
  projectId: number,
  payload: { userId: number; projectRole: string },
) =>
  unwrap<{ projectId: number; userId: number; projectRole: string }>(
    api.post(`/api/admin/projects/${projectId}/members`, payload),
  );

export const removeAdminProjectMember = (projectId: number, userId: number) =>
  unwrap<void>(api.delete(`/api/admin/projects/${projectId}/members/${userId}`));
