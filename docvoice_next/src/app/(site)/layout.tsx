'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layouts/footer';
import { useI18n } from '@/providers/i18n-provider';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { direction } = useI18n();
  const isLanding = pathname === '/';

  return (
    <div dir={direction} className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50/50 to-white">
      <main className="flex-1">{children}</main>
      {!isLanding && <Footer />}
    </div>
  );
}
