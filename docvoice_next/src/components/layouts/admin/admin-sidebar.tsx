"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Building, GanttChartSquare, LayoutDashboard, Settings, Users, User, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n-provider";
import { useSettingsStore } from "@/stores/settings-store";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { setActiveSection } = useSettingsStore();
  const [year, setYear] = useState<number>(0);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const links = [
    {
      title: t.dashboard,
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t.users,
      href: "/admin/users",
      icon: Users,
    },
    {
      title: t.roles,
      href: "/admin/roles",
      icon: GanttChartSquare,
    },
    {
        title: t.applicationSettings,
        href: "/admin/settings",
        icon: Globe,
        onClick: () => setActiveSection('site')
    },
    {
      title: t.myProfile,
      href: "/admin/settings",
      icon: User,
      onClick: () => setActiveSection('profile')
    },
  ];

  return (
    <Sidebar variant="dark">
      <SidebarHeader>
        <Link href="/admin/dashboard" className="flex items-center justify-center gap-2 py-2">
            <div className="w-8 h-8 bg-primary-foreground rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-primary">note_stack</span>
            </div>
            <span className="text-lg font-black italic tracking-tighter">Sootnote</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.href + (link.title)}>
              <Link
                href={link.href}
                onClick={link.onClick}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start",
                  pathname.startsWith(link.href) && "bg-accent text-accent-foreground"
                )}
              >
                <link.icon className="w-4 h-4 mr-2" />
                <span>{link.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-muted-foreground">
          Copyright &copy; {year || new Date().getFullYear()} Aramex
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
