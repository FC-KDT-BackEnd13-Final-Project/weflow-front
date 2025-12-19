import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";
import api from "@/apis/api";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 추가

export default function AdminLayout() {
  const navigate = useNavigate();

  // 사용자 이름과 로딩 상태를 관리
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    document.documentElement.classList.add("admin-sidebar-theme");
    return () =>
      document.documentElement.classList.remove("admin-sidebar-theme");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAdmin = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        const response = await api.get("/api/users/me", {
          signal: controller.signal,
        });
        const data = response.data?.data;
        if (data?.name) {
          setAdminName(data.name);
        }
      } catch {
        // 조용히 실패
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };

    fetchAdmin();
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="admin-sidebar-theme flex min-h-screen w-full">
        <AdminAppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-3">
              {isLoading ? (
                // 로딩 중일 때 이름 스켈레톤 표시
                <Skeleton className="h-5 w-24" />
              ) : (
                // 로딩 완료 후 이름 표시
                <span className="text-sm font-medium">
                  {adminName ? `${adminName}님` : "관리자"}
                </span>
              )}

              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleLogout}
                disabled={isLoading} // 로딩 중 로그아웃 비활성화
              >
                로그아웃
              </button>
            </div>
          </header>

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}