import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import BoardNew from "./pages/BoardNew";
import BoardDetail from "./pages/BoardDetail";
import Checklist from "./pages/Checklist";
import ChecklistDetail from "./pages/ChecklistDetail";
import Approvals from "./pages/Approvals";
import ApprovalDetail from "./pages/ApprovalDetail";
import TeamMembers from "./pages/TeamMembers";
import History from "./pages/History";
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
import AdminChecklistCreate from "./pages/admin/ChecklistCreate";
import AdminMemberCreate from "./pages/admin/MemberCreate";
import AdminMemberDetail from "./pages/admin/MemberDetail";
import AdminLogs from "./pages/admin/Logs";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          
          {/* Project Member Routes */}
          <Route path="/project/:id/dashboard" element={<Dashboard />} />
          <Route path="/project/:id/board" element={<Board />} />
          <Route path="/project/:id/board/new" element={<BoardNew />} />
          <Route path="/project/:id/board/:postId" element={<BoardDetail />} />
          <Route path="/project/:id/checklist" element={<Checklist />} />
          <Route path="/project/:id/checklist/:checklistId" element={<ChecklistDetail />} />
          <Route path="/project/:id/approvals" element={<Approvals />} />
          <Route path="/project/:id/approvals/:approvalId" element={<ApprovalDetail />} />
          <Route path="/project/:id/members" element={<TeamMembers />} />
          <Route path="/project/:id/history" element={<History />} />
          
          {/* ---------- ADMIN ROUTES (/admin/**) ---------- */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
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
            <Route path="projects/:id/edit" element={<AdminProjectEdit />} />
            <Route path="projects/checklist/create" element={<AdminChecklistCreate />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
