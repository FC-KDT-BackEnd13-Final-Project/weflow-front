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
  ProjectPhase,
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

const projectPhaseLabelMap: Record<ProjectPhase, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const projectPhaseBadgeMap: Record<ProjectPhase, string> = {
  CONTRACT: "bg-blue-50 text-blue-700 border-blue-100",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border-emerald-100",
  DELIVERY: "bg-amber-50 text-amber-700 border-amber-100",
  MAINTENANCE: "bg-slate-100 text-slate-700 border-slate-200",
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
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMembershipState = (
    project: ProjectSummaryResponse
  ): "joined" | "not-joined" | "unknown" => {
    if (userRole === "SYSTEM_ADMIN") return "joined";
    if (userRole === "CLIENT") return "joined";
    if (userRole === "AGENCY") {
      const isMemberValue = project.isMember ?? project.member;
      if (isMemberValue === true) return "joined";
      if (isMemberValue === false) return "not-joined";
      if (project.projectRole) return "joined";
      return "unknown";
    }
    if (project.projectRole) return "joined";
    return "not-joined";
  };

  const enrichProjects = async (items: ProjectSummaryResponse[]) => {
    if (!userRole) return;
    const targets = items.filter((p) => {
      if (userRole === "AGENCY") {
        const isMemberValue = p.isMember ?? p.member;
        if (isMemberValue !== true) return false;
      }
      return (
        !(
          p.endDateExpected ??
          p.expectedEndDate ??
          p.expirationDate ??
          p.endDate
        ) ||
        !(p.projectPhase ?? p.phase)
      );
    });
    if (targets.length === 0) return;

    const results = await Promise.allSettled(
      targets.map((p) => fetchProjectDetail(p.projectId))
    );

    const updates = new Map<number, Partial<ProjectSummaryResponse>>();
    results.forEach((res, idx) => {
      if (res.status !== "fulfilled") return;
      const projectId = targets[idx].projectId;
      updates.set(projectId, {
        endDateExpected:
          res.value.endDateExpected ??
          (res.value as any)?.expectedEndDate ??
          null,
        expectedEndDate:
          (res.value as any)?.expectedEndDate ??
          res.value.endDateExpected ??
          null,
        expirationDate:
          (res.value as any)?.expirationDate ??
          (res.value as any)?.expectedEndDate ??
          res.value.endDateExpected ??
          null,
        endDate: (res.value as any)?.endDate ?? null,
        projectPhase:
          (res.value as any)?.phase ??
          targets[idx].projectPhase ??
          targets[idx].phase ??
          null,
        phase: (res.value as any)?.phase ?? null,
      });
    });

    if (updates.size === 0) return;
    setProjects((prev) =>
      prev.map((p) =>
        updates.has(p.projectId) ? { ...p, ...updates.get(p.projectId)! } : p
      )
    );
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyProjects();
      const items = data.projects ?? [];
      setProjects(items);
      setTotalCount(data.totalCount ?? 0);
      setPage(data.page);
      setSize(data.size);
      if (userRole) {
        await enrichProjects(items);
      }
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
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const filteredAndSortedProjects = useMemo(() => {
    if (userRole !== "AGENCY") return filteredProjects;

    const priority = {
      joined: 0,
      unknown: 1,
      "not-joined": 2,
    } as const;

    return [...filteredProjects].sort(
      (a, b) =>
        priority[getMembershipState(a)] - priority[getMembershipState(b)]
    );
  }, [filteredProjects, userRole]);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  const formatDate = (value?: string | null) => {
    if (!value) return "미정";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "미정";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / size));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedProjects = filteredAndSortedProjects.slice(
    currentPage * size,
    currentPage * size + size
  );

  const handleCardClick = async (project: ProjectSummaryResponse) => {
    const membershipState = getMembershipState(project);
    const isSystemAdmin = userRole === "SYSTEM_ADMIN";

    if (isSystemAdmin || membershipState === "joined") {
      navigate(`/project/${project.projectId}/dashboard`);
      return;
    }

    if (userRole === "AGENCY") {
      if (membershipState === "not-joined" || membershipState === "unknown") {
        toast({
          title: "접근 불가",
          description: "참여 중인 프로젝트만 볼 수 있습니다.",
        });
        return;
      }
      navigate(`/project/${project.projectId}/dashboard`);
      return;
    }

    if (userRole === "CLIENT") {
      navigate(`/project/${project.projectId}/dashboard`);
      return;
    }

    // AGENCY는 목록은 전체지만 대시보드는 본인 프로젝트만 입장 가능 -> 없는 경우 상세 호출로 검증
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
            {paginatedProjects.map((project) => (
              <Card
                key={project.projectId}
                className={`card-hover ${
                  (() => {
                    const membershipState = getMembershipState(project);
                    const isDisabled =
                      userRole === "AGENCY" && membershipState !== "joined";
                    if (isDisabled) return "cursor-not-allowed opacity-50";
                    if (
                      membershipState === "joined" ||
                      userRole === "SYSTEM_ADMIN" ||
                      userRole === "CLIENT"
                    ) {
                      return "cursor-pointer";
                    }
                    return "cursor-not-allowed opacity-75";
                  })()
                }`}
                onClick={() => handleCardClick(project)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3 w-full justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <StatusBadge
                          status={statusBadgeMap[project.status]}
                          className="px-3.5 py-1.5 text-sm leading-none"
                        >
                          {statusLabelMap[project.status]}
                        </StatusBadge>
                      </div>
                      <CardDescription>
                        {(() => {
                          if (userRole === "SYSTEM_ADMIN") return ""; // 시스템 관리자는 표시 생략
                          const membershipState = getMembershipState(project);
                          if (membershipState === "joined") return "참여중";
                          if (userRole === "AGENCY") {
                            if (membershipState === "unknown") return "";
                            return "참여하지 않음";
                          }
                          if (userRole === "CLIENT") return "참여중";
                          return membershipState === "not-joined"
                            ? "참여하지 않음"
                            : "";
                        })()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-start justify-end gap-2 ml-auto">
                      {(() => {
                        const phaseValue =
                          (project.projectPhase ??
                            project.phase) as ProjectPhase | undefined;
                        if (!phaseValue) return null;
                        const phaseLabel =
                          projectPhaseLabelMap[phaseValue] ?? phaseValue;
                        const phaseClass =
                          projectPhaseBadgeMap[phaseValue] ??
                          "bg-slate-100 text-slate-700 border-slate-200";
                        return (
                          <Badge
                            className={`border ${phaseClass} px-3.5 py-1.5 text-sm leading-none`}
                          >
                            {phaseLabel}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
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
                  {(() => {
                    const membershipState = getMembershipState(project);
                    const showDeadline = membershipState === "joined";
                    if (!showDeadline) return null;
                    return (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">마감일</span>
                        <span className="font-medium">
                          {formatDate(
                            project.endDateExpected ??
                              project.expectedEndDate ??
                              project.expirationDate ??
                              project.endDate
                          )}
                        </span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProjects.length > 0 && (
          <div className="flex items-center justify-between pt-0">
            <div className="text-sm text-muted-foreground">
              총 {totalCount.toLocaleString()}건 · {currentPage + 1} /{" "}
              {totalPages} 페이지
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(size)}
                onValueChange={(value) => {
                  const newSize = Number(value);
                  setSize(newSize);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="페이지 크기" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}개
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
