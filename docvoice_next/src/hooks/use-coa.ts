'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coaService } from '@/lib/services/coa.service';
import { showSuccess } from '@/lib/notification.service';

const QUERY_KEY = 'coa';

export function useCoa() {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => coaService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSuccess('تم إنشاء الحساب بنجاح');
    },

  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      coaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSuccess('تم تحديث الحساب بنجاح');
    },

  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => coaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      showSuccess('تم حذف الحساب بنجاح');
    },

  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCoaByType(type: string) {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: [QUERY_KEY, 'type', type],
    queryFn: () => coaService.getByType(type),
    enabled: !!type,
  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
  };
}

export function usePostableAccounts() {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: [QUERY_KEY, 'postable'],
    queryFn: () => coaService.getPostable(),
  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
  };
}
