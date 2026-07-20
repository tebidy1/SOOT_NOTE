import { createBaseService } from './base.service';

const baseDashboardService = createBaseService('admin/dashboard');

export const dashboardService = {
  async getStatistics() {
    return baseDashboardService.customGet('admin/dashboard/statistics');
  },

  async getCompaniesStatistics() {
    return baseDashboardService.customGet('admin/dashboard/companies-statistics');
  },

  async getUsersStatistics() {
    return baseDashboardService.customGet('admin/dashboard/users-statistics');
  },
};

export default dashboardService;
