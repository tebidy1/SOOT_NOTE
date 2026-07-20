'use client';

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { ClientSidebar } from "./user-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { Breadcrumb } from "./breadcrumb";
import { DashboardFooter } from "./dashboard-footer";

export function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isMinimized } = useSidebarStore();
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; 
    }

    return (
        <div className="flex bg-gradient-to-b from-blue-50/50 to-white min-h-screen w-full">
            <aside className={cn(
                "fixed inset-y-0 start-0 z-10 hidden flex-col border-e bg-sidebar sm:flex transition-all duration-300 print:hidden shadow-md",
                isMinimized ? "w-20" : "w-64"
            )}>
                <ClientSidebar />
            </aside>
            <div className={cn(
                "flex flex-col flex-1 w-full transition-all duration-300",
                isMinimized ? "sm:ms-20" : "sm:ms-64"
            )}>
                <DashboardHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 print:p-0 print:m-0">
                    <Breadcrumb className="print:hidden" />
                    {children}
                </main>
                <DashboardFooter />
            </div>
        </div>
    );
}
