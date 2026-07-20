'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Settings, Key, Bot, Globe, MessageSquare } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/auth/auth-provider';

const settingsSections = [
  {
    title: 'groqApiKey',
    icon: Key,
    description: 'transcriptionModel',
  },
  {
    title: 'geminiApiKey',
    icon: Bot,
    description: 'specialty',
  },
  {
    title: 'globalAiPrompt',
    icon: MessageSquare,
    description: 'تعليمات الذكاء الاصطناعي العامة للمنصة',
  },
];

export default function CompanySettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={t.companySettings}
        description={t.companySettingsDesc}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            {t.companyInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">{t.companyName}</p>
              <p className="font-bold mt-1">{user?.name || '--'}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">{t.email}</p>
              <p className="font-bold mt-1">{user?.email || '--'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {settingsSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/5">
                <section.icon className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t[section.title as keyof typeof t] as string || section.title}</CardTitle>
                <CardDescription>
                  {t[section.description as keyof typeof t] as string || section.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded-xl bg-muted/30 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  قريباً - سيتم تفعيل إعدادات {t[section.title as keyof typeof t] as string || section.title}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
