import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Bell, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "@/apis/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/stores/user";

declare global {
  interface Window {
    Chart?: any;
  }
}

const chartJsCdnUrl = "https://cdn.jsdelivr.net/npm/chart.js";
let chartScriptPromise: Promise<void> | null = null;

const loadChartJs = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Chart) return Promise.resolve();
  if (chartScriptPromise) return chartScriptPromise;

  chartScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${chartJsCdnUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = chartJsCdnUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return chartScriptPromise;
};

interface SummaryChartProps {
  labels: string[];
  values: number[];
}

function SummaryChart({ labels, values }: SummaryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        await loadChartJs();
        if (!isMounted || !canvasRef.current || !window.Chart) return;
        const Chart = window.Chart;

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(canvasRef.current, {
          type: "doughnut",
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: ["#4C6FFF", "#22C55E", "#F97316"],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                },
              },
            },
          },
        });
      } catch (error) {
        console.error("Chart.js 로딩 실패:", error);
      }
    };

    renderChart();
    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [labels, values]);

  return <canvas ref={canvasRef} className="mx-auto max-w-[280px]" />;
}

interface DashboardImportantProject {
  projectId: number;
  name: string;
  status: string;
  progress?: number;
}

interface DashboardApproval {
  id: number;
  title: string;
  projectId?: number;
  projectName?: string;
  stepTitle?: string;
  stepId?: number;
  phase?: string;
  createdAt?: string;
}

interface DashboardNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetUrl?: string;
}

interface DashboardSummary {
  inProgressProjectCount: number;
  unreadNotificationCount: number;
  pendingApprovalCount: number;
  importantProjects: DashboardImportantProject[];
  upcomingApprovals: DashboardApproval[];
  recentNotifications: DashboardNotification[];
}

const statusProgressMap: Record<string, number> = {
  CONTRACT: 10,
  IN_PROGRESS: 50,
  DELIVERY: 80,
  MAINTENANCE: 90,
  CLOSED: 100,
};

const formatDateLabel = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const SummarySkeleton = () => (
  <div className="flex flex-col items-center gap-4 w-full">
    <Skeleton className="mx-auto w-[280px] h-[150px] rounded-full" />
    <div className="grid gap-2 text-sm w-full sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-md border p-3">
          <Skeleton className="h-3 w-3/4 mb-1" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ))}
    </div>
  </div>
);

const ProjectItemSkeleton = () => (
  <div className="flex flex-col gap-3 rounded-lg border p-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-5 w-1/6" />
    </div>
    <Skeleton className="h-2 w-full" />
    <Skeleton className="h-3 w-1/4" />
  </div>
);

