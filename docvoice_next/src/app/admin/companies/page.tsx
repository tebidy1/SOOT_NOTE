'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { Company, getColumns } from './columns';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { DataTable } from '@/components/shared/data-table';
import { companyService } from '@/lib/services/company.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { useRouter } from 'next/navigation';

const deleteCompany = async (id: string) => {
  await companyService.deleteCompany(id);
}

const toggleCompanyStatus = async (id: string) => {
  const response = await companyService.toggleCompanyStatus(id);
  return response;
}

interface MutationVariables {
  action: 'delete' | 'toggleStatus';
  payload: any;
}

export default function CompaniesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    if (searchQuery) params.search = searchQuery;

    return companyService.getCompanies(params);
  }, [currentPage, perPage, sortColumn, sortDirection, statusFilter, searchQuery]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['companies', currentPage, perPage, sortColumn, sortDirection, statusFilter, searchQuery],
    queryFn: fetchData,
  });

  const companies = (response as any)?.data || [];
  const paginationMeta = (response as any)?.meta;

  const mutation = useMutation({
    mutationFn: async (values: MutationVariables) => {
      switch (values.action) {
        case 'delete': return deleteCompany(values.payload);
        case 'toggleStatus': return toggleCompanyStatus(values.payload);
        default: throw new Error('Invalid action');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeleteAlertOpen(false);
      setSelectedCompany(null);

      const messages: Record<string, string> = {
        delete: 'companyDeleted',
        toggleStatus: '',
      };
      if (messages[variables.action]) {
        showSuccess(t[messages[variables.action]] || messages[variables.action]);
      }
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء تنفيذ العملية');
    }
  });

  const handleAdd = () => {
    router.push('/admin/companies/new');
  };

  const handleEdit = (company: Company) => {
    router.push(`/admin/companies/${company.id}/edit`);
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteAlertOpen(true);
  };

  const handleToggleStatus = (company: Company) => {
    mutation.mutate({ action: 'toggleStatus', payload: company.id });
  };

  const handleSettings = (company: Company) => {
    router.push(`/admin/companies/${company.id}/settings`);
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete, handleToggleStatus, handleSettings, {
    serverSide: true,
    sortColumn,
    sortDirection,
    onSort: handleSort,
  }), [handleEdit, handleDelete, sortColumn, sortDirection, handleSort]);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={companies}
        pageTitle={t.companiesList}
        pageDescription={t.companiesListDesc}
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
            {t.addCompany}
          </Button>
        }
      />

      <DeleteAlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={(open) => setDeleteAlertOpen(open)}
        onConfirm={() => mutation.mutate({ action: 'delete', payload: selectedCompany?.id })}
        isPending={mutation.isPending}
        title={t.deleteCompany}
        description={`${t.deleteCompanyConfirm} "${selectedCompany?.name}"؟`}
      />
    </div>
  );
}
