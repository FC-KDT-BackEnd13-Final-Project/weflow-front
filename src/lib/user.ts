import { apiRequest, ApiResponse } from "./http";

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId?: number;
  companyName?: string;
}

export function getMyInfo(): Promise<ApiResponse<MeResponse>> {
  return apiRequest<MeResponse>("/api/users/me");
}
