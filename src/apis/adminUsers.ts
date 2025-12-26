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

export const mapCompanyType = (
  role: AdminUserItem["role"]
): MemberData["companyType"] => {
  return role === "CLIENT" ? "CLIENT" : "AGENCY";
};

const PAGE_SIZE = 20000;

const fetchUsersByRole = async (
  role: AdminUserItem["role"],
  extraParams: Record<string, any> = {}
): Promise<AdminUserItem[]> => {
  const res = await api.get("/api/admin/users", {
    params: { page: 0, size: PAGE_SIZE, role, ...extraParams },
  });

  return res.data?.data?.content ?? res.data?.content ?? [];
};

interface FetchAllUsersOptions {
  /** 프로젝트 고객사로 선택된 회사 ID (고객사 구성원만 제한적으로 조회) */
  customerCompanyId?: number | null;
}

/** 반드시 MemberData[]을 반환하도록 통일 */
export const fetchAllUsers = async (
  options?: FetchAllUsersOptions
): Promise<MemberData[]> => {
  const { customerCompanyId } = options ?? {};

  // 개발사 / 시스템관리자는 전체, 고객사는 선택한 회사만 조회해 요청 수 최소화
  const [agencies, systemAdmins, clients] = await Promise.all([
    fetchUsersByRole("AGENCY"),
    fetchUsersByRole("SYSTEM_ADMIN"),
    customerCompanyId
      ? fetchUsersByRole("CLIENT", { companyId: customerCompanyId })
      : Promise.resolve<AdminUserItem[]>([]),
  ]);

  const mergedMap = new Map<number, AdminUserItem>();

  [...agencies, ...systemAdmins, ...clients].forEach((u) =>
    mergedMap.set(u.id, u)
  );

  const users = Array.from(mergedMap.values());

  // 역할 구분 없이 모두 포함, companyType은 CLIENT만 CLIENT로, 나머지는 AGENCY로 표시
  return users.map((u) => ({
    id: String(u.id),
    name: u.name,
    company: u.companyName,
    companyType: mapCompanyType(u.role),
    position: u.role, // 간단 표기
    companyId: u.companyId,
  }));
};
