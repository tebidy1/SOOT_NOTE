import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/lib/services/company.service';

export function useCompanySettings() {
  const queryClient = useQueryClient();

  const useGetSettings = (companyId: string | number) => {
    return useQuery({
      queryKey: ['company-settings', companyId],
      queryFn: () => companyService.getCompanySettings(companyId),
      enabled: !!companyId,
    });
  };

  const useUpdateSettings = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string | number; data: any }) =>
        companyService.updateCompanySettings(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['company-settings', variables.id] });
      },
    });
  };

  return {
    useGetSettings,
    useUpdateSettings,
  };
}
