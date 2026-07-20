'use client';
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SessionManager } from "@/components/auth/session-manager";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionManager>
            <RoleGuard allowedRoles={['admin']} fallbackPath="/auth/login">
                <DashboardLayout>{children}</DashboardLayout>
            </RoleGuard>
        </SessionManager>
    );
}
