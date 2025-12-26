import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage } from "@/lib/apiUtils";
import { ApiResponse } from "@/types/api";

export interface MeResponse {
  id: number;
  name: string;
  email?: string;
  companyName?: string;
  role?: string; // 권한/역할 정보가 내려오는 경우 사용
}

export async function getMyInfo(): Promise<ApiResponse<MeResponse>> {
  try {
    const response = await api.get<ApiResponse<MeResponse>>("/api/users/me");
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}
