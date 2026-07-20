import { baseApi } from '@/lib/api/base-api';

export const companyDashboardService = {
  async getStatistics() {
    return baseApi.get('/company/dashboard/statistics');
  },
};

export default companyDashboardService;
