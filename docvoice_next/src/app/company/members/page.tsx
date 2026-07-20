'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { Member, getColumns } from './columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MemberForm } from './form';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { DataTable } from '@/components/shared/data-table';
import { companyMemberService } from '@/lib/services/company-member.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';

const addMember = async (data: any) => {
  const response = await companyMemberService.createMember(data);
  return response;
}

const updateMember = async (member: any) => {
  const { id, ...rest } = member;
  const response = await companyMemberService.updateMember(id, rest);
  return response;
}

const deleteMember = async (id: string) => {
  await companyMemberService.deleteMember(id);
}

const toggleMemberStatus = async (id: string) => {
  const response = await companyMemberService.toggleMemberStatus(id);
  return response;
}

interface MutationVariables {
  action: 'add' | 'update' | 'delete' | 'toggleStatus';
  payload: any;
}

export default function CompanyMembersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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

    return companyMemberService.getMembers(params);
  }, [currentPage, perPage, sortColumn, sortDirection, statusFilter, roleFilter, searchQuery]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['company-members', currentPage, perPage, sortColumn, sortDirection, statusFilter, roleFilter, searchQuery],
    queryFn: fetchData,
  });

  const members = (response as any)?.data || [];
  const paginationMeta = (response as any)?.meta;

  const mutation = useMutation({
    mutationFn: async (values: MutationVariables) => {
      switch (values.action) {
        case 'add': return addMember(values.payload);
        case 'update': return updateMember(values.payload);
        case 'delete': return deleteMember(values.payload);
        case 'toggleStatus': return toggleMemberStatus(values.payload);
        default: throw new Error('Invalid action');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
      setFormOpen(false);
      setDeleteAlertOpen(false);
      setSelectedMember(null);

      if (variables.action === 'add') {
        showSuccess('تم إضافة العضو بنجاح');
      } else if (variables.action === 'update') {
        showSuccess('تم تحديث العضو بنجاح');
      } else if (variables.action === 'delete') {
        showSuccess('تم حذف العضو بنجاح');
      } else if (variables.action === 'toggleStatus') {
        showSuccess('تم تغيير الحالة بنجاح');
      }
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء تنفيذ العملية');
    }
  });

  const handleAdd = () => {
    setSelectedMember(null);
    setFormOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteAlertOpen(true);
  };

  const handleToggleStatus = (member: Member) => {
    mutation.mutate({ action: 'toggleStatus', payload: member.id });
  };

  const handleFormSubmit = async (values: any) => {
    const payload = { ...values }
    if (!payload.password) delete payload.password
    if (selectedMember) {
      await mutation.mutateAsync({ action: 'update', payload: { ...payload, id: selectedMember.id } });
    } else {
      await mutation.mutateAsync({ action: 'add', payload });
    }
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete, handleToggleStatus, {
    serverSide: true,
    sortColumn,
    sortDirection,
    onSort: handleSort,
  }), [handleEdit, handleDelete, sortColumn, sortDirection, handleSort]);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={members}
        pageTitle="أعضاء الشركة"
        pageDescription="إدارة أعضاء الشركة والصلاحيات"
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
            <UserPlus className="mr-2 h-4 w-4" />
            إضافة عضو
          </Button>
        }
      />

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? 'تعديل عضو' : 'إضافة عضو جديد'}
            </DialogTitle>
          </DialogHeader>
          <MemberForm
            onSubmit={handleFormSubmit}
            isPending={mutation.isPending}
            initialData={selectedMember}
          />
        </DialogContent>
      </Dialog>

      <DeleteAlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={(open) => setDeleteAlertOpen(open)}
        onConfirm={() => mutation.mutate({ action: 'delete', payload: selectedMember?.id })}
        isPending={mutation.isPending}
        title="حذف العضو"
        description={`هل أنت متأكد من حذف العضو "${selectedMember?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
      />
    </div>
  );
}
