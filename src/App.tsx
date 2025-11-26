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
import Checklist from "./pages/Checklist";
import ChecklistDetail from "./pages/ChecklistDetail";
import Approvals from "./pages/Approvals";
import ApprovalDetail from "./pages/ApprovalDetail";
import TeamMembers from "./pages/TeamMembers";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

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
          <Route path="/project/:id/checklist" element={<Checklist />} />
          <Route path="/project/:id/checklist/:checklistId" element={<ChecklistDetail />} />
          <Route path="/project/:id/approvals" element={<Approvals />} />
          <Route path="/project/:id/approvals/:approvalId" element={<ApprovalDetail />} />
          <Route path="/project/:id/members" element={<TeamMembers />} />
          <Route path="/project/:id/history" element={<History />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
