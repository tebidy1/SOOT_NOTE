'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowRight } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

export default function NotFound() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-muted/20">
            <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
                <div className="relative">
                    <div className="text-[180px] font-black text-muted-foreground/5 select-none leading-none tracking-tighter">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-inner">
                            <Search className="w-16 h-16 text-primary/60" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        الصفحة غير موجودة
                    </h1>
                    <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-md mx-auto">
                        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Link href="/">
                        <Button size="lg" className="gap-2.5 text-lg h-14 px-8 rounded-xl shadow-md hover:shadow-lg transition-all">
                            <Home className="w-5 h-5" />
                            الصفحة الرئيسية
                        </Button>
                    </Link>
                    <Link href="/admin/dashboard">
                        <Button size="lg" variant="outline" className="gap-2.5 text-lg h-14 px-8 rounded-xl transition-all">
                            لوحة التحكم
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                <div className="pt-10 border-t border-border/30">
                    <p className="text-sm text-muted-foreground/60 mb-4 font-medium">
                        الروابط الشائعة:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Link href="/admin/users" className="text-sm font-medium text-muted-foreground/80 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                            المستخدمون
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <Link href="/admin/roles" className="text-sm font-medium text-muted-foreground/80 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                            الأدوار والصلاحيات
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <Link href="/admin/settings" className="text-sm font-medium text-muted-foreground/80 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                            الإعدادات
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
