"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/providers/i18n-provider";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, LifeBuoy, LogOut, PanelLeftClose, PanelRight, PanelRightClose, Settings, CheckCheck, Search, Bell, User } from "lucide-react";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useState, useEffect } from "react";
import { ClientSidebar } from "./user-sidebar";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { userNotificationService } from "@/lib/services/user-notification.service";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ar from "dayjs/locale/ar";

dayjs.extend(relativeTime);

export function DashboardHeader() {
    const { user, signOut } = useAuth();
    const { t, direction, locale } = useI18n();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isMinimized, toggle: toggleSidebar } = useSidebarStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        const interval = setInterval(() => {
            loadNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await userNotificationService.getNotifications();
           
                setNotifications(response.data || []);
           
        } catch (error) {
         } finally {
            setIsLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await userNotificationService.markAsRead(id);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await userNotificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({...n, read_at: new Date().toISOString()})));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const formatTime = (date: string) => {
        const d = dayjs(date);
        if (locale === 'ar') {
            return d.locale(ar).fromNow();
        }
        return d.fromNow();
    };
    
    return (
        <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md sm:static sm:bg-transparent print:hidden">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <PanelRight className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs p-0 bg-card border-none">
                            <SheetHeader className="sr-only">
                               <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <ClientSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            onClick={toggleSidebar}
                        >
                            {isMinimized ? (
                            <PanelRightClose className="h-5 w-5" />
                            ) : (
                            <PanelLeftClose className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle sidebar</span>
                        </Button>
                    {/* Desktop Search */}
                    <form className="hidden w-full max-w-sm items-center gap-2 sm:flex">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                                placeholder={`${t.search}...`}
                                type="text"
                                className="h-9 ps-9"
                            />
                        </div>
                    </form>
                </div>
                
                <div className="flex items-center gap-2">
                    <InstallPrompt />
                    <LanguageSwitcher />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative p-2 rounded-xl hover:bg-accent/50 transition-colors">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    {unreadCount > 0 && (
                                    <span className="absolute top-1.5 end-1.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                    </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80 md:w-96 shadow-elevated border-border/50" align={direction === 'rtl' ? 'start' : 'end'} sideOffset={8}>
                                <DropdownMenuLabel>
                                    <div className="flex items-center justify-between px-1">
                                        <p className="font-bold">{t.notifications}</p>
                                        {unreadCount > 0 ? (
                                            <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-colors">
                                                <CheckCheck className="h-3 w-3" />
                                                {t.markAllAsRead}
                                            </button>
                                        ) : null }
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-72">
                                    <div className="p-1 space-y-1">
                                        {isLoading ? (
                                            <div className="text-center py-10 text-sm text-muted-foreground">
                                                جاري التحميل...
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((notif, index) => (
                                            <DropdownMenuItem key={notif.id || index} asChild>
                                                <div className={cn(
                                                "flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer !block transition-colors",
                                                !notif.read_at && "bg-primary/5"
                                                )}>
                                                <div className="flex w-full items-center justify-between">
                                                    <p className={cn("text-sm font-semibold text-start flex-1", !notif.read_at ? "text-foreground" : "text-muted-foreground")}>{notif.data?.title || notif.title}</p>
                                                    {!notif.read_at && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>}
                                                </div>
                                                <p className="text-xs text-muted-foreground text-start">{notif.data?.message || notif.message}</p>
                                                <div className="flex w-full items-center justify-between mt-1">
                                                    <p className="text-[10px] text-muted-foreground/70 text-start">{formatTime(notif.created_at)}</p>
                                                    {!notif.read_at && (
                                                        <button 
                                                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                                                            className="text-[10px] text-primary hover:underline font-medium"
                                                        >
                                                            تحديد كمقروء
                                                        </button>
                                                    )}
                                                </div>
                                                </div>
                                            </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-sm text-muted-foreground">
                                                لا توجد إشعارات
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <DropdownMenuSeparator />
                                <div className="p-1">
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/notifications" className="w-full justify-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                            {t.viewAllNotifications}
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="h-8 w-px bg-border/50 hidden sm:block"></div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 focus:outline-none p-1 rounded-xl hover:bg-accent/30 transition-colors">
                                    <div className="text-end hidden sm:block">
                                        <p className="text-xs font-bold">{user?.name || 'User'}</p>
                                        <p className="text-[10px] text-primary font-bold">{t.premiumMember}</p>
                                    </div>
                                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm ring-1 ring-primary/10">
                                        <AvatarImage src={user?.photoURL ?? undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{user?.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 shadow-elevated border-border/50" align={direction === 'rtl' ? 'start' : 'end'} forceMount sideOffset={8}>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1 text-start">
                                        <p className="text-sm font-bold leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/settings" className="flex items-center gap-2 w-full cursor-pointer transition-colors">
                                            <Settings className="h-4 w-4" />
                                            <span>{t.settings}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/profile" className="flex items-center gap-2 w-full cursor-pointer transition-colors">
                                            <User className="h-4 w-4" />
                                            <span>{t.profile}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                   
                                    
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 w-full cursor-pointer transition-colors">
                                    <LogOut className="h-4 w-4" />
                                    <span>{t.logout}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                </div>
            </div>
            {/* Mobile Search */}
            <div className="px-4 pb-4 sm:hidden">
                <form className="flex w-full items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                            placeholder={`${t.search}...`}
                            type="text"
                            className="h-9 ps-9 flex-1"
                        />
                    </div>
                </form>
            </div>
        </header>
    )
}
