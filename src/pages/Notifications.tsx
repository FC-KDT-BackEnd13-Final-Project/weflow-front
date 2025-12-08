import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const notificationResponse = {
  success: true,
  data: {
    notifications: [
      {
        notificationId: 1,
        type: "APPROVAL_REQUEST",
        category: "IMPORTANT",
        title: "새 승인 요청",
        content: "화면설계서에 대한 승인 요청이 도착했습니다.",
        target: {
          type: "APPROVAL",
          id: 503,
          url: "/project/3/approvals/503",
        },
        isRead: false,
        createdAt: "2025-01-16T10:30:00",
      },
      {
        notificationId: 2,
        type: "NEW_COMMENT",
        category: "GENERAL",
        title: "새 댓글",
        content: "김고객님이 댓글을 작성했습니다.",
        target: {
          type: "POST",
          id: 42,
          url: "/project/3/board/42",
        },
        isRead: true,
        createdAt: "2025-01-16T09:00:00",
      },
    ],
    pagination: {
      page: 0,
      size: 20,
      totalElements: 25,
      totalPages: 2,
    },
  },
  error: null,
};

const categoryLabels: Record<string, string> = {
  IMPORTANT: "중요",
  GENERAL: "일반",
};

const typeLabels: Record<string, string> = {
  APPROVAL_REQUEST: "승인 요청",
  NEW_COMMENT: "새 댓글",
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
  const [notifications, setNotifications] = useState(notificationResponse.data.notifications);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "IMPORTANT" | "GENERAL">("ALL");
  const [readFilter, setReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchCategory = categoryFilter === "ALL" || notification.category === categoryFilter;
      const matchRead =
        readFilter === "ALL" ||
        (readFilter === "READ" && notification.isRead) ||
        (readFilter === "UNREAD" && !notification.isRead);
      return matchCategory && matchRead;
    });
  }, [notifications, categoryFilter, readFilter]);

  const handleDismiss = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.notificationId !== id));
  };

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
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="IMPORTANT">중요</SelectItem>
                  <SelectItem value="GENERAL">일반</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="rounded border border-dashed py-12 text-center text-sm text-muted-foreground">
                선택한 조건에 해당하는 알림이 없습니다.
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className="rounded border p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          notification.category === "IMPORTANT"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {categoryLabels[notification.category]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {typeLabels[notification.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{notification.isRead ? "읽음" : "읽지 않음"}</span>
                      <span>{formatDateTime(notification.createdAt)}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleDismiss(notification.notificationId)}
                        aria-label="알림 삭제"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {notification.target?.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(notification.target.url)}
                      >
                        이동
                      </Button>
                    )}
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
