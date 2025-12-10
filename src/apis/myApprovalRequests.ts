import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage } from "@/lib/apiUtils";
import { StepApiResponse, StepRequestListResponse, StepRequestStatus } from "@/lib/stepTypes";

export type MyApprovalStatus = "ALL" | StepRequestStatus;

export async function getMyApprovalRequests(params: {
  status?: MyApprovalStatus;
  page?: number;
  size?: number;
}): Promise<StepApiResponse<StepRequestListResponse>> {
  try {
    const { status = "ALL", page = 0, size = 20 } = params;
    const requestParams: Record<string, number | StepRequestStatus> = { page, size };
    if (status && status !== "ALL") {
      requestParams.status = status;
    }

    const response = await api.get<StepApiResponse<StepRequestListResponse>>("/api/requests/my", {
      params: requestParams,
    });
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}
