import api from "@/apis/api";
import { unwrapApiResponse, buildApiErrorMessage } from "@/lib/apiUtils";
import {
  StepApiResponse,
  StepRequestListResponse,
  StepRequestResponse,
  StepRequestSummaryResponse,
  StepAttachmentFileInput,
  StepAttachmentLinkInput,
} from "@/lib/stepTypes";

type StepRequestPayload = Partial<Omit<StepRequestResponse, "files" | "links">> & {
  files?: StepAttachmentFileInput[] | null;
  links?: StepAttachmentLinkInput[] | null;
};

export async function createStepRequest(stepId: number, body: StepRequestPayload): Promise<StepApiResponse<StepRequestResponse>> {
  try {
    const response = await api.post<StepApiResponse<StepRequestResponse>>(`/api/steps/${stepId}/requests`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getStepRequests(stepId: number, page = 0, size = 20): Promise<StepRequestListResponse> {
  try {
    const response = await api.get<StepApiResponse<StepRequestListResponse>>(`/api/steps/${stepId}/requests`, {
      params: { page, size },
    });
    return unwrapApiResponse(response.data).data;
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getProjectStepRequests(
  projectId: number,
  page = 0,
  size = 20
): Promise<StepRequestListResponse> {
  try {
    const response = await api.get<StepApiResponse<StepRequestListResponse>>(`/api/projects/${projectId}/requests`, {
      params: { page, size },
    });
    return unwrapApiResponse(response.data).data;
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function getStepRequest(id: number): Promise<StepApiResponse<StepRequestResponse>> {
  try {
    const response = await api.get<StepApiResponse<StepRequestResponse>>(`/api/requests/${id}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function updateStepRequest(id: number, body: StepRequestPayload): Promise<StepApiResponse<StepRequestResponse>> {
  try {
    const response = await api.patch<StepApiResponse<StepRequestResponse>>(`/api/requests/${id}`, body);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}

export async function cancelStepRequest(id: number): Promise<StepApiResponse<StepRequestResponse>> {
  try {
    const response = await api.delete<StepApiResponse<StepRequestResponse>>(`/api/requests/${id}`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw new Error(buildApiErrorMessage(error));
  }
}
