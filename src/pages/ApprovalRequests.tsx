import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getMyApprovalRequests, type MyApprovalStatus } from "@/apis/myApprovalRequests";
import { StepRequestSummaryResponse } from "@/lib/stepTypes";
import { stepRequestStatusMap } from "@/constants/stepRequestStatus";
import { Checkbox } from "@/components/ui/checkbox";
import { getMyInfo, MeResponse } from "@/apis/user";
import { fetchMyProjects, type ProjectSummaryResponse } from "@/apis/projects";
import { fetchAdminProjects } from "@/apis/adminProjects";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 추가

// 승인 요청 항목 스켈레톤 컴포넌트 정의
const ApprovalRequestItemSkeleton = () => (
  <div className="rounded-xl border p-4 sm:p-5 space-y-3">
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>

    <div className="flex items-start justify-between gap-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-16" />
    </div>

    <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
      <Skeleton className="h-4 w-12" />
      <span className="text-muted-foreground">·</span>
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">·</span>
      <Skeleton className="h-4 w-28" />
    </div>
  </div>
);

export default function ApprovalRequests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") ?? "ALL";
  const projectParam = searchParams.get("projectId") ?? "ALL";
  const pendingParam = searchParams.get("pending") === "true";
  const statusFilter = (["ALL", "REQUESTED", "APPROVED", "REJECTED", "CHANGE_REQUESTED", "CANCELED"].includes(statusParam)
    ? statusParam
    : "ALL") as MyApprovalStatus;
  const pageParam = Number(searchParams.get("page") ?? 0);
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;
  const pageSize = 20;
  const [projectFilter, setProjectFilter] = useState<string>(projectParam);
  const [pendingOnly, setPendingOnly] = useState<boolean>(pendingParam);
  const [savedStatus, setSavedStatus] = useState<MyApprovalStatus>(statusFilter);
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMyInfo,
  });
  const role = ((meData?.data as MeResponse | undefined)?.role || "").toUpperCase();

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["myApprovalRequests", statusFilter, page, projectFilter, pendingOnly],
    queryFn: () =>
      getMyApprovalRequests({
        status: pendingOnly ? undefined : (statusFilter as MyApprovalStatus),
        page,
        size: pageSize,
        projectId: projectFilter !== "ALL" ? Number(projectFilter) : undefined,
        pendingOnly,
      }),
  });

  const requests = useMemo(() => data?.data.stepRequestSummaryResponses ?? [], [data]);
  const totalCount = data?.data.totalCount ?? 0;
  const currentPage = data?.data.page ?? page;
  const size = data?.data.size ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / (size || pageSize)));

  const filteredRequests = useMemo(() => {
    let next = requests;

    // 프로젝트 필터 (클라이언트 단에도 적용)
    if (projectFilter !== "ALL") {
      next = next.filter((request) => {
        const pid = (request as { projectId?: number }).projectId;
        return pid && String(pid) === projectFilter;
      });
    }

    // 상태/미처리 필터
    if (pendingOnly) {
      next = next.filter((request) => request.status === "REQUESTED" || request.status === "CHANGE_REQUESTED");
    } else if (statusFilter !== "ALL") {
      next = next.filter((request) => request.status === statusFilter);
    }

    return next;
  }, [requests, statusFilter, pendingOnly, projectFilter]);

  const phaseLabelMap: Record<string, string> = {
    PLANNING: "기획",
    DESIGN: "디자인",
    DEVELOPMENT: "개발",
    TESTING: "테스트",
    DEPLOYMENT: "배포",
    MAINTENANCE: "운영",
    CONTRACT: "계약",
    IN_PROGRESS: "진행",
    DELIVERY: "납품",
    PENDING: "대기",
    COMPLETED: "완료",
    APPROVED: "승인",
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // 상태 필터가 바뀔 때(미처리 OFF 상태에서만) 저장값 갱신
  useEffect(() => {
    if (pendingOnly) return;
    setSavedStatus(statusFilter);
  }, [statusFilter, pendingOnly]);

  useEffect(() => {
    if (projectParam) return;
    const defaultProject = "ALL";
    setProjectFilter(defaultProject);
    setSearchParams({
      status: statusFilter,
      page: "0",
      projectId: defaultProject,
      pending: pendingOnly ? "true" : "false",
    });
  }, [projectParam, statusFilter, setSearchParams, pendingOnly]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const isAdmin = role === "SYSTEM_ADMIN";
        if (isAdmin) {
          const res = await fetchAdminProjects({ size: 500 });
          const opts = (res.projects ?? []).map((p) => ({
            value: String(p.id),
            label: p.name,
          }));
          setProjectOptions(opts);
        } else {
          const res = await fetchMyProjects();
          const opts = (res.projects ?? []).map((p: ProjectSummaryResponse) => ({
            value: String(p.projectId),
            label: p.name,
          }));
          setProjectOptions(opts);
        }
      } catch (error) {
        console.error("프로젝트 목록 조회 실패", error);
      }
    };
    fetchProjects();
  }, [role]);

  const primaryProjectLabel = role === "SYSTEM_ADMIN" ? "전체 프로젝트" : "내 프로젝트 전체";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">승인 요청</h1>
          <p className="text-sm text-muted-foreground mt-1">조직 내 모든 프로젝트의 승인 요청 상태를 확인하세요.</p>
        </div>
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>최근 요청</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
              <Select
                value={projectFilter}
                onValueChange={(value) => {
                  setProjectFilter(value);
                  setSearchParams({
                    status: statusFilter,
                    projectId: value,
                    page: "0",
                    pending: pendingOnly ? "true" : "false",
                  });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{primaryProjectLabel}</SelectItem>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  const nextStatus = value as MyApprovalStatus;
                  setSavedStatus(nextStatus);
                  setSearchParams({
                    status: nextStatus,
                    projectId: projectFilter,
                    page: "0",
                    pending: pendingOnly ? "true" : "false",
                  });
                }}
                disabled={pendingOnly || isLoading}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="REQUESTED">승인 요청</SelectItem>
                  <SelectItem value="CHANGE_REQUESTED">수정 요청</SelectItem>
                  <SelectItem value="APPROVED">승인 완료</SelectItem>
                  <SelectItem value="REJECTED">반려</SelectItem>
                  <SelectItem value="CANCELED">요청 취소</SelectItem>
                </SelectContent>
              </Select>

              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={pendingOnly}
                  onCheckedChange={(checked) => {
                    const next = Boolean(checked);
                    if (next) {
                      setSavedStatus(statusFilter);
                      setPendingOnly(true);
                      setSearchParams({
                        status: "ALL",
                        projectId: projectFilter,
                        page: "0",
                        pending: "true",
                      });
                    } else {
                      setPendingOnly(false);
                      const restoreStatus = savedStatus || "ALL";
                      setSearchParams({
                        status: restoreStatus,
                        projectId: projectFilter,
                        page: "0",
                        pending: "false",
                      });
                    }
                  }}
                  disabled={isLoading}
                />
                미처리만
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || isFetching ? (
              // 로딩/패칭 중 스켈레톤 표시 (pageSize 만큼)
              Array.from({ length: pageSize }).map((_, i) => (
                <ApprovalRequestItemSkeleton key={i} />
              ))
            ) : isError ? (
              <div className="rounded border border-dashed py-12 text-center text-sm text-muted-foreground">
                승인 요청을 불러오지 못했습니다.
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded border border-dashed py-12 text-center text-sm text-muted-foreground">
                선택한 상태의 승인 요청이 없습니다.
              </div>
            ) : (
              filteredRequests.map((request: StepRequestSummaryResponse) => {
                const projectLabel =
                  (request as { projectName?: string; project?: { name?: string } }).projectName ||
                  (request as { project?: { name?: string } }).project?.name ||
                  "프로젝트";
                const phaseCode =
                  (request as { phase?: string }).phase ||
                  (request as { phaseName?: string; stepPhase?: string }).phaseName ||
                  (request as { stepPhase?: string }).stepPhase ||
                  "";
                const phaseLabel = phaseLabelMap[phaseCode] || phaseCode || "-";
                const requesterLabel = request.requestedByName || "요청자";
                const stepLabel = request.stepTitle || "단계";
                const requestedDate = formatDateTime(request.updatedAt ?? request.createdAt);
                const statusBadge = stepRequestStatusMap[request.status];
                const projectId = (request as { projectId?: number }).projectId;

                return (
                  <div
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(
                        `/project/${projectId}/approvals/${request.id}?from=approval-requests&status=${statusFilter}&page=${currentPage}`
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(
                          `/project/${projectId}/approvals/${request.id}?from=approval-requests&status=${statusFilter}&page=${currentPage}`
                        );
                      }
                    }}
                    className="rounded-xl border p-4 sm:p-5 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <div className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="bg-muted text-foreground border-slate-200">
                          {projectLabel}
                        </Badge>
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-100">
                          {phaseLabel}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold leading-6 text-foreground line-clamp-2 break-words">{request.title}</p>
                      <Badge
                        className={cn(
                          statusBadge?.className ?? "bg-slate-100 text-slate-700",
                          "hover:bg-[inherit] hover:text-[inherit] hover:border-current/0"
                        )}
                      >
                        {statusBadge?.label ?? request.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 whitespace-normal break-keep">
                      <span className="font-medium text-foreground/80">{requesterLabel}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{stepLabel}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{requestedDate}</span>
                    </div>
                  </div>
                );
              })
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-sm text-muted-foreground disabled:opacity-50"
                onClick={() => setSearchParams({ status: statusFilter, page: String(Math.max(0, page - 1)), projectId: projectFilter, pending: pendingOnly ? "true" : "false" })}
                disabled={currentPage === 0 || isLoading || isFetching}
              >
                이전
              </button>
              <span className="text-xs text-muted-foreground">
                {totalPages > 0 ? currentPage + 1 : 0} / {totalPages}
              </span>
              <button
                type="button"
                className="text-sm text-muted-foreground disabled:opacity-50"
                onClick={() =>
                  setSearchParams({
                    status: statusFilter,
                    page: String(currentPage + 1 < totalPages ? currentPage + 1 : currentPage),
                    projectId: projectFilter,
                    pending: pendingOnly ? "true" : "false",
                  })
                }
                disabled={currentPage + 1 >= totalPages || isLoading || isFetching}
              >
                다음
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}