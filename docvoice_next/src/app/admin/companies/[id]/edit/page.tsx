'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { CompanyForm } from '../../form';
import { companyService } from '@/lib/services/company.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/providers/i18n-provider';

export default function EditCompanyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const companyId = params.id as string;

  const { data: response, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompanyById(companyId),
  });

  const company = (response as any)?.payload || (response as any)?.data || response;

  const mutation = useMutation({
    mutationFn: (data: any) => companyService.updateCompany(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      showSuccess(t.companyUpdated);
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء تحديث الشركة');
    },
  });

  const handleSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.editCompany} description="الشركة غير موجودة">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/companies')}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.editCompany}
        description={`تعديل بيانات شركة: ${company.name}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/companies')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للقائمة
        </Button>
      </PageHeader>

      <div className="bg-card rounded-lg border p-6">
        <CompanyForm
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          initialData={company}
        />
      </div>
    </div>
  );
}
