import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { notificationsApi } from "@/apis/notifications";

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementCount: () => void;
  incrementCount: () => void;
  resetCount: () => void;
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
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

  const decrementCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const incrementCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  const resetCount = () => {
    setUnreadCount(0);
  };

  const refreshCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error("❌ 읽지 않은 알림 개수 새로고침 실패:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        decrementCount,
        incrementCount,
        resetCount,
        refreshCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
