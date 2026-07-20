import { createBaseService } from './base.service';
import type { PaginatedResponse } from '@/lib/api/types';

const baseUserService = createBaseService('admin/users');

export const userService = {
  ...baseUserService,

  async getUsers(params?: Record<string, any>) {
    return baseUserService.getPaginated(params);
  },

  async getUserById(id: string | number) {
    return baseUserService.getById(id);
  },

  async createUser(data: any) {
    return baseUserService.create(data);
  },

  async updateUser(id: string | number, data: any) {
    return baseUserService.update(id, data);
  },

  async deleteUser(id: string | number) {
    return baseUserService.delete(id);
  },

  async updateUserStatus(id: string | number, status: 'active' | 'inactive') {
    return baseUserService.customPatch(`admin/users/${id}/status`, { status });
  },

  async updateUserRole(id: string | number, roleId: number) {
    return baseUserService.customPatch(`admin/users/${id}/role`, { role_id: roleId });
  },

  async getUserStatistics(id: string | number) {
    return baseUserService.customGet(`admin/users/${id}/statistics`);
  },

  async searchUsers(query: string, params?: Record<string, any>) {
    return baseUserService.getPaginated({ ...params, search: query });
  },

  async bulkUpdateStatus(userIds: (string | number)[], status: 'active' | 'inactive') {
    return baseUserService.customPost('admin/users/bulk-status', {
      user_ids: userIds,
      status,
    });
  },

  async exportUsers(params?: Record<string, any>) {
    return baseUserService.customGet('admin/users/export', params);
  },

  async getStatistics(params?: Record<string, any>) {
    return baseUserService.customGet('admin/users/statistics', { params });
  },
};

export default userService;
