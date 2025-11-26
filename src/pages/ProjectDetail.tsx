import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockSteps = [
  {
    id: 1,
    name: "요구사항 분석",
    status: "complete" as const,
    dueDate: "2024.11.15",
    assignee: "김개발",
  },
  {
    id: 2,
    name: "디자인 시안",
    status: "progress" as const,
    dueDate: "2024.11.25",
    assignee: "이디자인",
  },
  {
    id: 3,
    name: "퍼블리싱",
    status: "pending" as const,
    dueDate: "2024.12.05",
    assignee: "박퍼블",
  },
];

const mockPosts = [
  {
    id: 1,
    title: "1차 디자인 시안 공유드립니다",
    author: "이디자인",
    date: "2024.11.20",
    comments: 3,
  },
  {
    id: 2,
    title: "요구사항 확인 부탁드립니다",
    author: "김개발",
    date: "2024.11.18",
    comments: 5,
  },
];

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("steps");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">쇼핑몰 리뉴얼 프로젝트</h1>
              <StatusBadge status="progress">진행중</StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1">ABC 커머스</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">진행률</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">65%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary w-[65%]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">완료된 단계</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-complete" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1 / 3</div>
              <p className="text-xs text-muted-foreground mt-1">2개 단계 진행중</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">남은 기간</CardTitle>
              <AlertCircle className="h-4 w-4 text-status-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">41일</div>
              <p className="text-xs text-muted-foreground mt-1">2024.12.31 마감</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="steps">단계 관리</TabsTrigger>
            <TabsTrigger value="board">게시판</TabsTrigger>
            <TabsTrigger value="team">팀원</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">프로젝트 단계</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                단계 추가
              </Button>
            </div>
            <div className="space-y-3">
              {mockSteps.map((step) => (
                <Card key={step.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <StatusBadge status={step.status}>
                          {step.status === "complete" && "완료"}
                          {step.status === "progress" && "진행중"}
                          {step.status === "pending" && "대기"}
                        </StatusBadge>
                        <div className="flex-1">
                          <h3 className="font-medium">{step.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            마감: {step.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {step.assignee[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{step.assignee}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="board" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">게시판</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                글 작성
              </Button>
            </div>
            <div className="space-y-3">
              {mockPosts.map((post) => (
                <Card key={post.id} className="card-hover cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{post.title}</CardTitle>
                    <CardDescription>
                      {post.author} · {post.date} · 댓글 {post.comments}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">참여 팀원</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                팀원 초대
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {["김개발", "이디자인", "박퍼블", "최기획", "정관리"].map((name) => (
                <Card key={name}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">개발팀</p>
                      </div>
                      <Badge variant="secondary">활성</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 설정</CardTitle>
                <CardDescription>
                  프로젝트의 기본 정보를 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">설정 페이지는 개발 중입니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
