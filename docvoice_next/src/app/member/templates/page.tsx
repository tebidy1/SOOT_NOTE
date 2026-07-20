'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, FileText, Building2 } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { templateService } from '@/lib/services/template.service';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/scribe/logo';
import { ProfileMenu } from '@/components/scribe/profile-menu';

export default function MemberTemplatesPage() {
  const { t, locale } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['member-templates'],
    queryFn: () => templateService.getTemplates(),
  });

  const departments = (macro: any) => macro?.medical_departments || macro?.medicalDepartments || [];

  const templatesList = (templates as any)?.data || [];

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Logo className="h-12 w-auto" variant="dark" />
        <ProfileMenu baseUrl="/member" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.templates}</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : templatesList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-4 text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold">{t.noTemplatesFound}</p>
          <p className="text-sm text-gray-600 mt-1">{t.templatesLibraryDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templatesList.map((template: any) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{template.trigger}</h3>
                    {template.is_ai_macro && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{template.content}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1 flex-wrap min-w-0">
                  {departments(template).length > 0 ? (
                    departments(template).slice(0, 2).map((d: any) => (
                      <span key={d.id} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {locale === 'ar' ? d.name_ar : d.name_en}
                      </span>
                    ))
                  ) : (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t.templates}</span>
                  )}
                </div>
                <div className="flex items-center flex-shrink-0">
                  <Copy className="w-4 h-4 me-1" />
                  <span>قالب</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              {selectedTemplate?.trigger}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {departments(selectedTemplate).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Building2 className="size-4" />
                    {locale === 'ar' ? 'الأقسام المرتبطة' : 'Associated Departments'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {departments(selectedTemplate).map((d: any) => (
                      <Badge key={d.id} variant="secondary">
                        {locale === 'ar' ? d.name_ar : d.name_en}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">
                  {locale === 'ar' ? 'المحتوى' : 'Content'}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                  {selectedTemplate?.content}
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
