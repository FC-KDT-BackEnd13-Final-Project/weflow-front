import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, FolderKanban, UserPlus, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "@/apis/api";

type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "REMOVE"
  | "SUBMIT";

type TargetTable =
  | "POST"
  | "POST_ANSWER"
  | "COMMENT"
  | "PROJECT"
  | "PROJECT_MEMBER"
  | "USER"
  | "COMPANY"
  | "CHECKLIST"
  | "CHECKLIST_QUESTION"
  | "CHECKLIST_OPTION"
  | "ATTACHMENT"
  | "STEP"
  | "STEP_REQUEST"
  | "STEP_RESPONSE"
  | "TEMPLATE";

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
  REMOVE: "제거",
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
  STEP_REQUEST: "단계 요청",
  STEP_RESPONSE: "단계 응답",
  TEMPLATE: "템플릿",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProjects: 0,
  });
  const [recentLogs, setRecentLogs] = useState<DashboardResponse["recentLogs"]>([]);
  const [adminName, setAdminName] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/api/admin/dashboard", {
          signal: controller.signal,
        });
        const data: DashboardResponse = response.data?.data;
        setStats({
          totalUsers: data?.totalUsers ?? 0,
          totalCompanies: data?.totalCompanies ?? 0,
          totalProjects: data?.totalProjects ?? 0,
        });
        setRecentLogs(data?.recentLogs ?? []);
      } catch {
        // ignore errors for now
      }
    };
    fetchDashboard();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/users/me", { signal: controller.signal });
        const name = response.data?.data?.name;
        if (typeof name === "string") setAdminName(name);
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
        value: `${stats.totalUsers.toLocaleString()}명`,
        icon: Users,
        color: "bg-purple-100 text-purple-600",
        link: "/admin/members",
      },
      {
        title: "등록된 회사 수",
        value: `${stats.totalCompanies.toLocaleString()}개`,
        icon: Building2,
        color: "bg-pink-100 text-pink-600",
        link: "/admin/companies",
      },
      {
        title: "전체 프로젝트",
        value: `${stats.totalProjects.toLocaleString()}개`,
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {adminName ? `${adminName}님 환영합니다` : "관리자"}
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
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 활동 로그 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              최근 활동 로그
            </CardTitle>
          </div>
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
          <div className="space-y-3">
            {recentLogs.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                최근 로그가 없습니다.
              </div>
            )}
            {recentLogs.map((log) => (
              <div key={log.logId} className="flex items-start gap-3 py-2">
                <Badge variant="outline" className="text-xs shrink-0">
                  {formatTime(log.createdAt)}
                </Badge>
                <p className="text-sm">
                  <span className="font-medium">{log.userName ?? "알 수 없음"}님이 </span>
                  <span className="font-medium">
                    {targetTableLabels[log.targetTable] ?? log.targetTable}
                  </span>
                  을/를 {actionTypeLabels[log.actionType] ?? log.actionType}하였습니다.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-info" />
            빠른 작업
          </CardTitle>
          <CardDescription>자주 사용하는 기능을 빠르게 실행하세요</CardDescription>
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
