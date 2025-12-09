import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProjectStatus,
  fetchMyProjects,
  ProjectSummaryResponse,
  fetchProjectDetail,
  ProjectRole,
} from "@/apis/projects";
import { useUserStore } from "@/stores/user";

const statusLabelMap: Record<ProjectStatus, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행중",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
  CLOSED: "종료",
};

const statusBadgeMap: Record<
  ProjectStatus,
  "pending" | "progress" | "complete" | "rejected" | "approved" | "request"
> = {
  CONTRACT: "pending",
  IN_PROGRESS: "progress",
  DELIVERY: "progress",
  MAINTENANCE: "progress",
  CLOSED: "complete",
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userRole = useUserStore((s) => s.user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">(
    "ALL"
  );
  const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<
    Record<number, "joined" | "not-joined" | "unknown">
  >({});
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

  // AGENCY: backend 목록에서 projectRole이 비어있는 경우 멤버십을 미리 검증해 표시
  useEffect(() => {
    if (userRole !== "AGENCY") return;
    const unknownProjects = projects.filter(
      (p) => p.projectRole === null || p.projectRole === undefined
    );
    if (unknownProjects.length === 0) return;

    const checkMembership = async () => {
      const results = await Promise.allSettled(
        unknownProjects.map((p) =>
          fetchProjectDetail(p.projectId).then(
            () => ({ projectId: p.projectId, joined: true }),
            () => ({ projectId: p.projectId, joined: false })
          )
        )
      );

      setMembershipStatus((prev) => {
        const next = { ...prev };
        results.forEach((res) => {
          if (res.status === "fulfilled") {
            next[res.value.projectId] = res.value.joined
              ? "joined"
              : "not-joined";
          }
        });
        return next;
      });
    };

    void checkMembership();
  }, [projects, userRole]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleCardClick = async (project: ProjectSummaryResponse) => {
    const isMember =
      project.projectRole !== undefined && project.projectRole !== null;
    const assumedMember = !isMember && userRole === "CLIENT"; // 클라이언트 목록은 이미 본인 프로젝트만
    const isSystemAdmin = userRole === "SYSTEM_ADMIN";
    const isClientMember = assumedMember;
    const agencyKnownMember = membershipStatus[project.projectId] === "joined";

    if (isSystemAdmin || isMember || isClientMember || agencyKnownMember) {
      const nextStatus =
        isMember || agencyKnownMember
          ? "joined"
          : membershipStatus[project.projectId];
      if (nextStatus) {
        setMembershipStatus((prev) => ({
          ...prev,
          [project.projectId]: nextStatus,
        }));
      }
      navigate(`/project/${project.projectId}/dashboard`);
      return;
    }

    // AGENCY는 목록은 전체지만 대시보드는 본인 프로젝트만 입장 가능 -> 없는 경우 상세 호출로 검증
    if (userRole === "AGENCY") {
      try {
        await fetchProjectDetail(project.projectId);
        setMembershipStatus((prev) => ({
          ...prev,
          [project.projectId]: "joined",
        }));
        navigate(`/project/${project.projectId}/dashboard`);
      } catch (err) {
        setMembershipStatus((prev) => ({
          ...prev,
          [project.projectId]: "not-joined",
        }));
        toast({
          title: "접근 불가",
          description: "참여 중인 프로젝트만 볼 수 있습니다.",
        });
      }
      return;
    }

    toast({
      title: "접근 불가",
      description: "참여 중인 프로젝트만 볼 수 있습니다.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
            <p className="text-muted-foreground mt-1">
              진행 중인 프로젝트를 관리하세요
            </p>
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
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ProjectStatus | "ALL")
            }
          >
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
            {loading
              ? "불러오는 중..."
              : error ?? "조건에 맞는 프로젝트가 없습니다."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.projectId}
                className={`card-hover ${
                  userRole === "SYSTEM_ADMIN" ||
                  (project.projectRole !== null &&
                    project.projectRole !== undefined) ||
                  userRole === "CLIENT" ||
                  userRole === "AGENCY"
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-75"
                }`}
                onClick={() => handleCardClick(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <StatusBadge status={statusBadgeMap[project.status]}>
                      {statusLabelMap[project.status]}
                    </StatusBadge>
                  </div>
                  <CardDescription>
                    {(() => {
                      if (userRole === "SYSTEM_ADMIN") return ""; // 시스템 관리자는 표시 생략
                      // 이미 서버에서 role 내려오면 → 참여중
                      if (project.projectRole) return "참여중";

                      // CLIENT는 목록 자체가 본인 것만 → 참여중
                      if (userRole === "CLIENT") return "참여중";

                      // AGENCY는 membershipStatus 보고
                      if (userRole === "AGENCY") {
                        const state = membershipStatus[project.projectId];
                        if (state === "joined") return "참여중";
                        if (state === "not-joined") return "참여하지 않음";
                        return "확인 중…";
                      }

                      // 그 외
                      return "참여하지 않음";
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">고객사</span>
                    <span className="font-medium">
                      {project.customerCompanyName ?? "정보 없음"}
                    </span>
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
