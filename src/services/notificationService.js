import client from "../api/client";

const notificationService = {
  /**
   * Fetch notifications for the current user.
   * Matches by validUserId (e.g. "BSSE001") OR by email as fallback,
   * because some backend services store the email in toUserId instead of the validUserId.
   */
  getNotifications: async (user, page = 0, size = 2000) => {
    try {
      const res = await client.get(
        `/api/notifications?page=${page}&size=${size}`,
        { _skipRedirect: true }
      );
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : data?.content || [];

      if (user?.userId || user?.email) {
        return list.filter((n) =>
          n.toUserId === user.userId ||
          n.toUserId === user.email
        );
      }
      return list;
    } catch (error) {
      console.warn("Failed to fetch notifications from backend", error);
      return [];
    }
  },

  getUnreadCount: async (user) => {
    try {
      const list  = await notificationService.getNotifications(user);
      const unread = list.filter((n) => !n.read);
      return {
        totalUnread:   unread.length,
        criticalCount: unread.filter((n) => n.priority === "CRITICAL").length
      };
    } catch {
      return { totalUnread: 0, criticalCount: 0 };
    }
  },

  markAsRead: async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`);
    } catch {
      await client.put(`/api/notifications/${id}/read`);
    }
  },

  createNotification: async (payload) => {
    await client.post("/api/notifications", payload);
  },

  markAllAsRead: async () => {
    try {
      await client.post("/api/notifications/read-all");
    } catch {
      await client.put("/api/notifications/read-all");
    }
  },

  deleteNotification: async (id) => {
    await client.delete(`/api/notifications/${id}`);
  }
};

export { notificationService };
