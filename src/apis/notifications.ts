import api from "./api";

interface Notification {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  relatedPostId: number | null;
  relatedStepRequestId: number | null;
  relatedProjectId: number | null;
  createdAt: string;
}

interface PageableResponse {
  content: Notification[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

interface NotificationsResponse {
  success: boolean;
  message: string;
  data: PageableResponse;
}

interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: number;
}

interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data: null;
}

interface NotificationDetailResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export const notificationsApi = {
  getNotifications: async (page: number = 0, size: number = 10, isRead?: boolean): Promise<NotificationsResponse> => {
    const params: any = { page, size };
    if (isRead !== undefined) {
      params.isRead = isRead;
    }
    const response = await api.get<NotificationsResponse>("/api/notifications", {
      params
    });
    return response.data;
  },

  getNotification: async (notificationId: number): Promise<NotificationDetailResponse> => {
    const response = await api.get<NotificationDetailResponse>(`/api/notifications/${notificationId}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<UnreadCountResponse>("/api/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<MarkAsReadResponse> => {
    const response = await api.patch<MarkAsReadResponse>(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAsUnread: async (notificationId: number): Promise<MarkAsReadResponse> => {
    const response = await api.patch<MarkAsReadResponse>(`/api/notifications/${notificationId}/unread`);
    return response.data;
  },

  markAllAsRead: async (): Promise<MarkAsReadResponse> => {
    const response = await api.patch<MarkAsReadResponse>("/api/notifications/read-all");
    return response.data;
  },

  deleteNotification: async (notificationId: number): Promise<MarkAsReadResponse> => {
    const response = await api.delete<MarkAsReadResponse>(`/api/notifications/${notificationId}`);
    return response.data;
  },
};
