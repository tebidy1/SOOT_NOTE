import { baseApi } from './base.service';

export const userNotificationService = {
  async getNotifications(params?: Record<string, any>) {
    return baseApi.get('/admin/auth/notifications', { params });
  },

  async getUnread() {
    return baseApi.get('/admin/auth/notifications/unread');
  },

  async getUnreadCount() {
    return baseApi.get('/admin/auth/notifications/unread-count');
  },

  async markAsRead(id: string | number) {
    return baseApi.post(`/admin/auth/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return baseApi.post('/admin/auth/notifications/read-all');
  },

  async deleteNotification(id: string | number) {
    return baseApi.delete(`/admin/auth/notifications/${id}`);
  },
};
