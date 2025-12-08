const API = import.meta.env.VITE_API_URL;

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  import.meta.env.VITE_ACCESS_TOKEN ||
  import.meta.env.VITE_API_TOKEN ||
  "";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API}${path}`, { ...options, headers });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (json && (json.message || json.error)) || "API 요청에 실패했습니다.";
    throw new Error(message);
  }

  if (json?.success === false) {
    throw new Error(json?.message || "요청이 거절되었습니다.");
  }

  return json as ApiResponse<T>;
}
