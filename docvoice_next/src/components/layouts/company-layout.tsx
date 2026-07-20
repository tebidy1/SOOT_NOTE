'use client';

import { useRouter, usePathname } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { SessionManager } from '@/components/auth/session-manager';
import { BottomNav } from '@/components/scribe/bottom-nav';
import { useCreateNoteStore } from '@/stores/create-note-store';
import { CreateNoteDialog } from '@/app/company/inbox-notes/create-note-dialog';

export function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useCreateNoteStore((s) => s.isOpen);
  const onNoteCreated = useCreateNoteStore((s) => s.onNoteCreated);
  const close = useCreateNoteStore((s) => s.close);
  const setPendingNote = useCreateNoteStore((s) => s.setPendingNote);

  const handleNoteCreated = (note: any) => {
    // If there's a page-specific callback (e.g. from inbox-notes page), use it
    if (onNoteCreated) {
      onNoteCreated(note);
      return;
    }
    // Otherwise: store the note and navigate to inbox-notes to open it
    setPendingNote(note);
    if (!pathname?.startsWith('/company/inbox-notes')) {
      router.push('/company/inbox-notes');
    }
  };

  return (
    <RoleGuard allowedRoles={['manager']}>
      <SessionManager>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 pb-28">{children}</main>
          <BottomNav basePath="/company" />
          <CreateNoteDialog
            open={isOpen}
            onOpenChange={(o) => {
              if (!o) close();
            }}
            onNoteCreated={handleNoteCreated}
          />
        </div>
      </SessionManager>
    </RoleGuard>
  );
}

export default CompanyLayout;