const ApprovalItemSkeleton = () => (
  <div className="rounded border p-3 text-sm">
    <Skeleton className="h-5 w-full mb-1" />
    <Skeleton className="h-4 w-1/2 mt-1" />
    <div className="mt-2 flex items-center justify-between text-xs">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

const NotificationItemSkeleton = () => (
  <div className="rounded border p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-3 w-1/5 mt-2" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userRole = useUserStore((s) => s.user?.role);

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [mutatingNotificationIds, setMutatingNotificationIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (userRole === "SYSTEM_ADMIN") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === "SYSTEM_ADMIN") return;

    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        setIsLoadingDashboard(true);
        setDashboardError(null);
        const response = await api.get("/api/dashboard/me", { signal: controller.signal });
        const data = response.data?.data;
        if (!data) {
          throw new Error("대시보드 정보를 찾을 수 없습니다.");
        }
        const formatted: DashboardSummary = {
          inProgressProjectCount: data.inProgressProjectCount ?? 0,
          unreadNotificationCount: data.unreadNotificationCount ?? 0,
          pendingApprovalCount: data.pendingApprovalCount ?? 0,
          importantProjects: Array.isArray(data.importantProjects)
            ? data.importantProjects.map((project: any) => ({
              projectId: project.projectId,
              name: project.name,
              status: project.status,
              progress:
                typeof project.progress === "number"
                  ? project.progress
                  : statusProgressMap[project.status] ?? undefined,
            }))
            : [],
          upcomingApprovals: Array.isArray(data.upcomingApprovals)
            ? data.upcomingApprovals.map((approval: any) => ({
              id: approval.id,
              title: approval.title,
              projectId: approval.projectId ?? approval.project?.id,
              projectName: approval.projectName ?? approval.project?.name,
              stepTitle: approval.stepTitle,
              stepId: approval.stepId,
              phase: approval.phase,
              createdAt: approval.createdAt ?? approval.requestedAt ?? approval.created_at,
            }))
            : [],
          recentNotifications: Array.isArray(data.recentNotifications)
            ? data.recentNotifications.map((notice: any) => ({
              id: notice.id,
              title: notice.title,
              message: notice.message ?? notice.content ?? "",
              createdAt: notice.createdAt,
              read: Boolean(notice.read),
              targetUrl: notice.target?.url,
            }))
            : [],
        };
        setDashboardData(formatted);
        setNotifications(formatted.recentNotifications);
      } catch (error) {
        if (!controller.signal.aborted) {
          setDashboardError("대시보드 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDashboard(false);
        }
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, [userRole]);

  const stats = useMemo(
    () => [
      {
        label: "진행 중 프로젝트",
        value: dashboardData?.inProgressProjectCount ?? 0,
        description: "현재 진행 중인 프로젝트 수",
      },
      {
        label: "대기 중 승인",
        value: dashboardData?.pendingApprovalCount ?? 0,
        description: "승인 담당자 확인 필요",
      },
      {
        label: "읽지 않은 알림",
        value: dashboardData?.unreadNotificationCount ?? 0,
        description: "확인하지 않은 알림 수",
      },
    ],
    [dashboardData]
  );

  const importantProjects = dashboardData?.importantProjects ?? [];
  const approvals = dashboardData?.upcomingApprovals ?? [];
  const chartDataset = useMemo(
    () => ({
      labels: ["진행 프로젝트", "읽지 않은 알림", "승인 대기"],
      values: [
        dashboardData?.inProgressProjectCount ?? 0,
        dashboardData?.unreadNotificationCount ?? 0,
        dashboardData?.pendingApprovalCount ?? 0,
      ],
    }),
    [dashboardData]
  );
  const isNotificationMutating = (id: number) => mutatingNotificationIds.has(id);

  const setNotificationMutating = (id: number, active: boolean) => {
    setMutatingNotificationIds((prev) => {
      const next = new Set(prev);
      if (active) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const updateUnreadCount = (prevCount: number, wasRead: boolean, willBeRead: boolean) => {
    let next = prevCount;
    if (wasRead && !willBeRead) {
      next += 1;
    } else if (!wasRead && willBeRead) {
      next = Math.max(0, next - 1);
    }
    return next;
  };

  const changeNotificationReadState = async (
    notification: DashboardNotification,
    nextRead: boolean
  ) => {
    if (notification.read === nextRead) return;
    setNotificationMutating(notification.id, true);
    try {
      await api.patch(`/api/notifications/${notification.id}/${nextRead ? "read" : "unread"}`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: nextRead } : item
        )
      );
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadNotificationCount: updateUnreadCount(
            prev.unreadNotificationCount,
            notification.read,
            nextRead
          ),
          recentNotifications: prev.recentNotifications.map((item) =>
            item.id === notification.id ? { ...item, read: nextRead } : item
          ),
        };
      });
    } catch {
      toast({
        title: "알림 상태 변경 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setNotificationMutating(notification.id, false);
    }
  };

  const handleDeleteNotification = async (event: React.MouseEvent, notification: DashboardNotification) => {
    event.stopPropagation();
    setNotificationMutating(notification.id, true);
    try {
      await api.delete(`/api/notifications/${notification.id}`);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadNotificationCount: notification.read
            ? prev.unreadNotificationCount
            : Math.max(0, prev.unreadNotificationCount - 1),
          recentNotifications: prev.recentNotifications.filter(
            (item) => item.id !== notification.id
          ),
        };
      });
      toast({
        title: "알림이 삭제되었습니다.",
      });
    } catch {
      toast({
        title: "알림 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setNotificationMutating(notification.id, false);
    }
  };

  const handleNotificationClick = (notification: DashboardNotification) => {
    if (!notification.read) {
      void changeNotificationReadState(notification, true);
    }
    navigate(`/notifications/${notification.id}`);
  };

  if (userRole === "SYSTEM_ADMIN") {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">DashBoard</h1>
          </div>
          <p className="text-muted-foreground text-sm">조직에 속한 프로젝트 전체 현황과 승인, 리소스를 한눈에 확인하세요.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>업무 현황 요약</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isLoadingDashboard ? (
              <SummarySkeleton />
            ) : (
              <>
                <SummaryChart labels={chartDataset.labels} values={chartDataset.values} />
                <div className="grid gap-2 text-sm w-full sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">진행 중 프로젝트</p>
                    <p className="text-lg font-semibold">{chartDataset.values[0]}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">읽지 않은 알림</p>
                    <p className="text-lg font-semibold">{chartDataset.values[1]}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground text-xs">승인 대기</p>
                    <p className="text-lg font-semibold">{chartDataset.values[2]}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>중요 프로젝트</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
                전체 보기
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingDashboard ? (
                Array.from({ length: 3 }).map((_, i) => <ProjectItemSkeleton key={i} />)
              ) : dashboardError ? (
                <div className="py-6 text-center text-sm text-muted-foreground">{dashboardError}</div>
              ) : importantProjects.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">표시할 프로젝트가 없습니다.</div>
              ) : (
                importantProjects.map((project) => (
                  <div
                    key={project.projectId}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/project/${project.projectId}/dashboard`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/project/${project.projectId}/dashboard`);
                      }
                    }}
                    className="flex flex-col gap-3 rounded-lg border p-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{project.name}</p>
                      </div>
                      <Badge variant="outline">{project.status ?? "확인 필요"}</Badge>
                    </div>
                    {typeof project.progress === "number" ? (
                      <>
                        <Progress value={project.progress} />
                        <div className="text-xs text-muted-foreground">진행률 {project.progress}%</div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">진행률 정보 없음</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>승인 대기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingDashboard ? (
                Array.from({ length: 2 }).map((_, i) => <ApprovalItemSkeleton key={i} />)
              ) : dashboardError ? (
                <div className="py-6 text-center text-sm text-muted-foreground">{dashboardError}</div>
              ) : approvals.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">예정된 승인 요청이 없습니다.</div>
              ) : (
                approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded border p-3 text-sm cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      approval.projectId
                        ? navigate(`/project/${approval.projectId}/approvals/${approval.id}`)
                        : undefined
                    }
                  >
                    <p className="text-base font-semibold leading-6 text-foreground line-clamp-2 break-words">
                      {approval.title}
                    </p>
                    <div className="mt-1 text-sm text-foreground font-medium">
                      {approval.projectName ?? "프로젝트 정보 없음"}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="inline-block h-3 w-3" />
                        {approval.createdAt ? formatDateLabel(approval.createdAt) : "-"}
                      </span>
                      <span className="text-foreground/80">{approval.stepTitle ?? "단계 미정"}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoadingDashboard ? (
                Array.from({ length: 4 }).map((_, i) => <NotificationItemSkeleton key={i} />)
              ) : notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border rounded">
                  새로운 알림이 없습니다.
                </div>
              ) : (
                notifications.map((notice) => (
                  <div
                    key={notice.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notice)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNotificationClick(notice);
                      }
                    }}
                    className={`rounded border p-3 cursor-pointer transition hover:border-primary/40 hover:bg-muted/50 ${notice.read ? "bg-muted/40" : ""
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium">{notice.title}</p>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{notice.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDateLabel(notice.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={
                            notice.read
                              ? "border-gray-200 text-muted-foreground bg-transparent"
                              : "border-primary/40 text-primary bg-primary/5"
                          }
                        >
                          {notice.read ? "읽음" : "읽지 않음"}
                        </Badge>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                          onClick={(event) => handleDeleteNotification(event, notice)}
                          disabled={isNotificationMutating(notice.id)}
                          aria-label="알림 삭제"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}