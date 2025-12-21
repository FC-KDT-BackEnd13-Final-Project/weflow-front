import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { authApi } from "./apis/auth";
import { useUserStore } from "./stores/user";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectDashboard from "./pages/ProjectDashboard";
import Notifications from "./pages/Notifications";
import NotificationDetail from "./pages/NotificationDetail";
import ApprovalRequests from "./pages/ApprovalRequests";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import FirstPasswordChange from "./pages/FirstPasswordChange";
import Board from "./pages/Board";
import BoardNew from "./pages/BoardNew";
import BoardDetail from "./pages/BoardDetail";
import Checklist from "./pages/Checklist";
import ChecklistDetail from "./pages/ChecklistDetail";
import ChecklistCreate from "./pages/ChecklistCreate";
import ChecklistTemplates from "./pages/ChecklistTemplates";
import ChecklistTemplateDetail from "./pages/ChecklistTemplateDetail";
import Approvals from "./pages/Approvals";
import ApprovalDetail from "./pages/ApprovalDetail";
import TeamMembers from "./pages/TeamMembers";
import NotFound from "./pages/NotFound";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMembers from "./pages/admin/Members";
import AdminCompanies from "./pages/admin/Companies";
import AdminCompanyCreate from "./pages/admin/CompanyCreate";
import AdminCompanyEdit from "./pages/admin/CompanyEdit";
import AdminProjects from "./pages/admin/Projects";
import AdminProjectCreate from "./pages/admin/ProjectCreate";
import AdminProjectDetail from "./pages/admin/ProjectDetail";
import AdminProjectEdit from "./pages/admin/ProjectEdit";
import TemplateList from "./pages/admin/TemplateList";
import TemplateCreate from "./pages/admin/TemplateCreate";
import TemplateDetail from "./pages/admin/TemplateDetail";
import TemplateEdit from "./pages/admin/TemplateEdit";
import AdminMemberCreate from "./pages/admin/MemberCreate";
import AdminMemberDetail from "./pages/admin/MemberDetail";
import AdminLogs from "./pages/admin/Logs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserCreate from "./pages/admin/AdminUserCreate";
import AdminUserDetail from "./pages/admin/AdminUserDetail";

const queryClient = new QueryClient();

// Wrapper component to force remount on id change
const AdminProjectEditWrapper = () => {
  const { id } = useParams();
  return <AdminProjectEdit key={id} />;
};

function App() {
  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // 이미 로드된 경우 중복 요청 방지
    if (!user) {
      authApi
        .getMe()
        .then((response) => {
             if(response.success && response.data) {
                 setUser(response.data);
             }
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
        });
    }
  }, []);

  const ProtectedRoute = ({
    children,
    requireAdmin = false,
  }: {
    children: React.ReactElement;
    requireAdmin?: boolean;
  }) => {
    const token = localStorage.getItem("accessToken");
    const location = useLocation();

    if (!token) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (requireAdmin && user && user.role !== "SYSTEM_ADMIN") {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationProvider>
            <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/first-password-change" element={<FirstPasswordChange />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/:id"
              element={
                <ProtectedRoute>
                  <NotificationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approval-requests"
              element={
                <ProtectedRoute>
                  <ApprovalRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Project Member Routes */}
            <Route
              path="/project/:id/dashboard"
              element={
                <ProtectedRoute>
                  <ProjectDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/board"
              element={
                <ProtectedRoute>
                  <Board />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/board/new"
              element={
                <ProtectedRoute>
                  <BoardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/board/:postId/edit"
              element={
                <ProtectedRoute>
                  <BoardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/board/:postId"
              element={
                <ProtectedRoute>
                  <BoardDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/checklist"
              element={
                <ProtectedRoute>
                  <Checklist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/checklist/create"
              element={
                <ProtectedRoute>
                  <ChecklistCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/checklist/templates"
              element={
                <ProtectedRoute>
                  <ChecklistTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/checklist/templates/:templateId"
              element={
                <ProtectedRoute>
                  <ChecklistTemplateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/checklist/:checklistId"
              element={
                <ProtectedRoute>
                  <ChecklistDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/approvals"
              element={
                <ProtectedRoute>
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/approvals/:approvalId"
              element={
                <ProtectedRoute>
                  <ApprovalDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id/members"
              element={
                <ProtectedRoute>
                  <TeamMembers />
                </ProtectedRoute>
              }
            />

            {/* ---------- ADMIN ROUTES (/admin/**) ---------- */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="members/create" element={<AdminMemberCreate />} />
              <Route path="members/:id" element={<AdminMemberDetail />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="companies/create" element={<AdminCompanyCreate />} />
              <Route path="companies/:id/edit" element={<AdminCompanyEdit />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="projects/create" element={<AdminProjectCreate />} />
              <Route path="projects/:id" element={<AdminProjectDetail />} />
              <Route
                path="projects/:id/edit"
                element={<AdminProjectEditWrapper />}
              />
              <Route path="checklist-templates" element={<TemplateList />} />
              <Route
                path="checklist-templates/create"
                element={<TemplateCreate />}
              />
              <Route
                path="checklist-templates/:templateId"
                element={<TemplateDetail />}
              />
              <Route
                path="checklist-templates/:templateId/edit"
                element={<TemplateEdit />}
              />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="admin-users" element={<AdminUsers />} />
              <Route path="admin-users/create" element={<AdminUserCreate />} />
              <Route path="admin-users/:id" element={<AdminUserDetail />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
