'use client';

import Link from 'next/link';
import { Menu, LogOut, Settings, CreditCard, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from './nav-link';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useI18n } from '@/providers/i18n-provider';
import { LanguageSwitcher } from '../language-switcher';

const navLinks = [
    { name: 'Features', i18nKey: 'features', href: '/#features' },
    { name: 'Pricing', i18nKey: 'pricing', href: '/#pricing' },
    { name: 'Contact', i18nKey: 'contactUs', href: '/#contact' },
    { name: 'Support', i18nKey: 'support', href: '/admin/support' },
];

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
    const { t } = useI18n();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const translatedNavLinks = navLinks.map(link => ({...link, name: t[link.i18nKey as keyof typeof t] || link.name}));

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
                            <span className="material-symbols-outlined text-xl text-white">local_shipping</span>
                        </div>
                        <span className="text-xl font-black italic text-primary tracking-tight">{t.aramex}</span>
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {translatedNavLinks.map((item) => (
                            <NavLink key={item.name} href={item.href}>
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Desktop Actions */}
                <div className="hidden items-center gap-2 lg:flex">
                    <InstallPrompt />
                    <LanguageSwitcher />
                    <div className="h-5 w-px bg-border/50"></div>

                    {user ? (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent/50">
                                    <Avatar className="h-9 w-9 ring-1 ring-primary/10">
                                        <AvatarImage src={user.photoURL ?? undefined} alt={user.name || ''} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 shadow-elevated border-border/50" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild><Link href="/admin/profile" className="cursor-pointer transition-colors"><span className="material-symbols-outlined mr-2 h-4 w-4 text-base">person</span><span>الملف الشخصي</span></Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/admin/settings" className="cursor-pointer transition-colors"><Settings className="mr-2 h-4 w-4" /><span>{t.settings}</span></Link></DropdownMenuItem>
                                    </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer transition-colors"><LogOut className="mr-2 h-4 w-4" /><span>{t.logout}</span></DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <div className="flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="ghost" className="text-sm font-bold hover:text-primary transition-colors">
                                    {t.login}
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="rounded-xl px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all text-sm h-10 font-bold">
                                    {t.register}
                                </Button>
                            </Link>
                         </div>
                    )}
                </div>

                {/* Mobile Menu */}
                <div className="lg:hidden">
                    {isMounted ? (
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] p-0 bg-background border-s">
                                <div className="flex h-full flex-col">
                                    <div className="p-6 border-b border-border/50">
                                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                                                <span className="material-symbols-outlined text-xl text-white">local_shipping</span>
                                            </div>
                                            <span className="text-xl font-black italic text-primary">{t.aramex}</span>
                                        </Link>
                                    </div>
                                    <nav className="flex flex-col gap-1 p-4">
                                        {translatedNavLinks.map((item) => (
                                            <NavLink key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors">
                                                {item.name}
                                            </NavLink>
                                        ))}
                                    </nav>
                                    <div className="p-6 border-t border-border/50 flex items-center gap-2">
                                        <LanguageSwitcher />
                                    </div>
                                    <div className="mt-auto border-t border-border/50 p-6">
                                        {user ? (
                                            <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full h-12 text-base bg-primary hover:bg-primary/90 rounded-xl">
                                                Logout
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <Button variant="outline" className="w-full h-12 rounded-xl text-base font-bold">
                                                        {t.login}
                                                    </Button>
                                                </Link>
                                                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-bold">
                                                        {t.register}
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                            <Menu className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}