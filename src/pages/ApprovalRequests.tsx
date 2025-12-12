import { useMemo } from "react";
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

export default function ApprovalRequests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") ?? "ALL";
  const statusFilter = (["ALL", "REQUESTED", "APPROVED", "REJECTED", "CHANGE_REQUESTED", "CANCELED"].includes(statusParam)
    ? statusParam
    : "ALL") as MyApprovalStatus;
  const pageParam = Number(searchParams.get("page") ?? 0);
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;
  const pageSize = 20;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["myApprovalRequests", statusFilter, page],
    queryFn: () => getMyApprovalRequests({ status: statusFilter as MyApprovalStatus, page, size: pageSize }),
  });

  const requests = useMemo(() => data?.data.stepRequestSummaryResponses ?? [], [data]);
  const totalCount = data?.data.totalCount ?? 0;
  const currentPage = data?.data.page ?? page;
  const size = data?.data.size ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / (size || pageSize)));

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => statusFilter === "ALL" || request.status === statusFilter);
  }, [requests, statusFilter]);

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
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  const nextStatus = value as MyApprovalStatus;
                  setSearchParams({ status: nextStatus, page: "0" });
                }}
              >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="REQUESTED">승인 대기</SelectItem>
                <SelectItem value="APPROVED">승인 완료</SelectItem>
                <SelectItem value="REJECTED">반려</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || isFetching ? (
              <div className="rounded border border-dashed py-12 text-center text-sm text-muted-foreground">
                승인 요청을 불러오는 중입니다...
              </div>
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
                const requestedDate = formatDateTime(request.createdAt);
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
                onClick={() => setSearchParams({ status: statusFilter, page: String(Math.max(0, page - 1)) })}
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
