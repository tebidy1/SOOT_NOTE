'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CompanyForm } from '../form';
import { companyService } from '@/lib/services/company.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

export default function NewCompanyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: companyService.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      showSuccess(t.companyCreated);
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء إنشاء الشركة');
    },
  });

  const handleSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.addCompany}
        description="أدخل معلومات الشركة الجديدة"
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
        />
      </div>
    </div>
  );
}
