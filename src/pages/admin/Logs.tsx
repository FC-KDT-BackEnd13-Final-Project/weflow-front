import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const Logs = () => {
  const logs = [
    {
      time: "2025-11-20 10:13",
      action: "관리자 홍길동이 회원 '김철수' 생성",
      type: "회원",
    },
    {
      time: "2025-11-20 04:55",
      action: "개발사 4에서 프로젝트 'Landing Page' 생성 요청",
      type: "프로젝트",
    },
    {
      time: "2025-11-20 04:30",
      action: "고객사 B 멤버 3명 CSV 업로드 완료",
      type: "회원",
    },
    {
      time: "2025-11-19 16:22",
      action: "시스템 관리자 계정 비밀번호 초기화됨",
      type: "시스템",
    },
    {
      time: "2025-11-19 14:05",
      action: "프로젝트 'Web Renewal' 진행률 42% 업데이트",
      type: "프로젝트",
    },
    {
      time: "2025-11-19 11:30",
      action: "회사 'ClientA Corporation' 정보 수정",
      type: "회사",
    },
  ];

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      회원: "bg-blue-100 text-blue-700",
      프로젝트: "bg-green-100 text-green-700",
      회사: "bg-purple-100 text-purple-700",
      시스템: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge className={`${colors[type]} hover:${colors[type]}`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">로그 / 활동 기록</h1>
          <p className="text-muted-foreground mt-1">
            시스템의 모든 활동을 추적합니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            전체 활동 로그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="text-xs shrink-0 font-mono">
                    {log.time}
                  </Badge>
                  {getTypeBadge(log.type)}
                  <p className="text-sm flex-1">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
