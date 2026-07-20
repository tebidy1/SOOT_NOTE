'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
};

export function NavLink({ href, children, onClick, className }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:text-primary",
                "pb-1 border-b-2",
                isActive ? "border-primary text-primary" : "border-transparent hover:border-primary/30",
                className
            )}
        >
            {children}
        </Link>
    );
}
