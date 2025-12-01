import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type HistoryAction = "CREATE" | "UPDATE" | "DELETE";
interface HistoryActor {
  memberId: number;
  name: string;
  role: string;
}

interface HistoryLog {
  logId: number;
  action: HistoryAction;
  targetTable: string;
  targetId: number;
  targetName: string;
  description: string;
  actor: HistoryActor;
  createdAt: string;
}

interface HistoryResponse {
  project: {
    projectId: number;
    projectName: string;
  };
  logs: HistoryLog[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

const mockHistoryResponse: HistoryResponse = {
  project: {
    projectId: 3,
    projectName: "ABC 홈페이지 리뉴얼",
  },
  logs: [
    {
      logId: 10,
      action: "CREATE",
      targetTable: "APPROVAL",
      targetId: 15,
      targetName: "디자인 시안 승인 요청",
      description: "승인 요청 생성",
      actor: {
        memberId: 3,
        name: "이개발",
        role: "DEVELOPER",
      },
      createdAt: "2025-01-16T10:00:00",
    },
    {
      logId: 12,
      action: "UPDATE",
      targetTable: "APPROVAL",
      targetId: 15,
      targetName: "디자인 시안 승인 요청",
      description: "승인 처리",
      actor: {
        memberId: 5,
        name: "김고객",
        role: "CLIENT",
      },
      createdAt: "2025-01-16T14:00:00",
    },
  ],
  pagination: {
    page: 0,
    size: 20,
    totalElements: 230,
    totalPages: 12,
  },
};

const actionLabels: Record<HistoryAction, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", { hour12: false });

export default function History() {
  const { project, logs } = mockHistoryResponse;

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">{project.projectName}</p>
          <h1 className="text-3xl font-bold tracking-tight">히스토리</h1>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.logId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{log.actor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.actor.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {actionLabels[log.action]}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.targetTable}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{log.targetName}</span>
                      <span>· {log.description}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProjectLayout>
  );
}
