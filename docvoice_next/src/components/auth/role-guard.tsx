'use client';

import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

type UserRole = 'Admin' | 'manager' | 'user';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const normalizedRole = user.role?.toLowerCase() as Lowercase<UserRole>;
    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (!allowed.includes(normalizedRole)) {
      if (fallbackPath) {
        router.replace(fallbackPath);
      } else {
        switch (normalizedRole) {
          case 'admin':
            router.replace('/admin/dashboard');
            break;
          case 'manager':
            router.replace('/company/dashboard');
            break;
          case 'user':
            router.replace('/member/dashboard');
            break;
          default:
            router.replace('/auth/login');
        }
      }
    }
  }, [user, loading, allowedRoles, fallbackPath, router]);

  if (loading) return <LoadingScreen message="جاري التحقق من الصلاحيات..." />;

  if (!user) return null;

  const normalizedRole = user.role?.toLowerCase() as Lowercase<UserRole>;
  const allowed = allowedRoles.map(r => r.toLowerCase());

  if (!allowed.includes(normalizedRole)) return null;

  return <>{children}</>;
}
