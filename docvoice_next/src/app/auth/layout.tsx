'use client';

import { useEffect, useState } from 'react';
import { Footer } from '@/components/layouts/footer';
import { Header } from '@/components/layouts/header';
import { useI18n } from '@/providers/i18n-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div dir={mounted ? direction : 'ltr'} className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-white">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-card text-card-foreground p-8 sm:p-10 rounded-2xl border shadow-elevated animate-fade-in">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
