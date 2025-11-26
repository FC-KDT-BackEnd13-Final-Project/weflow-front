import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProjectSidebar } from "./ProjectSidebar";

interface ProjectLayoutProps {
  children: ReactNode;
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <ProjectSidebar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
