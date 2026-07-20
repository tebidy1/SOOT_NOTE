'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/providers/i18n-provider';
import { Lock, User, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

export function SettingsSidebar() {
    const { t } = useI18n();
    const { activeSection, setActiveSection } = useSettingsStore();

    const pageSections = [
        { id: 'profile', name: t.profile, icon: User },
        { id: 'security', name: t.security || "Security", icon: Lock },
        { id: 'sessions', name: t.activeSessions || "Active Sessions", icon: Monitor },
    ];
    
    return (
        <aside className="w-full md:w-64 md:flex-shrink-0">
            <nav className="flex flex-col gap-1">
                {pageSections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors text-start w-full",
                            activeSection === section.id
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <section.icon className="h-5 w-5" />
                        <span>{section.name}</span>
                    </button>
                ))}
            </nav>
        </aside>
    )
}
