"use client";

import { useState, useEffect } from "react";
import { authService } from "@/lib/services/auth.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Monitor, Smartphone, Tablet, Globe, LogOut } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";
import { handleApiResponse, handleApiError } from "@/lib/notification.service";

interface Session {
    id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    is_current: boolean;
}

export function ActiveSessions() {
    const { t } = useI18n();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<number | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);

    const fetchSessions = async () => {
        try {
            const response = await authService.getSessions();
            
                setSessions(response || []);
           
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (tokenId: number) => {
        setRevoking(tokenId);
        try {
            const response = await authService.revokeSession(tokenId);
          
            if (response.status === true) {
                setSessions(prev => prev.filter(s => s.id !== tokenId));
            }
        } catch (error: any) {
            
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        if (!confirm("هل أنت متأكد من إنهاء جميع الجلسات الأخرى؟")) {
            return;
        }
        
        setRevokingAll(true);
        try {
            const response = await authService.revokeAllSessions();
         
            fetchSessions();
                 
           
        } catch (error: any) {
            
        } finally {
            setRevokingAll(false);
        }
    };

    const getDeviceIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('mobile') || lowerName.includes('phone')) {
            return <Smartphone className="h-4 w-4" />;
        }
        if (lowerName.includes('tablet') || lowerName.includes('ipad')) {
            return <Tablet className="h-4 w-4" />;
        }
        if (lowerName.includes('web') || lowerName.includes('browser')) {
            return <Globe className="h-4 w-4" />;
        }
        return <Monitor className="h-4 w-4" />;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const labels = {
        activeSessions: 'الجلسات النشطة',
        sessionsDesc: 'إدارة جلسات تسجيل الدخول النشطة',
        sessionsCount: `${sessions.length} جلسة نشطة`,
        revokeAll: 'إنهاء الكل',
        noSessions: 'لا توجد جلسات نشطة',
        current: 'الحالية',
        lastUsed: 'آخر استخدام',
        created: 'تاريخ الإنشاء',
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{labels.activeSessions}</CardTitle>
                    <CardDescription>{labels.sessionsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const otherSessionsCount = sessions.filter(s => !s.is_current).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{labels.activeSessions}</CardTitle>
                    <CardDescription>{labels.sessionsCount}</CardDescription>
                </div>
                {otherSessionsCount > 0 && (
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleRevokeAll}
                        disabled={revokingAll}
                    >
                        {revokingAll ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <LogOut className="h-4 w-4 me-2" />
                                {labels.revokeAll}
                            </>
                        )}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {sessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                        {labels.noSessions}
                    </p>
                ) : (
                    <>
                        {sessions.map((session) => (
                            <div key={session.id}>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                            {getDeviceIcon(session.name)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{session.name}</span>
                                                {session.is_current && (
                                                    <Badge variant="default" className="text-xs">
                                                        {labels.current}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {session.last_used_at 
                                                    ? `${labels.lastUsed} ${formatDate(session.last_used_at)}`
                                                    : `${labels.created} ${formatDate(session.created_at)}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRevokeSession(session.id)}
                                            disabled={revoking === session.id}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            {revoking === session.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <Separator className="mt-4" />
                            </div>
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
