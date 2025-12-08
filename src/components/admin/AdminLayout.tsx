import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";
import api from "@/apis/api";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState<string>("관리자");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("admin-sidebar-theme");
    return () => document.documentElement.classList.remove("admin-sidebar-theme");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAdmin = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await api.get("/api/users/me", { signal: controller.signal });
        const data = response.data?.data;
        if (data?.name) {
          setAdminName(data.name);
        }
      } catch {
        // ignore error, keep fallback name
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchAdmin();
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
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
              <span className="text-sm font-medium">
                {isLoadingProfile ? "관리자 정보를 불러오는 중..." : `${adminName}님`}
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
