'use client';

import { useI18n } from '@/providers/i18n-provider';
import Image from 'next/image';
import Link from 'next/link';

function AuthImageAside() {
  return (
    <div className="relative hidden lg:flex h-full flex-col items-center justify-center bg-gray-900 px-12 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1579621970795-87f54f12c1d3?q=80&w=2070&auto=format&fit=crop"
          alt="Abstract background"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
      </div>
      <div className="relative z-10 text-center">
        <h2 className="text-4xl font-black italic tracking-tighter">Sootnote</h2>
        <p className="mt-4 text-xl font-light text-gray-300">
          منظومة الشحن الاحترافية لخدمات SaaS
        </p>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useI18n();
  return (
    <div dir={direction} className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50/30 text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <main className="flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center lg:text-start">
              <Link href="/" className="inline-block">
                <span className="text-4xl font-black italic text-primary">
                  Sootnote
                </span>
              </Link>
            </div>
            {children}
          </div>
        </main>
        <AuthImageAside />
      </div>
    </div>
  );
}
