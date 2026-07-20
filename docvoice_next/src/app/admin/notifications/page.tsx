
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { NotificationItemSkeleton } from "@/components/notifications/notification-item-skeleton";
import { userNotificationService } from "@/lib/services/user-notification.service";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ar from "dayjs/locale/ar";

dayjs.extend(relativeTime);

export default function NotificationsPage() {
    const { t, locale } = useI18n();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await userNotificationService.getNotifications();
            console.log('Notifications response:', response);
            if (response && response.data && Array.isArray(response.data)) {
                setNotifications(response.data);
            } else if (response && Array.isArray(response)) {
                setNotifications(response);
            } else if (response && response.payload && Array.isArray(response.payload)) {
                setNotifications(response.payload);
            } else if (response && response.payload && response.payload.data && Array.isArray(response.payload.data)) {
                setNotifications(response.payload.data);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter((n: any) => !n.read_at).length;

    const handleMarkAllAsRead = async () => {
        try {
            await userNotificationService.markAllAsRead();
            setNotifications(notifications.map((n: any) => ({...n, read_at: new Date().toISOString()})));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTime = (date: string) => {
        if (!date) return '';
        const d = dayjs(date);
        if (locale === 'ar') {
            return d.locale(ar).fromNow();
        }
        return d.fromNow();
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.notificationsPageTitle}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-body">
                        {t.notificationsPageDesc.replace('{count}', unreadCount.toString())}
                    </p>
                </div>
                <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || loading}>
                    <span className="material-symbols-outlined me-2 text-base">done_all</span>
                    {t.markAllAsRead}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <div>
                                {[...Array(5)].map((_, i) => <NotificationItemSkeleton key={i} />)}
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif: any, index: number) => (
                            <div key={notif.id || index} className={cn(
                                "block p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                                !notif.read_at && "bg-primary/5 dark:bg-primary/10"
                            )}>
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "mt-1 size-10 rounded-full flex items-center justify-center shrink-0",
                                        !notif.read_at ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    )}>
                                        <span className="material-symbols-outlined text-xl">
                                            notifications
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 dark:text-white">{notif.data?.title || notif.type}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(notif.created_at)}</span>
                                                {!notif.read_at && <div className="size-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" title="Unread"></div>}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.data?.message || notif.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                        ) : (
                            <div className="text-center py-20">
                                <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                     <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">notifications_off</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t.allCaughtUp}</h3>
                                <p className="text-slate-500 dark:text-slate-500 mt-2">{t.noNewNotifications}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
