import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const notifications = [
  { id: 1, title: "디자인 QA 승인 요청", detail: "김고객님이 확인을 요청했습니다.", time: "5분 전", type: "approval" },
  { id: 2, title: "새 프로젝트 초대", detail: "ABC전자 프로젝트에 초대되었습니다.", time: "1시간 전", type: "project" },
  { id: 3, title: "일정 변경", detail: "퍼블리싱 단계 점검 일정이 변경되었습니다.", time: "어제", type: "schedule" },
];

const typeLabels: Record<string, string> = {
  approval: "승인",
  project: "프로젝트",
  schedule: "일정",
};

export default function Notifications() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">알림</h1>
          <p className="text-sm text-muted-foreground mt-1">최근 받은 알림을 확인하고 필요한 조치를 진행하세요.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.detail}</p>
                  </div>
                  <Badge variant="secondary">{typeLabels[notification.type]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
