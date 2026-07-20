'use client';

import { CompanyLayout } from '@/components/layouts/company-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CompanyLayout>{children}</CompanyLayout>;
}
