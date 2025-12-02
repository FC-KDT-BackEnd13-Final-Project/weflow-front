import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const AdminProjects = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("전체");
  const [companyFilter, setCompanyFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const projects = [
    {
      name: "ClientA Web Renewal",
      company: "ClientA",
      progress: 42,
      startDate: "2025-11-12",
      endDate: "2025-12-12",
      status: "진행중",
    },
    {
      name: "B사 이벤트 페이지",
      company: "ClientB",
      progress: 100,
      startDate: "2025-10-03",
      endDate: "2025-10-30",
      status: "완료",
    },
    {
      name: "반응형 리뉴얼",
      company: "DevCorp",
      progress: 10,
      startDate: "2025-11-08",
      endDate: "2025-12-11",
      status: "진행중",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "진행중") {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{status}</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">
            프로젝트 관리 {'>'} 프로젝트 목록
          </p>
        </div>
        <Button onClick={() => navigate("/admin/projects/create")}>
          <Plus className="h-4 w-4 mr-2" />
          프로젝트 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">진행 상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">회사 필터</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="clientA">clientA</SelectItem>
                  <SelectItem value="develcop">develcop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">검색:</label>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="프로젝트명 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 gap-4 bg-muted p-4 font-medium text-sm">
              <div>프로젝트명</div>
              <div>회사</div>
              <div>진행률</div>
              <div>시작일</div>
              <div>종료일</div>
              <div>상태</div>
            </div>
            <div className="divide-y">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer items-center"
                  onClick={() => navigate(`/admin/projects/${index + 1}`)}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-muted-foreground">{project.company}</div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{project.progress}%</div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.startDate}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.endDate}
                  </div>
                  <div>{getStatusBadge(project.status)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProjects;
