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

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const response = await api.get<NotificationsResponse>("/api/notifications");
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
};
