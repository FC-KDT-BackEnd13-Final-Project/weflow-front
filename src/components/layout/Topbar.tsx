import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/apis/notifications";
import { clearCurrentUserCache, useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 추가

export function Topbar() {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser(); // isLoading 상태 사용
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      // 사용자 정보가 로딩 중이거나, user가 없으면 알림 개수를 가져오지 않음
      if (isLoading || !user) return;

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
    // 30초마다 알림 개수를 새로고침
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isLoading, user]); // isLoading과 user가 변경될 때마다 useEffect 재실행

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    clearCurrentUserCache();
    navigate("/login");
  };

  return (
    <header className="rounded-2xl border bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* 사용자 정보 영역 */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-inner">
            <User className="h-5 w-5" />
          </div>
          <div>
            {isLoading ? (
              // 로딩 중일 때 스켈레톤
              <>
                <Skeleton className="h-5 w-24 mb-1" /> {/* 이름 */}
                <Skeleton className="h-4 w-32" /> {/* 회사명 */}
              </>
            ) : (
              // 데이터 로드 완료 후
              <>
                <p className="text-lg font-semibold tracking-tight">
                  {user ? `${user.name ?? "이용자"}님` : "로그인 필요"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user?.companyName ?? (user ? "weflow workspace" : " ")}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-4 text-sm">
          {isLoading ? (
            // 로딩 중일 때 버튼 스켈레톤
            <>
              <Skeleton className="h-9 w-9 rounded-full" /> {/* 알림 버튼 */}
              <Skeleton className="h-9 w-20" /> {/* 로그아웃 버튼 */}
            </>
          ) : (
            // 데이터 로드 완료 후
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}