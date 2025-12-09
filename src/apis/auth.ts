import api from "./api";

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

interface Company {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  status: string;
  company: Company;
}

interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

interface UpdateUserRequest {
  name: string;
  phoneNumber: string;
}

interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    name: string;
    phoneNumber: string;
  };
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: null;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/auth/login", credentials);
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfileResponse>("/api/users/me");
    return response.data.data;
  },

  updateMe: async (data: UpdateUserRequest): Promise<UpdateUserResponse> => {
    const response = await api.patch<UpdateUserResponse>("/api/users/me", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.patch<ChangePasswordResponse>("/api/users/me/password", data);
    return response.data;
  },
};
