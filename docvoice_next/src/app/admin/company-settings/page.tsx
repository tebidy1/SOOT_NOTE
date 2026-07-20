'use client';

import { ApplicationSettingsForm } from "@/components/forms/application-settings-form";
import { useI18n } from "@/providers/i18n-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingScreen } from "@/components/loading-screen";
import { ShieldAlert } from "lucide-react";

export default function CompanySettingsPage() {
    const { t } = useI18n();
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen message="Loading settings..." />;
    
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <ShieldAlert className="size-12 text-warning mb-4" />
                <h2 className="text-xl font-bold">يرجى تسجيل الدخول للوصول لهذه الصفحة</h2>
                <p className="text-muted-foreground mt-2">تحتاج إلى تسجيل الدخول لاستعراض إعدادات الشركة.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.applicationSettings}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-body">{t.applicationSettingsDesc}</p>
            </div>
            
            <ApplicationSettingsForm />
        </div>
    );
}
