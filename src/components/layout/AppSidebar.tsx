import { LayoutDashboard, FolderKanban, Bell, ClipboardCheck, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserStore } from "@/stores/user";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const allMenuItems = [ // 모든 메뉴 항목 정의
  { title: "대시보드", url: "/dashboard", icon: LayoutDashboard, roles: ["CLIENT", "AGENCY"] }, // SYSTEM_ADMIN 제외
  { title: "프로젝트", url: "/projects", icon: FolderKanban },
  { title: "알림", url: "/notifications", icon: Bell },
  { title: "승인 요청", url: "/approval-requests", icon: ClipboardCheck },
  { title: "설정", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const userRole = useUserStore((s) => s.user?.role);

  // SYSTEM_ADMIN일 경우 '대시보드' 메뉴를 제외하고 필터링
  const filteredMenuItems = allMenuItems.filter(item => {
    if (item.url === "/dashboard" && userRole === "SYSTEM_ADMIN") {
      return false;
    }
    return true;
  });

  // NOTE: /main 또는 / 로 접근 시 SYSTEM_ADMIN은 /admin/dashboard로 이동해야 합니다.
  // 이 리다이렉션 로직은 라우터 설정 파일 또는 로그인 후 진입점에서 처리하는 것이 좋습니다.

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">W</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground">weflow</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => ( // 필터링된 메뉴 사용
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {userRole === "SYSTEM_ADMIN" && (
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/admin/dashboard"
                  className="hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {!collapsed && <span>관리자 페이지</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}