
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { cn } from '@/lib/utils';
import React from 'react';

const breadcrumbNameMap: { [key: string]: string } = {
    'clients': 'clients',
    'dashboard': 'Dashboard',
    'shipments': 'Shipments',
    'new': 'New',
    'from': 'From',
    'to': 'To',
    'details': 'Details',
    'pay': 'Payment',
    'addresses': 'Addresses',
    'payments': 'Payments',
    'support': 'Support',
    'settings': 'Settings',
    'profile': 'Profile',
    'edit-desktop': 'Edit',
    'email': 'Email',
    'company-settings': 'Company Settings'
};

export function Breadcrumb({ className }: { className?: string }) {
    const pathname = usePathname();
    const { t } = useI18n();

    const pathSegments = pathname.split('/').filter(segment => segment);
    
    if (pathSegments.length <= 1 || (pathSegments[0] === 'clients' && pathSegments[1] === 'dashboard')) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={cn("mb-6 -mt-4", className)}>
            <ol className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <li>
                    <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">{t.home}</Link>
                </li>
                {pathSegments.slice(1).map((segment, index) => {
                    const isLast = index === pathSegments.length - 2;
                    const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
                    const name = breadcrumbNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                    return (
                        <React.Fragment key={href}>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="h-4 w-4" />
                                {isLast ? (
                                    <span className="font-semibold text-foreground">{name}</span>
                                ) : (
                                    <Link href={href} className="hover:text-foreground transition-colors">
                                        {name}
                                    </Link>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
