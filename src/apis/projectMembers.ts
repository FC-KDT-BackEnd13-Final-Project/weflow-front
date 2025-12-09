import api from "./api";
import { ApiResponse, ProjectRole } from "./projects";

export interface ProjectMember {
  projectMemberId: number;
  userId: number;
  name: string;
  email: string;
  companyName: string;
  userRole: "CLIENT" | "AGENCY";
  projectRole: ProjectRole;
  joinedAt: string;
  removedAt?: string | null;
}

export interface ProjectRoleUpdateResponse {
  projectMemberId: number;
  projectRole: ProjectRole;
}

export interface ProjectRoleUpdateRequest {
  projectRole: ProjectRole;
}

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};

export const fetchProjectMembers = (projectId: number) =>
  unwrap<ProjectMember[]>(api.get(`/api/projects/${projectId}/members`));

export const updateProjectMemberRole = (
  projectId: number,
  memberId: number,
  payload: ProjectRoleUpdateRequest,
) =>
  unwrap<ProjectRoleUpdateResponse>(
    api.patch(`/api/projects/${projectId}/members/${memberId}/role`, payload),
  );

export const removeProjectMember = (projectId: number, memberId: number) =>
  unwrap<void>(api.delete(`/api/projects/${projectId}/members/${memberId}`));
