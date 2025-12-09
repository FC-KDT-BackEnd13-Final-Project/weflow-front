import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusType } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ProjectStatus,
  fetchProjectDetail
} from "@/apis/projects";

import {
  fetchProjectSteps,
  StepResponse,
  StepStatus,
} from "@/apis/steps";

const statusLabelMap: Record<ProjectStatus, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행중",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
  CLOSED: "종료",
};

const stepStatusLabelMap: Record<StepStatus, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
};

const stepStatusToBadgeStatus: Record<StepStatus, StatusType> = {
  PENDING: "pending",
  IN_PROGRESS: "progress",
  COMPLETED: "complete",
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number(id) : null;

  const [activeTab, setActiveTab] = useState("steps");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [project, setProject] = useState<Awaited<ReturnType<typeof fetchProjectDetail>> | null>(null);
  const [steps, setSteps] = useState<StepResponse[]>([]);
  const [stepLoading, setStepLoading] = useState(true);

  // 날짜 포맷터
  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  /* -------------------------------------------------------
     1) 프로젝트 상세 로딩
  ------------------------------------------------------- */
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await fetchProjectDetail(projectId);
        setProject(detail);
      } catch (err) {
        setError("프로젝트 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  /* -------------------------------------------------------
     2) 프로젝트 단계(Steps) 로딩
  ------------------------------------------------------- */
  useEffect(() => {
    if (!projectId) return;

    const loadSteps = async () => {
      try {
        setStepLoading(true);
        const data = await fetchProjectSteps(projectId);
        setSteps(data);
      } catch (err) {
        console.error(err);
      } finally {
        setStepLoading(false);
      }
    };

    loadSteps();
  }, [projectId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {project?.name ?? "프로젝트 상세"}
              </h1>

              {project && (
                <StatusBadge status="progress">
                  {statusLabelMap[project.status]}
                </StatusBadge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {project?.description ?? "프로젝트 상세 정보를 확인하세요"}
            </p>
          </div>
        </div>

        {/* 로딩 / 에러 */}
        {loading && (
          <Card>
            <CardContent className="p-6 text-muted-foreground">불러오는 중...</CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardContent className="p-6 text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* 프로젝트 정보 요약 카드 */}
        {!loading && !error && project && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">상태</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statusLabelMap[project.status]}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">시작일</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-status-complete" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(project.startDate)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">종료 예정</CardTitle>
                <AlertCircle className="h-4 w-4 text-status-pending" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(project.endDateExpected)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 탭 UI ---------------------------------------------- */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="steps">단계 관리</TabsTrigger>
            <TabsTrigger value="board">게시판</TabsTrigger>
            <TabsTrigger value="team">팀원</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          {/* ---------------- Steps 탭 ---------------- */}
          <TabsContent value="steps" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">프로젝트 단계</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                단계 추가
              </Button>
            </div>

            {/* 단계 로딩 */}
            {stepLoading && (
              <Card>
                <CardContent className="p-4 text-muted-foreground">
                  단계 정보를 불러오는 중...
                </CardContent>
              </Card>
            )}

            {/* 단계 없음 */}
            {!stepLoading && steps.length === 0 && (
              <Card>
                <CardContent className="p-4 text-muted-foreground text-center">
                  단계가 없습니다.
                </CardContent>
              </Card>
            )}

            {/* 단계 리스트 */}
            {!stepLoading &&
              steps.map((step) => (
                <Card key={step.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <StatusBadge status={stepStatusToBadgeStatus[step.status]}>
                          {stepStatusLabelMap[step.status]}
                        </StatusBadge>

                        <div className="flex-1">
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description ?? ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">담</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* ---------------- Board 탭 ---------------- */}
          <TabsContent value="board" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">게시판</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                글 작성
              </Button>
            </div>
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">게시판 연동 예정</CardTitle>
                <CardDescription>향후 게시판 데이터가 연동됩니다.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* ---------------- Team 탭 ---------------- */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">참여 팀원</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                팀원 초대
              </Button>
            </div>
            <Card className="card-hover">
              <CardContent className="p-4">팀원 데이터 연동 예정</CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- Settings 탭 ---------------- */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">설정</CardTitle>
                <CardDescription>추후 프로젝트 설정이 추가됩니다.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
