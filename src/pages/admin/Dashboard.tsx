import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, FolderKanban, UserPlus, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const stats = [
    {
      title: "전체 회원 수",
      value: "123명",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      link: "/admin/members",
    },
    {
      title: "등록된 회사 수",
      value: "12개",
      icon: Building2,
      color: "bg-pink-100 text-pink-600",
      link: "/admin/companies",
    },
    {
      title: "전체 프로젝트",
      value: "34개",
      icon: FolderKanban,
      color: "bg-blue-100 text-blue-600",
      link: "/admin/projects",
    },
  ];

  const recentActivities = [
    {
      time: "2025-11-20 10:13",
      action: "관리자 홍길동이 회원 '김철수' 생성",
    },
    {
      time: "2025-11-20 04:55",
      action: "개발사 4에서 프로젝트 'Landing Page' 생성 요청",
    },
    {
      time: "2025-11-20 04:30",
      action: "고객사 B 멤버 3명 CSV 업로드 완료",
    },
    {
      time: "2025-11-19 16:22",
      action: "시스템 관리자 계정 비밀번호 초기화됨",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">관리자</h1>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
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
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 py-2">
                <Badge variant="outline" className="text-xs shrink-0">
                  {activity.time}
                </Badge>
                <p className="text-sm">{activity.action}</p>
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
