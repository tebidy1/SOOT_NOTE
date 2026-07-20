"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser as useAuth } from "@/auth_mock/auth/use-user";
import { LoadingScreen } from "@/components/loading-screen";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return fallback ? <>{fallback}</> : <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
