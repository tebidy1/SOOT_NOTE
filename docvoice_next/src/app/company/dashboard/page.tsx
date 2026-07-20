'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/providers/i18n-provider';
import { companyDashboardService } from '@/lib/services/company-dashboard.service';
import { inboxNoteService } from '@/lib/services/inbox-note.service';
import { Logo } from '@/components/scribe/logo';
import { ProfileMenu } from '@/components/scribe/profile-menu';
import { AnimatedRecordButton } from '@/components/scribe/animated-record-button';
import { useCreateNoteStore } from '@/stores/create-note-store';
import { useRecordingStore } from '@/stores/recording-store';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

const statusLabel: Record<string, string> = {
  pending: 'قيد الانتظار',
  processed: 'قيد المعالجة',
  completed: 'مكتملة',
  archived: 'مؤرشفة',
};

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const openCreateNote = useCreateNoteStore((s) => s.open);
  const isRecording = useRecordingStore((s) => s.isRecording);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['company-dashboard'],
    queryFn: () => companyDashboardService.getStatistics(),
  });

  const { data: recentResponse } = useQuery({
    queryKey: ['inbox-notes-recent'],
    queryFn: () => inboxNoteService.getNotes({ page: 1, per_page: 3 }),
  });

  const recentNotes = (recentResponse as any)?.data || [];

  if (isLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  const data = stats as any;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Logo className="h-12 w-auto" variant="dark" />
        <ProfileMenu baseUrl="/company" />
      </div>

      {/* Welcome banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl p-4 text-white shadow-md">
        <h2 className="text-lg font-bold">مرحباً بعودتك، {user?.name || 'دكتور'}</h2>
        <p className="text-xs text-blue-100 mt-0.5">جاهز للتوثيق الصوتي؟</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center me-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">إجمالي الملاحظات</div>
              <div className="text-xl font-bold">{data?.inbox_notes?.total ?? '--'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center me-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">معلقة</div>
              <div className="text-xl font-bold">{data?.inbox_notes?.pending ?? '--'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/company/inbox-notes"
            className="bg-white rounded-xl shadow-md p-4 text-start hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center me-3">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{t.details}</div>
                <div className="text-sm text-gray-600">{data?.inbox_notes?.today ?? 0} اليوم</div>
              </div>
            </div>
          </a>

          <a
            href="/company/templates"
            className="bg-white rounded-xl shadow-md p-4 text-start hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center me-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{t.templates}</div>
                <div className="text-sm text-gray-600">المكتبة</div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Record */}
      <div className="text-center mb-8">
        <div className="text-sm text-gray-600 mb-4">ابدأ جلسة تسجيل جديدة</div>
        <div className="flex justify-center">
          <AnimatedRecordButton
            isRecording={isRecording}
            onClick={() => openCreateNote()}
            size="large"
          />
        </div>
        <p className="mt-4 text-sm text-gray-600">اضغط لبدء التوثيق الصوتي</p>
      </div>

      {/* Recent Notes */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-3">أحدث الملاحظات</h3>
        <div className="space-y-3">
          {recentNotes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">لا توجد ملاحظات بعد</p>
          ) : (
            recentNotes.map((note: any) => (
              <div key={note.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {note.patient_name && note.patient_name !== 'Untitled' ? note.patient_name : `ملاحظة #${note.id}`}
                  </div>
                  <div className="text-sm text-gray-600">{formatDate(note.created_at)}</div>
                </div>
                <div className={`px-3 py-1 text-xs rounded-full ${statusBadge[note.status] || statusBadge.archived}`}>
                  {statusLabel[note.status] || note.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
