import { useMemo, useState } from "react";
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

type ProjectStatus = "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE" | "CLOSED";

const mockProjects: Array<{
  id: number;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  team: number;
}> = [
  {
    id: 1,
    name: "쇼핑몰 리뉴얼 프로젝트",
    client: "ABC 커머스",
    status: "IN_PROGRESS",
    progress: 65,
    dueDate: "2024.12.31",
    team: 5,
  },
  {
    id: 2,
    name: "기업 홈페이지 제작",
    client: "XYZ 그룹",
    status: "CONTRACT",
    progress: 20,
    dueDate: "2025.01.15",
    team: 3,
  },
  {
    id: 3,
    name: "모바일 앱 개발",
    client: "스타트업 DEF",
    status: "DELIVERY",
    progress: 85,
    dueDate: "2024.11.30",
    team: 8,
  },
  {
    id: 4,
    name: "클라우드 포털 고도화",
    client: "아크레버 테크놀로지스",
    status: "complete" as const,
    progress: 10,
    dueDate: "2025.12.30",
    team: 7,
  },
];

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");

  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

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
            조건에 맞는 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="card-hover cursor-pointer"
                onClick={() => navigate(`/project/${project.id}/dashboard`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <StatusBadge status={statusBadgeMap[project.status]}>
                      {statusLabelMap[project.status]}
                    </StatusBadge>
                  </div>
                  <CardDescription>{project.client}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">진행률</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">마감일</span>
                    <span className="font-medium">{project.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{project.team}명 참여</Badge>
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
