import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const approvalRequestResponse = {
  success: true,
  data: {
    requests: [
      {
        id: 501,
        title: "디자인 시안 승인 요청드립니다",
        status: "REQUESTED",
        project: {
          projectId: 3,
          projectName: "ABC 리뉴얼",
        },
        requestedBy: {
          memberId: 17,
          name: "김서현",
          role: "DESIGNER",
        },
        createdAt: "2025-02-05T11:00:00",
      },
      {
        id: 502,
        title: "요구사항 정의 동결 승인 요청",
        status: "IN_REVIEW",
        project: {
          projectId: 4,
          projectName: "WeFlow 모바일",
        },
        requestedBy: {
          memberId: 19,
          name: "박PM",
          role: "PM",
        },
        createdAt: "2025-02-03T14:20:00",
      },
      {
        id: 503,
        title: "퍼블리싱 QA 결과 승인",
        status: "COMPLETED",
        project: {
          projectId: 5,
          projectName: "AI PoC",
        },
        requestedBy: {
          memberId: 20,
          name: "이개발",
          role: "DEVELOPER",
        },
        createdAt: "2025-01-30T09:00:00",
      },
    ],
    pagination: {
      page: 0,
      size: 20,
      totalElements: 12,
      totalPages: 1,
    },
  },
  error: null,
};

const statusMap: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "승인 대기", className: "bg-blue-100 text-blue-700" },
  IN_REVIEW: { label: "검토 중", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "처리 완료", className: "bg-emerald-100 text-emerald-700" },
};

export default function ApprovalRequests() {
  const navigate = useNavigate();
  const requests = approvalRequestResponse.data.requests;

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
              <div
                key={request.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/project/${request.project.projectId}/approvals/${request.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/project/${request.project.projectId}/approvals/${request.id}`);
                  }
                }}
                className="rounded border p-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.project.projectName} · {request.requestedBy.name}
                    </p>
                  </div>
                  <Badge className={statusMap[request.status].className}>
                    {statusMap[request.status].label}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  요청일 {formatDateTime(request.createdAt)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
