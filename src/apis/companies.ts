import api from "./api";

interface Company {
  id: number;
  name: string;
  businessNumber: string;
  representative: string;
  email: string;
  address: string;
  status: string;
}

interface CompanyResponse {
  success: boolean;
  message: string;
  data: Company;
}

export const companiesApi = {
  getMyCompany: async (): Promise<CompanyResponse> => {
    const response = await api.get<CompanyResponse>("/api/companies/me");
    return response.data;
  },
};
