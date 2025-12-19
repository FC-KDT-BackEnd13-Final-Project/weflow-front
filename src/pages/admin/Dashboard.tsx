import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  FolderKanban,
  UserPlus,
  Building,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "@/apis/api";
import {
  ActionType,
  TargetTable,
  actionTypeLabels,
  targetTableLabels,
} from "@/constants/logs";
// =========================================================================
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md dark:bg-gray-700 ${className}`} />
);

interface DashboardResponse {
  totalUsers: number;
  totalCompanies: number;
  totalProjects: number;
  recentLogs: Array<{
    logId: number;
    actionType: ActionType;
    targetTable: TargetTable;
    targetId: number;
    ipAddress: string;
    createdAt: string;
    userId: number;
    userName: string;
    projectId: number | null;
    projectName: string | null;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<{
    totalUsers?: number;
    totalCompanies?: number;
    totalProjects?: number;
  }>({});

  // 초기 상태를 null로 설정하여 로딩 중임을 명확히 표시
  const [recentLogs, setRecentLogs] =
    useState<DashboardResponse["recentLogs"] | null>(null);

  // 초기 상태를 null로 설정하여 로딩 중임을 명확히 표시
  const [adminName, setAdminName] = useState<string | null>(null);


  const isStatsLoading = stats.totalUsers === undefined;
  const isLogsLoading = recentLogs === null;

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        const response = await api.get("/api/admin/dashboard", {
          signal: controller.signal,
        });
        const data: DashboardResponse | undefined =
          response.data?.data;

        if (!data) return;

        setStats({
          totalUsers: data.totalUsers,
          totalCompanies: data.totalCompanies,
          totalProjects: data.totalProjects,
        });

        setRecentLogs(data.recentLogs);
      } catch {
        // 의도적으로 무시
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, []);


  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/users/me", {
          signal: controller.signal,
        });
        const name = response.data?.data?.name;
        if (typeof name === "string") {
          setAdminName(name);
        }
      } catch {
        // ignore
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, []);

  const statsCards = useMemo(
    () => [
      {
        title: "전체 회원 수",
        value:
          typeof stats.totalUsers === "number"
            ? `${stats.totalUsers.toLocaleString()}명`
            : null,
        icon: Users,
        color: "bg-purple-100 text-purple-600",
        link: "/admin/members",
      },
      {
        title: "등록된 회사 수",
        value:
          typeof stats.totalCompanies === "number"
            ? `${stats.totalCompanies.toLocaleString()}개`
            : null,
        icon: Building2,
        color: "bg-pink-100 text-pink-600",
        link: "/admin/companies",
      },
      {
        title: "전체 프로젝트",
        value:
          typeof stats.totalProjects === "number"
            ? `${stats.totalProjects.toLocaleString()}개`
            : null,
        icon: FolderKanban,
        color: "bg-blue-100 text-blue-600",
        link: "/admin/projects",
      },
    ],
    [stats]
  );

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between min-h-[56px]">
        <div>
          <p className="text-sm text-muted-foreground">
            {/* 1. Admin Name Skeleton */}
            {adminName === null ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${adminName}님 환영합니다`
            )}
          </p>

          <h1 className="text-3xl font-bold">관리자</h1>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="border-2 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(stat.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title} {/* 제목은 로딩 없이 바로 표시 */}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" /> {/* 아이콘도 로딩 없이 바로 표시 */}
              </div>
            </CardHeader>
            <CardContent>
              {/* 수치 데이터는 로딩 중일 때 스켈레톤, 아니면 값 표시 */}
              <div className="text-3xl font-bold min-h-[36px]">
                {isStatsLoading ? (
                  <Skeleton className="h-9 w-1/2" />
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 활동 로그 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            최근 활동 로그
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => navigate("/admin/logs")}
          >
            + 전체 로그 보기
          </Button>
        </CardHeader>

        <CardContent>
          {/* 3. Recent Logs Skeleton */}
          {isLogsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 py-2">
                  <Skeleton className="h-5 w-24 shrink-0" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* 데이터 로드 완료 후 (로그 없음) */}
          {!isLogsLoading && recentLogs.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              최근 로그가 없습니다.
            </div>
          )}

          {/* 데이터 로드 완료 후 (로그 있음) */}
          {!isLogsLoading && recentLogs.length > 0 && (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.logId}
                  className="flex items-start gap-3 py-2"
                >
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0"
                  >
                    {formatTime(log.createdAt)}
                  </Badge>
                  <p className="text-sm">
                    <span className="font-medium">
                      {log.userName ?? "알 수 없음"}님이{" "}
                    </span>
                    <span className="font-medium">
                      {targetTableLabels[log.targetTable] ??
                        log.targetTable}
                    </span>
                    을/를{" "}
                    {actionTypeLabels[log.actionType] ??
                      log.actionType}
                    하였습니다.
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 작업 (이 섹션은 정적 데이터이므로 스켈레톤 불필요) */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-info" />
            빠른 작업
          </CardTitle>
          <CardDescription>
            자주 사용하는 기능을 빠르게 실행하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/members/create")}
            >
              <UserPlus className="h-4 w-4" />
              회원 생성
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/companies/create")}
            >
              <Building className="h-4 w-4" />
              회사 추가
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/projects/create")}
            >
              <FileText className="h-4 w-4" />
              프로젝트 생성
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;