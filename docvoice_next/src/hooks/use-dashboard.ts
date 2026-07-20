import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/services/dashboard.service';

export function useDashboard() {
  const useGetStatistics = () => {
    return useQuery({
      queryKey: ['dashboard-statistics'],
      queryFn: () => dashboardService.getStatistics(),
    });
  };

  const useGetCompaniesStatistics = () => {
    return useQuery({
      queryKey: ['dashboard-companies-statistics'],
      queryFn: () => dashboardService.getCompaniesStatistics(),
    });
  };

  const useGetUsersStatistics = () => {
    return useQuery({
      queryKey: ['dashboard-users-statistics'],
      queryFn: () => dashboardService.getUsersStatistics(),
    });
  };

  return {
    useGetStatistics,
    useGetCompaniesStatistics,
    useGetUsersStatistics,
  };
}
