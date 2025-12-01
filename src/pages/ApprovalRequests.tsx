import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const requests = [
  { id: 701, project: "ABC 리뉴얼", title: "디자인 시안 승인", status: "REQUESTED", requester: "김디자", createdAt: "2025-02-05" },
  { id: 702, project: "WeFlow 모바일", title: "요구사항 동결", status: "IN_REVIEW", requester: "박PM", createdAt: "2025-02-03" },
  { id: 703, project: "AI PoC", title: "퍼블리싱 QA", status: "COMPLETED", requester: "이개발", createdAt: "2025-01-30" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "승인 대기", className: "bg-blue-100 text-blue-700" },
  IN_REVIEW: { label: "검토 중", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "처리 완료", className: "bg-emerald-100 text-emerald-700" },
};

export default function ApprovalRequests() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">승인 요청</h1>
          <p className="text-sm text-muted-foreground mt-1">조직 내 모든 프로젝트의 승인 요청 상태를 확인하세요.</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 요청</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="rounded border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.project} · {request.requester}</p>
                  </div>
                  <Badge className={statusMap[request.status].className}>{statusMap[request.status].label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">요청일 {request.createdAt}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
