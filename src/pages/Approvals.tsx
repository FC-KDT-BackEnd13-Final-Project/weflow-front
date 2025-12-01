import { useNavigate, useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StepRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED";

interface StepRequestSummary {
  id: number;
  title: string;
  status: StepRequestStatus;
  requestedBy: number;
  createdAt: string;
  step: string;
}

const stepRequestSummaries: StepRequestSummary[] = [
  {
    id: 501,
    title: "디자인 시안 승인 요청드립니다",
    status: "REJECTED",
    requestedBy: 17,
    createdAt: "2025-02-05T11:00:00",
    step: "디자인",
  },
  {
    id: 502,
    title: "퍼블리싱 결과물 승인 요청",
    status: "APPROVED",
    requestedBy: 21,
    createdAt: "2025-02-04T16:30:00",
    step: "퍼블리싱",
  },
  {
    id: 503,
    title: "테스트 시나리오 승인 요청",
    status: "REQUESTED",
    requestedBy: 18,
    createdAt: "2025-02-02T09:45:00",
    step: "개발",
  },
];

const stepCategories = ["요구사항 정의", "화면 설계", "디자인", "퍼블리싱", "개발", "검수"];

const statusConfig: Record<StepRequestStatus, { label: string; dot: string; badge: string }> = {
  REQUESTED: { label: "요청 중", dot: "bg-yellow-500", badge: "bg-yellow-500 text-white" },
  APPROVED: { label: "승인 완료", dot: "bg-green-500", badge: "bg-green-500 text-white" },
  REJECTED: { label: "반려", dot: "bg-red-500", badge: "bg-red-500 text-white" },
};

const formatDateTime = (value: string) => new Date(value).toLocaleString("ko-KR", { hour12: false });

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();

  const getRequestsForStep = (step: string) =>
    stepRequestSummaries.filter((request) => request.step === step);

  const getStepStatus = (requests: StepRequestSummary[]) => {
    if (requests.some((r) => r.status === "REQUESTED")) {
      return { label: "진행중", className: "bg-blue-500 text-white" };
    }
    if (requests.some((r) => r.status === "APPROVED")) {
      return { label: "완료", className: "bg-green-500 text-white" };
    }
    return { label: "진행 전", className: "bg-gray-400 text-white" };
  };

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">단계별 승인 요청</h1>
            <p className="text-sm text-muted-foreground mt-1">프로젝트 단계별 승인 상태를 확인하세요</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepCategories.map((category) => {
            const requests = getRequestsForStep(category);
            const stepStatus = getStepStatus(requests);

            return (
              <Card key={category} className="flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <Badge className={stepStatus.className}>{stepStatus.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 space-y-4">
                  {requests.length > 0 ? (
                    requests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => navigate(`/project/${id}/approvals/${request.id}`)}
                        className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full", statusConfig[request.status].dot)} />
                          <span className="font-medium text-sm">{request.title}</span>
                        </div>
                        <Badge className={statusConfig[request.status].badge}>
                          {statusConfig[request.status].label}
                        </Badge>
                      </button>
                    ))
                  ) : (
                    <div className="w-full p-4 rounded-lg border border-dashed text-sm text-muted-foreground text-center">
                      승인 요청이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ProjectLayout>
  );
}
