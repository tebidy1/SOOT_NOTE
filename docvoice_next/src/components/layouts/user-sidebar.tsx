'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/providers/i18n-provider";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, LogOut, Settings } from "lucide-react";
import React from "react";
import { useAuth } from "../auth/auth-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSettingsStore } from "@/stores/settings-store";

type NavItem = {
    type: 'link';
    name: string;
    icon: string;
    href: string;
    onClick?: () => void;
};
type NavCollapsible = {
    type: 'collapsible';
    name: string;
    icon: string;
    path: string;
    children: { href: string; name: string }[];
};


export function ClientSidebar({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { t } = useI18n();
    const { isMinimized } = useSidebarStore();
    const { user, signOut } = useAuth();
    const { setActiveSection } = useSettingsStore();

    const userRole = user?.role?.toLowerCase();

    const adminNavItems: (NavItem | NavCollapsible)[] = [
        { type: 'link', name: t.dashboard, icon: 'dashboard', href: '/admin/dashboard' },
        { type: 'link', name: t.companies, icon: 'business', href: '/admin/companies' },
        { type: 'link', name: t.templates, icon: 'article', href: '/admin/templates' },
        {
            type: 'collapsible',
            name: "إدارة المستخدمين",
            icon: 'admin_panel_settings',
            path: '/admin/users',
            children: [
                { href: "/admin/users", name: "المستخدمين" },
            ]
        },
        {
            type: 'link',
            name: t.applicationSettings,
            icon: 'business',
            href: '/admin/company-settings'
        }
    ];

    const managerNavItems: (NavItem | NavCollapsible)[] = [
        { type: 'link', name: t.dashboard, icon: 'dashboard', href: '/company/dashboard' },
        { type: 'link', name: t.users, icon: 'people', href: '/company/members' },
        { type: 'link', name: 'الملاحظات', icon: 'note_stack', href: '/company/inbox-notes' },
        { type: 'link', name: t.templates, icon: 'article', href: '/company/templates' },
        { type: 'link', name: t.settings, icon: 'settings', href: '/company/settings' },
    ];

    const memberNavItems: (NavItem | NavCollapsible)[] = [
        { type: 'link', name: t.dashboard, icon: 'dashboard', href: '/member/dashboard' },
        { type: 'link', name: t.templates, icon: 'article', href: '/member/templates' },
    ];

    const navItems = userRole === 'admin' ? adminNavItems
        : userRole === 'manager' ? managerNavItems
        : memberNavItems;

    return (
        <div className="flex h-full max-h-screen flex-col">
            <div className={cn(
                "flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6",
                isMinimized && "justify-center px-2"
            )}>
                <Link href="/admin/dashboard" onClick={onLinkClick} className="flex items-center gap-2 font-semibold">
                    <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform hover:scale-105">
                        <span className="material-symbols-outlined text-xl text-white">note_stack</span>
                    </div>
                    {!isMinimized && (
                        <span className="text-lg font-black italic tracking-tighter text-primary">{t.aramex}</span>
                    )}
                </Link>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    if (item.type === 'link') {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name + item.href}
                                href={item.href}
                                onClick={() => {
                                    if (item.onClick) item.onClick();
                                    if (onLinkClick) onLinkClick();
                                }}
                                title={isMinimized ? item.name : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isMinimized && "justify-center",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                )}
                            >
                                <span className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110">{item.icon}</span>
                                {!isMinimized && <p className="text-sm font-bold">{item.name}</p>}
                            </Link>
                        );
                    }
                    if (item.type === 'collapsible') {
                        const isOpen = pathname.startsWith(item.path);
                        return (
                            <Collapsible key={item.name} defaultOpen={isOpen} className="space-y-0.5">
                                <CollapsibleTrigger
                                    title={isMinimized ? item.name : undefined}
                                    className={cn(
                                        "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                        isMinimized && "justify-center",
                                        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                                        isOpen && "bg-sidebar-accent text-sidebar-foreground font-bold"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110">{item.icon}</span>
                                    {!isMinimized && <p className="text-sm font-bold flex-1 text-start">{item.name}</p>}
                                    {!isMinimized && <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className={cn("transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", isMinimized && "hidden")}>
                                    <div className="pt-1 pe-3 space-y-0.5 border-s-2 border-sidebar-border/50 ms-5 mt-0.5">
                                        {item.children.map(child => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                                <Link key={child.href} href={child.href} onClick={onLinkClick}>
                                                    <div className={cn("flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-bold",
                                                        isChildActive
                                                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                                                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                                    )}>
                                                        {child.name}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    }
                    return null;
                })}
            </nav>

            <div className="mt-auto border-t border-sidebar-border p-2 bg-sidebar-accent/30">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex w-full items-center gap-3 rounded-xl p-2 text-start transition-all hover:bg-sidebar-accent",
                            isMinimized && "justify-center"
                        )}>
                            <Avatar className="h-9 w-9 border-2 border-sidebar shadow-sm ring-1 ring-sidebar-ring/20">
                                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.name ?? ''} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{user?.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                            </Avatar>
                            {!isMinimized && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate text-sidebar-foreground">{user?.name}</p>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-tighter truncate">{user?.role}</p>
                                </div>
                            )}
                            {!isMinimized && <ChevronUp className="h-4 w-4 text-sidebar-foreground/40" />}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mb-2 p-2 rounded-2xl shadow-elevated border-border/50" side="top" align="start" sideOffset={10}>
                        <DropdownMenuLabel className="font-normal px-2 py-3">
                            <div className="flex flex-col space-y-1 text-start">
                                <p className="text-sm font-bold leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup className="p-1">
                            {user?.role === 'admin' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/dashboard" className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors">
                                        <span className="material-symbols-outlined text-xl text-muted-foreground">admin_panel_settings</span>
                                        <span className="font-semibold">لوحة الإدارة</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {user?.role === 'manager' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/company/dashboard" className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors">
                                        <span className="material-symbols-outlined text-xl text-muted-foreground">business</span>
                                        <span className="font-semibold">لوحة الشركة</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {user?.role === 'user' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/member/dashboard" className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors">
                                        <span className="material-symbols-outlined text-xl text-muted-foreground">dashboard</span>
                                        <span className="font-semibold">الرئيسية</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/admin/profile"
                                    className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl text-muted-foreground">person</span>
                                    <span className="font-semibold">الملف الشخصي</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/admin/settings"
                                    onClick={() => setActiveSection('profile')}
                                    className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors"
                                >
                                    <Settings className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-semibold">{t.settings}</span>
                                </Link>
                            </DropdownMenuItem>
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={user?.role === 'admin' ? '/admin/company-settings' : '/company/settings'}
                                        className="flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl text-muted-foreground">business</span>
                                        <span className="font-semibold">{t.applicationSettings}</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                            <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-3 w-full cursor-pointer py-2.5 rounded-xl px-2 transition-colors">
                                <LogOut className="h-5 w-5" />
                                <span className="font-bold">{t.logout}</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}