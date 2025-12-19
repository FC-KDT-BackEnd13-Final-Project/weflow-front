import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Layers3,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/apis/api";

interface RecentApproval {
  id: number;
  title: string;
  status: string;
  requestedByName?: string;
  requestedByRole?: string;
  requestedBy?: {
    name: string;
    role?: string;
  };
  createdAt?: string;
  stepId?: number;
  stepTitle?: string;
  hasAttachment?: boolean;
  decidedAt?: string | null;
}

interface RecentActivity {
  logId: number;
  actionType: string;
  targetTable: string;
  targetId: number;
  createdAt: string;
  userId?: number;
  userName?: string;
  projectName?: string;
}

interface ProjectDashboardData {
  projectId: number;
  name: string;
  customerCompanyName?: string;
  adminName?: string;
  status?: string;
  progressPercent?: number;
  totalSteps?: number;
  completedSteps?: number;
  currentStepTitle?: string;
  nextApprovalStepTitle?: string;
  endDate?: string;
  daysLeft?: number;
  recentApprovals?: RecentApproval[];
  recentActivities?: RecentActivity[];
}

const requestStatusMap: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "승인 대기", className: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "승인 완료", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-700" },
  CANCELED: { label: "취소", className: "bg-slate-100 text-slate-600" },
};

const formatRequestDate = (dateString: string) =>
  new Date(dateString).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const actionTypeLabels: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  APPROVE: "승인",
  REJECT: "반려",
  UPLOAD: "업로드",
  DOWNLOAD: "다운로드",
  REMOVE: "삭제",
  SUBMIT: "제출",
};

