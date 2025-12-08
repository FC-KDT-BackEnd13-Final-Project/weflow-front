import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";

export default function AdminLayout() {
  useEffect(() => {
    document.documentElement.classList.add("admin-sidebar-theme");
    return () => document.documentElement.classList.remove("admin-sidebar-theme");
  }, []);

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
              <span className="text-sm font-medium">관리자 홍길동님</span>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
