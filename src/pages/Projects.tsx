import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockProjects = [
  {
    id: 1,
    name: "쇼핑몰 리뉴얼 프로젝트",
    client: "ABC 커머스",
    status: "progress" as const,
    progress: 65,
    dueDate: "2024.12.31",
    team: 5,
  },
  {
    id: 2,
    name: "기업 홈페이지 제작",
    client: "XYZ 그룹",
    status: "pending" as const,
    progress: 20,
    dueDate: "2025.01.15",
    team: 3,
  },
  {
    id: 3,
    name: "모바일 앱 개발",
    client: "스타트업 DEF",
    status: "complete" as const,
    progress: 100,
    dueDate: "2024.11.30",
    team: 8,
  },
];

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
            <p className="text-muted-foreground mt-1">진행 중인 프로젝트를 관리하세요</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
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
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <Card
              key={project.id}
              className="card-hover cursor-pointer"
              onClick={() => navigate(`/project/${project.id}/dashboard`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <StatusBadge status={project.status}>
                    {project.status === "progress" && "진행중"}
                    {project.status === "pending" && "대기"}
                    {project.status === "complete" && "완료"}
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
      </div>
    </AppLayout>
  );
}
