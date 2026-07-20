import { Providers } from '@/providers';
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { RegisterSW } from '@/components/pwa/register-sw';
import { FloatingInstallButton } from '@/components/pwa/floating-install-button';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Sootnote - المنصة المتكاملة للتدوين الصوتي والتنظيم',
  description: 'منصة سحابية متطورة للتدوين الصوتي، الملاحظات، وإدارة المهام بذكاء واحترافية.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sootnote',
  },
  applicationName: 'Sootnote',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is needed because of next-themes
    <html suppressHydrationWarning lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" media="print" onload="this.media='all'" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-gradient-to-b from-blue-50/50 to-white font-sans antialiased",
          cairo.variable
        )}
      >
        <Providers>
            {children}
        </Providers>
        <RegisterSW />
        <FloatingInstallButton />
      </body>
    </html>
  );
}
