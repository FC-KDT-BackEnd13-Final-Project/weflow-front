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

export interface Company {
  id: number;
  name: string;
  businessNumber: string | null;
  representative: string | null;
  email: string | null;
  address: string | null;
  memo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    content: Company[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
  };
}

interface CreateCompanyRequest {
  name: string;
  businessNumber: string;
  representative: string;
  email: string;
  address: string;
  memo: string;
  status: string;
}

interface CreateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
  };
}

interface CompanyDetailResponse {
  success: boolean;
  message: string;
  data: Company;
}

interface UpdateCompanyRequest {
  name?: string;
  businessNumber?: string;
  representative?: string;
  email?: string;
  address?: string;
  memo?: string;
  status?: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    representative: string;
    status: string;
  };
}

interface DeleteCompanyResponse {
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

  getCompanies: async (): Promise<CompaniesResponse> => {
    const response = await api.get<CompaniesResponse>("/api/admin/companies");
    return response.data;
  },

  createCompany: async (data: CreateCompanyRequest): Promise<CreateCompanyResponse> => {
    const response = await api.post<CreateCompanyResponse>("/api/admin/companies", data);
    return response.data;
  },

  getCompanyById: async (companyId: number): Promise<CompanyDetailResponse> => {
    const response = await api.get<CompanyDetailResponse>(`/api/admin/companies/${companyId}`);
    return response.data;
  },

  updateCompany: async (companyId: number, data: UpdateCompanyRequest): Promise<UpdateCompanyResponse> => {
    const response = await api.patch<UpdateCompanyResponse>(`/api/admin/companies/${companyId}`, data);
    return response.data;
  },

  deleteCompany: async (companyId: number): Promise<DeleteCompanyResponse> => {
    const response = await api.delete<DeleteCompanyResponse>(`/api/admin/companies/${companyId}`);
    return response.data;
  },
};
