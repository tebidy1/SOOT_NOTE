"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isChecking = loading;
  const isAuthorized = !loading && !!user && (!requiredRole || user.role === requiredRole);

  useEffect(() => {
    if (!isChecking && !user) {
        router.replace("/auth/login");
    }
    if (!isChecking && user && requiredRole && user.role !== requiredRole) {
      const role = user.role?.toLowerCase();
      switch (role) {
        case 'admin':
          router.replace('/admin/dashboard');
          break;
        case 'manager':
          router.replace('/company/dashboard');
          break;
        case 'user':
        default:
          router.replace('/member/dashboard');
          break;
      }
    }
  }, [isChecking, user, requiredRole, router]);

  return { isAuthorized, isChecking, user };
}
