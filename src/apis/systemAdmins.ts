import api from "./api";

export interface SystemAdmin {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string; // SYSTEM_ADMIN
  deletedAt?: string | null;
}

// 전체 조회
export const getSystemAdmins = async (): Promise<SystemAdmin[]> => {
  const res = await api.get("/api/admin/admin-users");
  return res.data.data;
};

// 상세 조회
export const getSystemAdminById = async (id: number): Promise<SystemAdmin> => {
  const res = await api.get(`/api/admin/admin-users/${id}`);
  return res.data.data;
};

// 생성
export const createSystemAdmin = async (payload: {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
}): Promise<SystemAdmin> => {
  const res = await api.post("/api/admin/admin-users", payload);
  return res.data.data;
};

// 수정
export const updateSystemAdmin = async (
  id: number,
  payload: { name?: string; phoneNumber?: string; password?: string }
): Promise<SystemAdmin> => {
  const res = await api.patch(`/api/admin/admin-users/${id}`, payload);
  return res.data.data;
};

// 삭제
export const deleteSystemAdmin = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/admin-users/${id}`);
};
