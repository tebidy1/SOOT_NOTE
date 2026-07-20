"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/auth_mock/auth/use-user";

interface SessionManagerProps {
  children: React.ReactNode;
  checkInterval?: number;
}

export function SessionManager({ children, checkInterval = 120000 }: SessionManagerProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (loading || hasChecked.current) return;
    hasChecked.current = true;

    const check = () => {
      if (!localStorage.getItem("auth_token")) {
        router.push("/auth/login");
      }
    };

    check();
    const interval = setInterval(check, checkInterval);

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loading, router, checkInterval]);

  return <>{children}</>;
}
