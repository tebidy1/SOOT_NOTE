'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { User, getColumns } from './columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserForm } from './form';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { DataTable } from '@/components/shared/data-table';
import { userService } from '@/lib/services/user.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Plus, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const addUser = async (data: any) => {
  const response = await userService.createUser(data);
  return response;
}

const updateUser = async (user: any) => {
  const { id, ...rest } = user;
  const response = await userService.updateUser(id, rest);
  return response;
}

const deleteUser = async (id: string) => {
  await userService.deleteUser(id);
}

const toggleUserStatus = async (id: string) => {
  const response = await userService.customPatch(`admin/users/${id}/toggle-status`, {});
  return response;
}

const resetUserPassword = async ({ id, password }: { id: string; password: string }) => {
  const response = await userService.customPost(`admin/users/${id}/reset-password`, { password, password_confirmation: password });
  return response;
}

interface MutationVariables {
  action: 'add' | 'update' | 'delete' | 'toggleStatus' | 'resetPassword';
  payload: any;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isResetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const {
    currentPage,
    perPage,
    sortColumn,
    sortDirection,
    searchQuery,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    handleSearch,
  } = useDataTable();

  const fetchData = useCallback(async () => {
    const params: any = {
      page: currentPage,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
    };

    if (statusFilter !== 'all') params.status = statusFilter;
    if (roleFilter !== 'all') params.role = roleFilter;
    if (searchQuery) params.search = searchQuery;

    return userService.getUsers(params);
  }, [currentPage, perPage, sortColumn, sortDirection, statusFilter, roleFilter, searchQuery]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['users', currentPage, perPage, sortColumn, sortDirection, statusFilter, roleFilter, searchQuery],
    queryFn: fetchData,
  });

  const users = (response as any)?.data || [];
  const paginationMeta = (response as any)?.meta;

  const mutation = useMutation({
    mutationFn: async (values: MutationVariables) => {
      switch (values.action) {
        case 'add': return addUser(values.payload);
        case 'update': return updateUser(values.payload);
        case 'delete': return deleteUser(values.payload);
        case 'toggleStatus': return toggleUserStatus(values.payload);
        case 'resetPassword': return resetUserPassword(values.payload);
        default: throw new Error('Invalid action');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setDeleteAlertOpen(false);
      setResetPasswordOpen(false);
      setResetPasswordValue('');
      setSelectedUser(null);

      if (variables.action === 'resetPassword') {
        showSuccess('تم إعادة تعيين كلمة المرور بنجاح');
      }
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء تنفيذ العملية');
    }
  });

  const handleAdd = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteAlertOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    mutation.mutate({ action: 'toggleStatus', payload: user.id });
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    const payload = { ...values }
    if (!payload.password) delete payload.password
    if (selectedUser) {
      await mutation.mutateAsync({ action: 'update', payload: { ...payload, id: selectedUser.id } });
    } else {
      await mutation.mutateAsync({ action: 'add', payload });
    }
  };

  const handleConfirmResetPassword = async () => {
    if (selectedUser && resetPasswordValue) {
      await mutation.mutateAsync({
        action: 'resetPassword',
        payload: { id: selectedUser.id, password: resetPasswordValue }
      });
    }
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete, handleToggleStatus, handleResetPassword, {
    serverSide: true,
    sortColumn,
    sortDirection,
    onSort: handleSort,
  }), [handleEdit, handleDelete, sortColumn, sortDirection, handleSort]);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={users}
        pageTitle="المستخدمين"
        pageDescription="إدارة المستخدمين والصلاحيات في النظام"
        isLoading={isLoading}
        serverSide
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        currentPage={currentPage}
        perPage={perPage}
        totalCount={paginationMeta?.total || 0}
        pageCount={paginationMeta?.last_page || 1}
        toolbarActions={
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            إضافة مستخدم
          </Button>
        }
      />

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleFormSubmit}
            isPending={mutation.isPending}
            initialData={selectedUser}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input
                id="password"
                type="password"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmResetPassword}
                disabled={!resetPasswordValue || mutation.isPending}
              >
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteAlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={(open) => setDeleteAlertOpen(open)}
        onConfirm={() => mutation.mutate({ action: 'delete', payload: selectedUser?.id })}
        isPending={mutation.isPending}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف المستخدم "${selectedUser?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
      />
    </div>
  );
}
