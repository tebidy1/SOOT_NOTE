'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/lib/services/dashboard.service";
import { Building2, Users, FileText, TrendingUp, Activity, Calendar, ShieldCheck, UserCog, UserCheck, Wifi, Clock, UserPlus, AlertTriangle } from 'lucide-react';
import { useI18n } from "@/providers/i18n-provider";

interface Statistics {
  companies?: {
    total?: number;
    active?: number;
    suspended?: number;
    created_today?: number;
    created_this_week?: number;
    created_this_month?: number;
  };
  users?: {
    total?: number;
    admins?: number;
    company_managers?: number;
    members?: number;
    active?: number;
    online?: number;
    created_today?: number;
    created_this_week?: number;
    created_this_month?: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await dashboardService.getStatistics();
      setStatistics(stats);
    } catch (e: any) {
      setError(e?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <p className="text-destructive font-semibold mb-2">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Activity className="size-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-semibold">No data available</p>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Companies',
      value: statistics.companies?.total?.toString() ?? '0',
      icon: Building2,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/15',
      color: 'text-blue-600',
      borderColor: 'border-blue-500/20',
      onClick: () => router.push('/admin/companies'),
    },
    {
      title: 'Users',
      value: statistics.users?.total?.toString() ?? '0',
      icon: Users,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/15',
      color: 'text-emerald-600',
      borderColor: 'border-emerald-500/20',
      onClick: () => router.push('/admin/users'),
    },
    {
      title: 'Templates',
      value: 'Manage',
      icon: FileText,
      gradient: 'from-orange-500/20 to-orange-600/5',
      iconBg: 'bg-orange-500/15',
      color: 'text-orange-600',
      borderColor: 'border-orange-500/20',
      onClick: () => router.push('/admin/templates'),
    },
  ];

  const companiesStats = [
    { label: 'Total', value: statistics.companies?.total?.toString() ?? '0', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Active', value: statistics.companies?.active?.toString() ?? '0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Suspended', value: statistics.companies?.suspended?.toString() ?? '0', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
    { label: 'Today', value: statistics.companies?.created_today?.toString() ?? '0', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
    { label: 'This Week', value: statistics.companies?.created_this_week?.toString() ?? '0', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500/10' },
    { label: 'This Month', value: statistics.companies?.created_this_month?.toString() ?? '0', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  const usersStats = [
    { label: 'Total', value: statistics.users?.total?.toString() ?? '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Admins', value: statistics.users?.admins?.toString() ?? '0', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'Managers', value: statistics.users?.company_managers?.toString() ?? '0', icon: UserCog, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: 'Members', value: statistics.users?.members?.toString() ?? '0', icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-500/10' },
    { label: 'Active', value: statistics.users?.active?.toString() ?? '0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Online', value: statistics.users?.online?.toString() ?? '0', icon: Wifi, color: 'text-teal-600', bg: 'bg-teal-500/10' },
    { label: 'Today', value: statistics.users?.created_today?.toString() ?? '0', icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
    { label: 'This Week', value: statistics.users?.created_this_week?.toString() ?? '0', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500/10' },
    { label: 'This Month', value: statistics.users?.created_this_month?.toString() ?? '0', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  function StatGrid({ items, title }: { items: typeof companiesStats; title?: string }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((stat, idx) => (
          <div
            key={stat.label}
            className="group relative flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`relative p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-200`}>
              <stat.icon className={`size-4.5 ${stat.color}`} />
            </div>
            <div className="relative min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">{t.dashboardOverview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, idx) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className="group text-start"
          >
            <div className={`relative p-6 rounded-2xl border ${action.borderColor} bg-gradient-to-br ${action.gradient} transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 cursor-pointer overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div className={`p-3 rounded-xl ${action.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className={`size-6 ${action.color}`} />
                </div>
                <span className={`text-3xl font-black ${action.color}`}>
                  {action.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground/80 mt-4 font-semibold group-hover:text-foreground transition-colors">{action.title}</p>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Companies Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatGrid items={companiesStats} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Users Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatGrid items={usersStats} />
        </CardContent>
      </Card>
    </div>
  );
}
