'use client';

import { useRouter, usePathname } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { SessionManager } from '@/components/auth/session-manager';
import { BottomNav } from '@/components/scribe/bottom-nav';
import { useCreateNoteStore } from '@/stores/create-note-store';
import { CreateNoteDialog } from '@/app/company/inbox-notes/create-note-dialog';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useCreateNoteStore((s) => s.isOpen);
  const close = useCreateNoteStore((s) => s.close);
  const onNoteCreated = useCreateNoteStore((s) => s.onNoteCreated);
  const setPendingNote = useCreateNoteStore((s) => s.setPendingNote);

  const handleNoteCreated = (note: any) => {
    if (onNoteCreated) {
      onNoteCreated(note);
      return;
    }
    setPendingNote(note);
    if (!pathname?.startsWith('/member/inbox-notes')) {
      router.push('/member/inbox-notes');
    }
  };

  return (
    <RoleGuard allowedRoles={['user']}>
      <SessionManager>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 pb-28">{children}</main>
          <BottomNav basePath="/member" secondaryRoute="inbox-notes" secondaryLabel="الملاحظات" />
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
