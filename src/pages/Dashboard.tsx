import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, Bell, Calendar, CheckCircle2, Clock, Layers3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getProjectStepRequests } from "@/apis/stepRequest";
import { useNavigate, useParams } from "react-router-dom";

const projectInfo = {
  name: "WeFlow 플랫폼 고도화",
  plan: "웹/앱 통합 구축",
  currentStage: "화면 설계",
  progress: 62,
  dueDate: "2024.12.31",
  daysLeft: 41,
  owner: "홍길동 PM",
  client: "하이넥스트",
  nextApproval: "디자인",
};

const orgStats = [
  { label: "진행 중 프로젝트", value: 8, description: "이번 주 2건 신규" },
  { label: "대기 중 승인", value: 5, description: "승인 담당자 확인 필요" },
];

const highlightedProjects = [
  { id: 1, name: "ABC 리뉴얼", client: "ABC전자", progress: 62, status: "IN_PROGRESS" },
  { id: 2, name: "WeFlow 모바일", client: "비엔시스템", progress: 40, status: "PLANNING" },
  { id: 3, name: "AI PoC", client: "뉴텍", progress: 85, status: "APPROVAL" },
];

const upcomingApprovals = [
  { id: 1, title: "디자인 시안 승인", project: { id: 1, name: "ABC 리뉴얼" }, dueDate: "2025-02-12T10:00:00", step: "디자인" },
  { id: 2, title: "요구사항 검토", project: { id: 2, name: "WeFlow 모바일" }, dueDate: "2025-02-15T18:00:00", step: "요구사항" },
];

const recentNotifications = [
  {
    id: 1,
    title: "새 승인 요청",
    content: "화면설계서에 대한 승인 요청이 도착했습니다.",
    createdAt: "2025-02-10T10:30:00",
    targetUrl: "/project/3/approvals/15",
  },
  {
    id: 2,
    title: "새 댓글",
    content: "김고객님이 게시판에 댓글을 작성했습니다.",
    createdAt: "2025-02-09T09:00:00",
    targetUrl: "/project/3/board/42",
  },
  {
    id: 3,
    title: "승인 처리 완료",
    content: "디자인 시안 승인 요청이 승인되었습니다.",
    createdAt: "2025-02-08T16:20:00",
    targetUrl: "/project/3/approvals/15",
  },
];

const activities = [
  { id: 1, content: "김고객님이 게시판에 댓글을 작성했습니다.", time: "1시간 전" },
  { id: 2, content: "박퍼블리셔가 디자인 시안을 업데이트했습니다.", time: "3시간 전" },
  { id: 3, content: "승인 요청 2건이 신규로 생성되었습니다.", time: "오늘" },
];

const requestStatusMap: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "승인 요청", className: "bg-amber-100 text-amber-700" },
  CHANGE_REQUESTED: { label: "수정 요청", className: "bg-orange-100 text-orange-700" },
  APPROVED: { label: "승인", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-700" },
  CANCELED: { label: "요청 취소", className: "bg-slate-200 text-slate-700" },
};

const formatDateLabel = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatRequestDate = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["project-step-requests", projectId, "recent"],
    queryFn: () => getProjectStepRequests(projectId, 0, 5),
    enabled: !!projectId,
  });

  const stepRequests = requestsData?.stepRequestSummaryResponses ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">오늘의 현황</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">DashBoard</h1>
          </div>
          <p className="text-muted-foreground text-sm">조직에 속한 프로젝트 전체 현황과 승인, 리소스를 한눈에 확인하세요.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {orgStats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{stat.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>중요 프로젝트</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
                전체 보기
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlightedProjects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/project/${project.id}/dashboard`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/project/${project.id}/dashboard`);
                    }
                  }}
                  className="flex flex-col gap-3 rounded-lg border p-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <Progress value={project.progress} />
                  <div className="text-xs text-muted-foreground">진행률 {project.progress}%</div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>다가오는 승인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded border p-3 text-sm cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/project/${approval.project.id}/approvals/${approval.id}`)}
                >
                  <p className="font-medium">{approval.title}</p>
                  <p className="text-muted-foreground">{approval.project.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span><Calendar className="inline-block h-3 w-3 mr-1" />{formatDateLabel(approval.dueDate)}</span>
                    <span>{approval.step}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentNotifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border rounded">
                  새로운 알림이 없습니다.
                </div>
              ) : (
                recentNotifications.map((notice) => (
                  <div
                    key={notice.id}
                    className="rounded border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(notice.targetUrl)}
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium">{notice.title}</p>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{notice.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDateLabel(notice.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Approval Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 승인 요청</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">승인 요청을 불러오는 중입니다...</p>}
            {!isLoading && stepRequests.map((request) => {
              const status = requestStatusMap[request.status] || requestStatusMap.REQUESTED;
              return (
                <div key={request.id} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">{request.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.requestedByName || request.requestedBy || "요청자"} · {formatRequestDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!isLoading && stepRequests.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                표시할 승인 요청이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">최근 활동</CardTitle>
              <p className="text-sm text-muted-foreground">프로젝트 구성원 소식</p>
            </div>
            <button className="text-sm text-primary flex items-center gap-1">
              더보기 <ArrowRight className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-sm">{activity.content}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
