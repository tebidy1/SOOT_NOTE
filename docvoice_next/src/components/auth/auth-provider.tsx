
"use client";

import { UserProvider } from "@/auth_mock/auth/use-user";

// This component is now a wrapper around UserProvider
// It keeps the imports in other files clean and consistent
// while allowing the user logic to be in its own file.
export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <UserProvider>{children}</UserProvider>
}

export { useUser as useAuth } from "@/auth_mock/auth/use-user";
