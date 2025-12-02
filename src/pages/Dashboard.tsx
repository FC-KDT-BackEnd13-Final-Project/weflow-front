import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, FolderKanban, Layers3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const orgStats = [
  { label: "진행 중 프로젝트", value: 8, description: "이번 주 2건 신규" },
  { label: "대기 중 승인", value: 5, description: "승인 담당자 확인 필요" },
  { label: "활성 멤버", value: 32, description: "새 초대 3건" },
];

const highlightedProjects = [
  { id: 1, name: "ABC 리뉴얼", client: "ABC전자", progress: 62, status: "IN_PROGRESS" },
  { id: 2, name: "WeFlow 모바일", client: "비엔시스템", progress: 40, status: "PLANNING" },
  { id: 3, name: "AI PoC", client: "뉴텍", progress: 85, status: "APPROVAL" },
];

const upcomingApprovals = [
  { id: 501, title: "디자인 QA 승인", project: "ABC 리뉴얼", due: "02.12", step: "디자인" },
  { id: 502, title: "요구사항 동결", project: "WeFlow 모바일", due: "02.15", step: "요구사항" },
];

export default function Dashboard() {
  const navigate = useNavigate();

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

        <div className="grid gap-4 md:grid-cols-3">
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

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>중요 프로젝트</CardTitle>
              <Button variant="outline" size="sm">전체 보기</Button>
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

          <Card>
            <CardHeader>
              <CardTitle>다가오는 승인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingApprovals.map((approval) => (
                <div key={approval.id} className="rounded border p-3 text-sm">
                  <p className="font-medium">{approval.title}</p>
                  <p className="text-muted-foreground">{approval.project}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span><Calendar className="inline-block h-3 w-3 mr-1" />{approval.due}</span>
                    <span>{approval.step}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>리소스 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" /> 진행 중 프로젝트 8건
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> 외부 협력사 4곳 참여 중
              </div>
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" /> 활성 단계 12개, 보류 3개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded border p-3">
                디자인 QA 승인 요청이 반려되었습니다.
                <p className="text-xs text-muted-foreground mt-1">5분 전</p>
              </div>
              <div className="rounded border p-3">
                새로운 멤버 2명이 초대되었습니다.
                <p className="text-xs text-muted-foreground mt-1">30분 전</p>
              </div>
              <div className="rounded border p-3">
                퍼블리싱 단계 점검 일정이 업데이트되었습니다.
                <p className="text-xs text-muted-foreground mt-1">1시간 전</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
