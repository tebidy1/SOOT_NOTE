import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '@/lib/services/template.service';

export function useTemplates() {
  const queryClient = useQueryClient();

  const useGetTemplates = (params = {}) => {
    return useQuery({
      queryKey: ['templates', params],
      queryFn: () => templateService.getTemplates(params),
    });
  };

  const useGetTemplate = (id: string | number) => {
    return useQuery({
      queryKey: ['template', id],
      queryFn: () => templateService.getTemplateById(id),
      enabled: !!id,
    });
  };

  const useCreateTemplate = () => {
    return useMutation({
      mutationFn: templateService.createTemplate,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
      },
    });
  };

  const useUpdateTemplate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string | number; data: any }) =>
        templateService.updateTemplate(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
      },
    });
  };

  const useDeleteTemplate = () => {
    return useMutation({
      mutationFn: templateService.deleteTemplate,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
      },
    });
  };

  return {
    useGetTemplates,
    useGetTemplate,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
  };
}
