import { ApiResponse } from "@/types/api";

export function unwrapApiResponse<T>(data: ApiResponse<T>): ApiResponse<T> {
  if (data?.success === false) {
    throw new Error(data?.message || "요청이 거절되었습니다.");
  }
  return data;
}

// 데이터를 바로 반환하는 헬퍼 (ApiResponse<T> -> T)
export function unwrapData<T>(res: ApiResponse<T>): T {
  if (res?.success === false) {
    throw new Error(res?.message || "요청이 거절되었습니다.");
  }
  return res.data;
}

type ApiErrorShape = { response?: { data?: { message?: string; error?: string } }; message?: string };

export function buildApiErrorMessage(error: unknown): string {
  const err = error as ApiErrorShape;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "API 요청에 실패했습니다."
  );
}
