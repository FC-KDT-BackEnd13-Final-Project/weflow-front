import api from "./api";

interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  companyId: number | null;
  companyName: string | null;
  isTemporaryPassword: boolean | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: PageableResponse<User>;
}

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  phoneNumber: string;
  companyId: number;
}

interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    name: string;
  };
}

interface UserDetailResponse {
  success: boolean;
  message: string;
  data: User;
}

interface UpdateUserRequest {
  name: string;
  role: string;
  status: string;
  companyId: number;
}

interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    role: string;
    status: string;
  };
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
  data: null;
}

export const adminApi = {
  getUsers: async (page: number = 0, size: number = 10): Promise<UsersResponse> => {
    const response = await api.get<UsersResponse>("/api/admin/users", {
      params: { page, size },
    });
    return response.data;
  },

  getUserById: async (userId: number): Promise<UserDetailResponse> => {
    const response = await api.get<UserDetailResponse>(`/api/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post<CreateUserResponse>("/api/admin/users", data);
    return response.data;
  },

  updateUser: async (userId: number, data: UpdateUserRequest): Promise<UpdateUserResponse> => {
    const response = await api.patch<UpdateUserResponse>(`/api/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<DeleteUserResponse> => {
    const response = await api.delete<DeleteUserResponse>(`/api/admin/users/${userId}`);
    return response.data;
  },
};
