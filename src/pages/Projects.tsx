import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectStatus, fetchMyProjects, ProjectSummaryResponse } from "@/apis/projects";

const statusLabelMap: Record<ProjectStatus, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행중",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
  CLOSED: "종료",
};

const statusBadgeMap: Record<ProjectStatus, "pending" | "progress" | "complete" | "rejected" | "approved" | "request"> = {
  CONTRACT: "pending",
  IN_PROGRESS: "progress",
  DELIVERY: "progress",
  MAINTENANCE: "progress",
  CLOSED: "complete",
};

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyProjects();
      setProjects(data ?? []);
    } catch (err) {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
            <p className="text-muted-foreground mt-1">진행 중인 프로젝트를 관리하세요</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProjectStatus | "ALL")}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="상태 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(statusLabelMap).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            {loading ? "불러오는 중..." : error ?? "조건에 맞는 프로젝트가 없습니다."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.projectId}
                className="card-hover cursor-pointer"
                onClick={() => navigate(`/project/${project.projectId}/dashboard`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <StatusBadge status={statusBadgeMap[project.status]}>
                      {statusLabelMap[project.status]}
                    </StatusBadge>
                  </div>
                  <CardDescription>내 역할: {project.projectRole}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">상태</span>
                    <Badge variant="secondary">{statusLabelMap[project.status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">프로젝트 ID</span>
                    <span className="font-medium">{project.projectId}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
