'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';

export function DashboardFooter() {
    const { t } = useI18n();
    const [year, setYear] = useState<number>(0);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    const links = [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Help Center", href: "#" },
    ];

    return (
        <footer className="px-6 py-4 border-t bg-background print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    &copy; {year || new Date().getFullYear()} {t.aramex}. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    {links.map((link) => (
                        <Link key={link.label} href={link.href} className="text-xs text-muted-foreground hover:text-foreground">
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}
