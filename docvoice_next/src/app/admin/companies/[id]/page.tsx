'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { companyService } from '@/lib/services/company.service';
import { useI18n } from '@/providers/i18n-provider';
import { ArrowLeft, Settings, Users } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const { data: response, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompanyById(companyId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const company = (response as any)?.payload || (response as any)?.data || response;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/companies')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {company?.name || t.companyDetails}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-body">{t.companyDetails}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/companies/${companyId}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              {t.companySettings}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.companyInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.companyName}</p>
                <p className="font-semibold text-lg">{company?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.invitationCode}</p>
                <p className="font-semibold">{company?.invitation_code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.companyCode}</p>
                <p className="font-semibold">{company?.code || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.planType}</p>
                <Badge variant="outline">{company?.plan_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.companyStatus}</p>
                <Badge variant={company?.status === 'active' ? 'default' : 'secondary'}>
                  {company?.status === 'active' ? t.active : t.suspended}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.usersCount}</p>
                <p className="font-semibold">{company?.users_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.createdAt}</p>
                <p className="font-semibold">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString('ar-SA') : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href={`/admin/users?company_id=${companyId}`}>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            {t.viewUsers}
          </Button>
        </Link>
        <Link href={`/admin/companies/${companyId}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            {t.companySettings}
          </Button>
        </Link>
      </div>
    </div>
  );
}
