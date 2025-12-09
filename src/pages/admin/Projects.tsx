import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import {
  AdminProjectSummary,
  ProjectStatus,
  fetchAdminProjects,
} from "@/apis/adminProjects";

// 📌 프로젝트 상태 라벨
const statusLabels: Record<ProjectStatus, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행중",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
  CLOSED: "종료",
};

const AdminProjects = () => {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [companyIdFilter, setCompanyIdFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📌 프로젝트 목록 조회
  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAdminProjects({
        status: statusFilter || undefined,
        companyId: companyIdFilter ? Number(companyIdFilter) : undefined,
        keyword: searchQuery || undefined,
        page: 0,
        size: 20,
      });

      setProjects(data.projects ?? []);
    } catch {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // 📌 Select 옵션
  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      { value: "CONTRACT", label: statusLabels.CONTRACT },
      { value: "IN_PROGRESS", label: statusLabels.IN_PROGRESS },
      { value: "DELIVERY", label: statusLabels.DELIVERY },
      { value: "MAINTENANCE", label: statusLabels.MAINTENANCE },
      { value: "CLOSED", label: statusLabels.CLOSED },
    ],
    []
  );

  return (
    <div className="space-y-6">

      {/* 📌 헤더 */}
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

          {/* 📌 필터 영역 */}
          <div className="flex flex-wrap gap-4 items-end">

            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">진행 상태</label>
              <Select
                value={statusFilter || "ALL"}
                onValueChange={(v) =>
                  setStatusFilter(v === "ALL" ? "" : (v as ProjectStatus))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 회사 ID */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">회사 ID</label>
              <Input
                type="number"
                value={companyIdFilter}
                onChange={(e) => setCompanyIdFilter(e.target.value)}
                placeholder="예: 12"
                className="w-[160px]"
              />
            </div>

            {/* 검색 */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <label className="text-sm font-medium">검색</label>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="프로젝트명 검색"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" onClick={fetchList} disabled={loading}>
              조회
            </Button>
          </div>

          {/* 📌 목록 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 bg-muted p-4 font-medium text-sm">
              <div>프로젝트명</div>
              <div>상태</div>
              <div>고객사 ID</div>
              <div>생성자</div>
              <div>삭제 여부</div>
            </div>

            <div className="divide-y">

              {loading && (
                <div className="p-4 text-center text-muted-foreground">
                  불러오는 중...
                </div>
              )}

              {error && !loading && (
                <div className="p-4 text-center text-destructive">{error}</div>
              )}

              {!loading && !error && projects.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  등록된 프로젝트가 없습니다.
                </div>
              )}

              {!loading &&
                !error &&
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/50 cursor-pointer transition"
                    onClick={() => navigate(`/admin/projects/${project.id}`)}
                  >
                    <div className="font-medium">{project.name}</div>

                    <div>
                      <Badge variant="secondary">
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground">
                      {project.customerCompanyId ?? "-"}
                    </div>

                    <div className="text-muted-foreground">
                      {project.createdBy ?? "-"}
                    </div>

                    <div className="text-muted-foreground">
                      {project.deleted ? "삭제됨" : "-"}
                    </div>
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
