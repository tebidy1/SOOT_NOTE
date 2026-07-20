import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/lib/services/role.service';

export function useRoles() {
  const queryClient = useQueryClient();

  const useGetRoles = (params = {}) => {
    return useQuery({
      queryKey: ['roles', params],
      queryFn: () => roleService.getRoles(params),
    });
  };

  const useGetRole = (id: string | number) => {
    return useQuery({
      queryKey: ['role', id],
      queryFn: () => roleService.getRoleById(id),
      enabled: !!id,
    });
  };

  const useCreateRole = () => {
    return useMutation({
      mutationFn: roleService.createRole,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
      },
    });
  };

  const useUpdateRole = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string | number; data: any }) =>
        roleService.updateRole(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
      },
    });
  };

  const useDeleteRole = () => {
    return useMutation({
      mutationFn: roleService.deleteRole,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
      },
    });
  };

  const useGetAllPermissions = () => {
    return useQuery({
      queryKey: ['permissions'],
      queryFn: () => roleService.getAllPermissions(),
    });
  };

  const useUpdateRolePermissions = () => {
    return useMutation({
      mutationFn: ({ id, permissions }: { id: string | number; permissions: string[] }) =>
        roleService.updateRolePermissions(id, permissions),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
      },
    });
  };

  return {
    useGetRoles,
    useGetRole,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useGetAllPermissions,
    useUpdateRolePermissions,
  };
}
