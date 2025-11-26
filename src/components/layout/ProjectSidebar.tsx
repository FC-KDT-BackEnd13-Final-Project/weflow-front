import { LayoutDashboard, CheckSquare, MessageSquare, Users, History, ChevronLeft, ClipboardCheck, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useParams } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const projectMenuItems = [
  { title: "대시보드", url: "/project/:id/dashboard", icon: LayoutDashboard },
  { title: "체크리스트", url: "/project/:id/checklist", icon: CheckSquare },
  { title: "단계별 승인", url: "/project/:id/approvals", icon: ClipboardCheck },
  { title: "게시판", url: "/project/:id/board", icon: MessageSquare },
  { title: "멤버 관리", url: "/project/:id/members", icon: Users },
  { title: "히스토리", url: "/project/:id/history", icon: History },
];

export function ProjectSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { id } = useParams();
  const collapsed = state === "collapsed";

  const menuItems = projectMenuItems.map(item => ({
    ...item,
    url: item.url.replace(':id', id || '1')
  }));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
              title="사이드바 열기"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex flex-1 items-center gap-2 text-sidebar-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-2 py-1"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-semibold text-sidebar-foreground">프로젝트 목록</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
              title="사이드바 접기"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>프로젝트 메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
    </Sidebar>
  );
}
