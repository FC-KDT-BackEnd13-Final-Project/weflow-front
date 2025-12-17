import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { notificationsApi } from "@/apis/notifications";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  STEP_REQUEST: "단계 요청",
  STEP_DECISION: "단계 결정",
  NEW_POST: "새 게시글",
  NEW_COMMENT: "새 댓글",
  MENTION: "멘션",
  SYSTEM_NOTICE: "시스템 공지",
  CHECKLIST_CREATED: "체크리스트 생성",
  CHECKLIST_SUBMITTED: "체크리스트 제출",
  PROJECT_MEMBER_ADDED: "멤버 추가",
  PROJECT_MEMBER_REMOVED: "멤버 제거",
  PROJECT_CREATED: "프로젝트 생성",
  PROJECT_UPDATED: "프로젝트 수정",
  PROJECT_DELETED: "프로젝트 삭제",
  PROJECT_INFO_UPDATED: "프로젝트 정보 수정",
  APPROVAL_REQUEST: "승인 요청",
  APPROVAL_APPROVED: "승인 완료",
  APPROVAL_REJECTED: "승인 거절",
  TASK_ASSIGNED: "작업 할당",
  TASK_COMPLETED: "작업 완료",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notification, setNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      if (!id) return;
      try {
        const response = await notificationsApi.getNotification(Number(id));
        if (response.success) {
          setNotification(response.data);
          // 읽지 않은 상태라면 읽음 처리
          if (!response.data.read) {
             notificationsApi.markAsRead(Number(id));
          }
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "알림 조회 실패",
          description: error.response?.data?.message || "알림 정보를 불러올 수 없습니다.",
        });
        navigate("/notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [id, navigate, toast]);

  const handleMarkAsUnread = async () => {
    if (!id) return;
    try {
      const response = await notificationsApi.markAsUnread(Number(id));
      if (response.success) {
        toast({
          title: "안 읽음 처리 완료",
          description: "알림을 읽지 않음 상태로 변경했습니다.",
        });
        navigate("/notifications");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "알림 처리 실패",
        description: error.response?.data?.message || "작업을 수행할 수 없습니다.",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </AppLayout>
    );
  }

  if (!notification) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">알림 상세</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{typeLabels[notification.type] || notification.type}</Badge>
                <span className="text-sm text-muted-foreground">{formatDateTime(notification.createdAt)}</span>
              </div>
              <Badge variant={notification.read ? "secondary" : "default"}>
                {notification.read ? "읽음" : "읽지 않음"}
              </Badge>
            </div>
            <CardTitle className="mt-2">{notification.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
              {notification.message}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">관련 프로젝트 ID</p>
                <p>{notification.relatedProjectId || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">관련 게시글 ID</p>
                <p>{notification.relatedPostId || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">읽은 시간</p>
                <p>{formatDateTime(notification.readAt)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/notifications")}>
                목록으로 돌아가기
              </Button>
              {notification.read && (
                <Button variant="secondary" onClick={handleMarkAsUnread}>
                  <Mail className="mr-1 h-4 w-4" />
                  안 읽은 알림으로 변경
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
