import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Calendar, User, Layers3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

const stageFlow = [
  { label: "요구사항 정의", status: "done" },
  { label: "화면 설계", status: "in-progress" },
  { label: "디자인", status: "pending" },
  { label: "퍼블리싱", status: "pending" },
  { label: "개발", status: "pending" },
  { label: "검수", status: "pending" },
];

const approvals = [
  { title: "요구사항 정의", status: "완료", color: "bg-emerald-100 text-emerald-700", desc: "11.12 승인" },
  { title: "화면 설계", status: "진행중", color: "bg-blue-100 text-blue-700", desc: "승인 요청 1건" },
  { title: "디자인", status: "대기", color: "bg-slate-200 text-slate-700", desc: "예정 12월 초" },
];

const activities = [
  { id: 1, content: "김지현님이 화면 설계 피드백을 남겼습니다.", time: "오늘 오전 10:12" },
  { id: 2, content: "홍길동님이 요구사항 정의 단계를 승인했습니다.", time: "어제 오후 4:37" },
  { id: 3, content: "디자인 킥오프 회의록이 업로드되었습니다.", time: "11.21 13:02" },
];

const stepRequests = [
  {
    id: 501,
    title: "디자인 시안 승인 요청드립니다",
    status: "REQUESTED",
    requestedBy: { name: "김서현", role: "디자이너" },
    createdAt: "2025-02-05T11:00:00"
  },
  {
    id: 502,
    title: "퍼블리싱 결과물 승인 요청",
    status: "APPROVED",
    requestedBy: { name: "박고객", role: "CUSTOMER" },
    createdAt: "2025-02-04T16:30:00"
  },
  {
    id: 503,
    title: "테스트 시나리오 승인 요청",
    status: "REJECTED",
    requestedBy: { name: "이개발", role: "QA" },
    createdAt: "2025-02-02T09:45:00"
  }
];

const requestStatusMap: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "승인 대기", className: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "승인 완료", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-700" }
};

const formatRequestDate = (dateString: string) =>
  new Date(dateString).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-900 border border-slate-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-wider text-slate-500">프로젝트 #{id}</p>
                <h1 className="text-3xl font-semibold mt-2">{projectInfo.name}</h1>
                <p className="text-sm text-slate-600 mt-1">{projectInfo.plan}</p>
              </div>
              <Badge className="bg-sky-100 text-sky-700 text-xs px-3 py-1 rounded-full">
                현재 단계 · {projectInfo.currentStage}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">남은 기간</p>
                  <p className="font-medium">{projectInfo.daysLeft}일 · {projectInfo.dueDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">PM</p>
                  <p className="font-medium">{projectInfo.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Layers3 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">고객사</p>
                  <p className="font-medium">{projectInfo.client}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">다음 승인 대상</p>
                  <p className="font-medium">{projectInfo.nextApproval}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">전체 진행률</p>
            <Progress value={projectInfo.progress} className="h-2 bg-slate-200" />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{projectInfo.progress}% 완료</span>
              <span>업무 안정 권장 80%</span>
            </div>
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
              <div className="text-2xl font-bold">{projectInfo.progress}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">완료된 단계</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-complete" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 / 6</div>
              <p className="text-xs text-muted-foreground mt-1">화면 설계 단계 진행중</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">남은 기간</CardTitle>
              <AlertCircle className="h-4 w-4 text-status-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectInfo.daysLeft}일</div>
              <p className="text-xs text-muted-foreground mt-1">{projectInfo.dueDate} 마감</p>
            </CardContent>
          </Card>
        </div>

        {/* Stage Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">단계 진행 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-6">
                {stageFlow.map(stage => (
                  <div
                    key={stage.label}
                    className={cn(
                      "rounded-xl border p-3 text-center text-sm",
                      stage.status === "done" && "bg-emerald-50 border-emerald-100 text-emerald-800",
                      stage.status === "in-progress" && "bg-blue-50 border-blue-100 text-blue-700 ring-1 ring-blue-200",
                      stage.status === "pending" && "bg-muted border-dashed text-muted-foreground"
                    )}
                  >
                    <p className="font-semibold">{stage.label}</p>
                    <p className="text-xs mt-1">
                      {stage.status === "done" && "완료"}
                      {stage.status === "in-progress" && "진행중"}
                      {stage.status === "pending" && "대기"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-1">
                <Card className="bg-muted/60 border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">승인 단계 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {approvals.map((approval) => (
                      <div key={approval.title} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{approval.title}</p>
                          <p className="text-xs text-muted-foreground">{approval.desc}</p>
                        </div>
                        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", approval.color)}>
                          {approval.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Requests */}
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
            {stepRequests.map((request) => {
              const status = requestStatusMap[request.status] || requestStatusMap.REQUESTED;
              return (
                <div
                  key={request.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/project/${id}/approvals/${request.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/project/${id}/approvals/${request.id}`);
                    }
                  }}
                  className="rounded-lg border bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">{request.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.requestedBy.name} ({request.requestedBy.role}) · {formatRequestDate(request.createdAt)}
                      </p>
                    </div>
                    <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", status.className)}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {stepRequests.length === 0 && (
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
            <button
              className="text-sm text-primary flex items-center gap-1"
              onClick={() => navigate(`/project/${id}/history`)}
            >
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
    </ProjectLayout>
  );
}
