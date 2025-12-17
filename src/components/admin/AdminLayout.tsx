import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";
import api from "@/apis/api";

export default function AdminLayout() {
  const navigate = useNavigate();

  // ❌ 기본값 제거 (보여주지 않기 위함)
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("admin-sidebar-theme");
    return () =>
      document.documentElement.classList.remove("admin-sidebar-theme");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAdmin = async () => {
      try {
        const response = await api.get("/api/users/me", {
          signal: controller.signal,
        });
        const data = response.data?.data;
        if (data?.name) {
          setAdminName(data.name);
        }
      } catch {
        // 조용히 실패 (아무 것도 표시 안 함)
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
              {/* 👇 자리 유지 + 무음 처리 */}
              <span
                className={`text-sm font-medium ${
                  adminName ? "visible" : "invisible"
                }`}
              >
                {adminName ? `${adminName}님` : "placeholder"}
              </span>

              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleLogout}
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
