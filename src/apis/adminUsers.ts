import api from "./api";
import { MemberData } from "@/components/admin/MemberSelectDialog";

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  companyId: number;
  companyName: string;
  role: "SYSTEM_ADMIN" | "AGENCY" | "CLIENT";
}

export const mapCompanyType = (role: AdminUserItem["role"]) => {
  return role === "CLIENT" ? "client" : "agency";
};

/** 반드시 MemberData[]을 반환하도록 통일 */
export const fetchAllUsers = async (): Promise<MemberData[]> => {
  const res = await api.get("/api/admin/users", { params: { size: 9999 } });
  const users: AdminUserItem[] = res.data.data.content;

  return users.map((u) => ({
    id: String(u.id),
    name: u.name,
    company: u.companyName,
    companyType: mapCompanyType(u.role),
    position: u.role, // 간단 표기
  }));
};
