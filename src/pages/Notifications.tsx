import { useMemo, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X, Mail, CheckCheck } from "lucide-react";
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

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.getNotifications();
        if (response.success) {
          setNotifications(response.data.content);
        }
      } catch (error: any) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || "알림을 불러올 수 없습니다.";

        console.error("알림 조회 에러:", {
          status,
          message: errorMessage,
          error: error.response?.data,
        });

        toast({
          variant: "destructive",
          title: "알림 조회 실패",
          description: status === 500
            ? "서버 오류가 발생했습니다. 관리자에게 문의하세요."
            : errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [toast]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchRead =
        readFilter === "ALL" ||
        (readFilter === "READ" && notification.read) ||
        (readFilter === "UNREAD" && !notification.read);
      return matchRead;
    });
  }, [notifications, readFilter]);

  const hasUnread = useMemo(() => {
    return notifications.some((n) => !n.read);
  }, [notifications]);

  const handleDismiss = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("알림을 삭제하시겠습니까?")) return;

    try {
      const response = await notificationsApi.deleteNotification(id);
      if (response.success) {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
        toast({
          title: "알림 삭제",
          description: "알림이 삭제되었습니다.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "알림 삭제 실패",
        description: error.response?.data?.message || "알림을 삭제할 수 없습니다.",
      });
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "알림 읽음 처리 실패",
        description: error.response?.data?.message || "알림을 읽음 처리할 수 없습니다.",
      });
    }
  };

  const handleMarkAsUnread = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    try {
      const response = await notificationsApi.markAsUnread(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: false }
              : notification
          )
        );
        toast({
          title: "알림 안 읽음 처리",
          description: "알림을 읽지 않음 상태로 변경했습니다.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "알림 처리 실패",
        description: error.response?.data?.message || "작업을 수행할 수 없습니다.",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        toast({
          title: "모두 읽음 처리 완료",
          description: "모든 알림을 읽음 상태로 변경했습니다.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "일괄 읽음 처리 실패",
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">알림</h1>
          <p className="text-sm text-muted-foreground mt-1">최근 받은 알림을 확인하고 필요한 조치를 진행하세요.</p>
        </div>
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2">
              <CardTitle>최근 알림</CardTitle>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[
                  { label: "전체", value: "ALL" },
                  { label: "읽지 않음", value: "UNREAD" },
                  { label: "읽음", value: "READ" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={readFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadFilter(option.value as typeof readFilter)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {hasUnread && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  모두 읽음
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="rounded border border-dashed py-12 text-center text-sm text-muted-foreground">
                {notifications.length === 0 ? "알림이 없습니다." : "선택한 조건에 해당하는 알림이 없습니다."}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded border p-4 space-y-3 cursor-pointer transition-colors ${
                      notification.read ? "bg-white" : "bg-blue-50/50 hover:bg-blue-50"
                    }`}
                    onClick={async () => {
                      if (!notification.read) {
                        await handleMarkAsRead(notification.id);
                      }
                      // 상세 페이지로 이동
                      navigate(`/notifications/${notification.id}`);
                    }}
                  >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          notification.priority === "IMPORTANT"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : !notification.read
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {typeLabels[notification.type] || notification.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{notification.read ? "읽음" : "읽지 않음"}</span>
                      <span>{formatDateTime(notification.createdAt)}</span>
                      {notification.read && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleMarkAsUnread(e, notification.id)}
                          aria-label="안 읽음으로 표시"
                          title="안 읽음으로 표시"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleDismiss(e, notification.id)}
                        aria-label="알림 삭제"
                        title="알림 삭제"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className={`font-semibold ${notification.read ? "text-muted-foreground" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
