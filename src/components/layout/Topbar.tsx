import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/apis/notifications";
import { clearCurrentUserCache, useCurrentUser } from "@/hooks/useCurrentUser";

export function Topbar() {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsApi.getUnreadCount();
        if (!mounted) return;
        if (response.success) {
          setUnreadCount(response.data);
        }
      } catch (error) {
        if (mounted) {
          console.error("❌ 읽지 않은 알림 개수 조회 실패:", error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    clearCurrentUserCache();
    navigate("/login");
  };

  return (
    <header className="rounded-2xl border bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-inner">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {user?.companyName ?? "weflow workspace"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "정보 불러오는 중..." : `${user?.name ?? "이용자"}님`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
