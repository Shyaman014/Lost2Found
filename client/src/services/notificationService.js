import api from './api';

const notificationService = {
  // Get all notifications (optionally filter unread only)
  getNotifications: async (unreadOnly = false, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (unreadOnly) params.append('unread', 'true');
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Mark a single notification as read
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