const targetTableLabels: Record<string, string> = {
  POST: "게시글",
  POST_ANSWER: "게시글 답변",
  COMMENT: "댓글",
  PROJECT: "프로젝트",
  PROJECT_MEMBER: "프로젝트 멤버",
  USER: "회원",
  COMPANY: "회사",
  CHECKLIST: "체크리스트",
  CHECKLIST_QUESTION: "체크리스트 질문",
  CHECKLIST_OPTION: "체크리스트 옵션",
  ATTACHMENT: "첨부파일",
  STEP: "단계",
  STEP_REQUEST: "단계 승인 요청",
  STEP_RESPONSE: "단계 승인 응답",
  TEMPLATE: "템플릿",
};

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ProjectDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await api.get(`/api/projects/${id}/dashboard`, {
          signal: controller.signal,
        });
        setDashboard(response.data?.data ?? null);
      } catch {
        if (!controller.signal.aborted) {
          setFetchError("프로젝트 대시보드를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, [id]);

  const projectInfo = useMemo(() => {
    if (!dashboard) {
      return {
        name: "",
        plan: "",
        currentStage: "",
        progress: 0,
        dueDate: "",
        daysLeft: 0,
        owner: "",
        client: "",
        nextApproval: "",
      };
    }

    return {
      name: dashboard.name,
      plan: dashboard.status ? `현재 상태 ${dashboard.status}` : "",
      currentStage: dashboard.currentStepTitle ?? "",
      progress: dashboard.progressPercent ?? 0,
      dueDate: dashboard.endDate ? formatShortDate(dashboard.endDate) : "",
      daysLeft: dashboard.daysLeft ?? 0,
      owner: dashboard.adminName ?? "",
      client: dashboard.customerCompanyName ?? "",
      nextApproval: dashboard.nextApprovalStepTitle ?? "",
    };
  }, [dashboard]);

  const recentApprovals = dashboard?.recentApprovals ?? [];
  const activities = dashboard?.recentActivities ?? [];

  const formatActivityTime = (value?: string) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-900 border border-slate-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-wider text-slate-500">
                  프로젝트 #{id}
                </p>
                <h1 className="text-3xl font-semibold mt-2">
                  {isLoading ? <Skeleton className="h-9 w-64" /> : projectInfo.name || "프로젝트 정보 없음"}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {isLoading ? <Skeleton className="h-4 w-48" /> : projectInfo.plan}
                </p>
              </div>
              <Badge className="bg-sky-100 text-sky-700 text-xs px-3 py-1 rounded-full">
                현재 단계 ·{" "}
                {isLoading ? <Skeleton className="inline-block h-4 w-20" /> : projectInfo.currentStage || "종료"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">종료일</p>
                  <p className="font-medium">
                    {isLoading ? <Skeleton className="h-4 w-20" /> : projectInfo.dueDate || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">관리자</p>
                  <p className="font-medium">
                    {isLoading ? <Skeleton className="h-4 w-20" /> : projectInfo.owner || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Layers3 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">고객사</p>
                  <p className="font-medium">
                    {isLoading ? <Skeleton className="h-4 w-20" /> : projectInfo.client || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">다음 승인 대상</p>
                  <p className="font-medium">
                    {isLoading ? <Skeleton className="h-4 w-20" /> : projectInfo.nextApproval || "없음"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-slate-600 mb-2">전체 진행률</p>
            <Progress value={projectInfo.progress} className="h-2 bg-slate-200" />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>
                {isLoading ? <Skeleton className="h-3 w-16" /> : `${projectInfo.progress}% 완료`}
              </span>
            </div>
            {fetchError && (
              <p className="text-xs text-destructive mt-2">{fetchError}</p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">전체 진행률</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${projectInfo.progress}%`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">완료된 단계</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-complete" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `${dashboard?.completedSteps ?? 0} / ${dashboard?.totalSteps ?? 0}`
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? (
                  <Skeleton className="h-3 w-32" />
                ) : projectInfo.currentStage ? (
                  `${projectInfo.currentStage} 단계 진행중`
                ) : (
                  "단계 정보를 확인하세요"
                )}
              </p>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">남은 기간</CardTitle>
              <AlertCircle className="h-4 w-4 text-status-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : projectInfo.daysLeft ? `${projectInfo.daysLeft}일` : "0일"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? (
                  <Skeleton className="h-3 w-28" />
                ) : projectInfo.dueDate ? (
                  `${projectInfo.dueDate} 마감`
                ) : (
                  "마감일 미정"
                )}
              </p>

            </CardContent>
          </Card>
        </div>

        {/* 최근 승인 요청 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 승인 요청</CardTitle>
            <button
              className="text-sm text-primary flex items-center gap-1"
              onClick={() => navigate(`/project/${id}/approvals`)}
            >
              더보기 <ArrowRight className="h-4 w-4" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}

            {!isLoading &&
              recentApprovals.map((request) => {
                const status =
                  requestStatusMap[request.status] ||
                  requestStatusMap.REQUESTED;
                const requesterName =
                  request.requestedBy?.name ??
                  request.requestedByName ??
                  "담당자";
                const requesterRole =
                  request.requestedBy?.role ?? request.requestedByRole ?? "";

                return (
                  <div
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/project/${id}/approvals/${request.id}`)
                    }
                    className="rounded-lg border bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">{request.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requesterName}
                          {requesterRole && ` (${requesterRole})`} ·{" "}
                          {request.createdAt
                            ? formatRequestDate(request.createdAt)
                            : "-"}
                        </p>
                        {request.stepTitle && (
                          <p className="text-xs text-muted-foreground">
                            단계: {request.stepTitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold px-3 py-1 rounded-full",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}

            {!isLoading && recentApprovals.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                표시할 승인 요청이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">최근 활동</CardTitle>
              <p className="text-sm text-muted-foreground">
                프로젝트 구성원 소식
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}

            {!isLoading &&
              activities.map((activity) => (
                <div
                  key={activity.logId}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.userName ?? "사용자"}
                    </span>
                    님이{" "}
                    {targetTableLabels[activity.targetTable] ??
                      activity.targetTable}
                    을/를{" "}
                    {actionTypeLabels[activity.actionType] ??
                      activity.actionType}
                    했습니다.
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatActivityTime(activity.createdAt)}
                  </span>
                </div>
              ))}

            {!isLoading && activities.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-6 border rounded-lg">
                최근 활동이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
