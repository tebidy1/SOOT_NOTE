import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/lib/services/company.service';

export function useCompanies() {
  const queryClient = useQueryClient();

  const useGetCompanies = (params = {}) => {
    return useQuery({
      queryKey: ['companies', params],
      queryFn: () => companyService.getCompanies(params),
    });
  };

  const useGetCompany = (id: string | number) => {
    return useQuery({
      queryKey: ['company', id],
      queryFn: () => companyService.getCompanyById(id),
      enabled: !!id,
    });
  };

  const useCreateCompany = () => {
    return useMutation({
      mutationFn: companyService.createCompany,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      },
    });
  };

  const useUpdateCompany = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string | number; data: any }) =>
        companyService.updateCompany(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      },
    });
  };

  const useDeleteCompany = () => {
    return useMutation({
      mutationFn: companyService.deleteCompany,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      },
    });
  };

  const useToggleCompanyStatus = () => {
    return useMutation({
      mutationFn: companyService.toggleCompanyStatus,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      },
    });
  };

  const useGetCompanyUsers = (companyId: string | number, params = {}) => {
    return useQuery({
      queryKey: ['company-users', companyId, params],
      queryFn: () => companyService.getCompanyUsers(companyId, params),
      enabled: !!companyId,
    });
  };

  return {
    useGetCompanies,
    useGetCompany,
    useCreateCompany,
    useUpdateCompany,
    useDeleteCompany,
    useToggleCompanyStatus,
    useGetCompanyUsers,
  };
}
