'use client';

import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { dataURLtoFile } from '@/lib/image-utils';
import { clientService } from '@/lib/services';
import { authCookies } from '@/lib/auth-cookies';

interface UserContextType {
    user: User | null;
    loading: boolean;
    updateUser: (data: Partial<User>) => Promise<void>;
    signOut: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ user: User }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mapBackendUserToType = (backendUser: any): User => {
    let avatarUrl = backendUser.avatar || '';

    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        avatarUrl = `${baseUrl.replace(/\/$/, '')}/${avatarUrl.replace(/^\//, '')}`;
    }

    const rawRole = backendUser.role || 'user';
    const normalizedRole = rawRole.toLowerCase()
        .replace('company_manager', 'manager')
        .replace('member', 'user');

    return {
        id: backendUser.id?.toString() || '',
        uid: backendUser.id?.toString() || '',
        email: backendUser.email || '',
        name: backendUser.name || '',
        phone: backendUser.phone_number || '',
        photoURL: avatarUrl,
        company_id: backendUser.company_id?.toString() || '',
        role: normalizedRole,
        createdAt: backendUser.created_at || new Date().toISOString(),
        notifications: backendUser.notifications || { sms: true, email: false },
    };
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const syncAuthCookies = useCallback((userData: User | null) => {
        if (userData) {
            authCookies.setRole(userData.role);
            authCookies.setUser({
                id: userData.id,
                name: userData.name,
                role: userData.role,
                company_id: userData.company_id,
            });
        } else {
            authCookies.clearAll();
        }
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!clientService.isAuthenticated()) {
                setLoading(false);
                return;
            }

            const cachedUser = localStorage.getItem('aramex_user');

            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/login')) {
                if (cachedUser) {
                    try {
                        const parsed = JSON.parse(cachedUser);
                        setUser(parsed);
                        syncAuthCookies(parsed);
                    } catch {}
                    setLoading(false);
                    return;
                }
                clientService.clearToken();
                setUser(null);
                syncAuthCookies(null);
                setLoading(false);
                return;
            }

            if (cachedUser) {
                try {
                    const parsed = JSON.parse(cachedUser);
                    setUser(parsed);
                    syncAuthCookies(parsed);
                } catch {}
            }

            try {
                const response = await clientService.getCurrentUser();
                if (response) {
                    const mappedUser = mapBackendUserToType(response);
                    setUser(mappedUser);
                    localStorage.setItem('aramex_user', JSON.stringify(mappedUser));
                    syncAuthCookies(mappedUser);
                }
            } catch (error: any) {
                console.error('Error fetching user:', error);
                if (error?.status === 401) {
                    clientService.clearToken();
                    localStorage.removeItem('aramex_user');
                    setUser(null);
                    syncAuthCookies(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const response = await clientService.login(email, password);

            if (response?.token && response?.user) {
                const mappedUser = mapBackendUserToType(response.user);
                setUser(mappedUser);
                localStorage.setItem('aramex_user', JSON.stringify(mappedUser));
                syncAuthCookies(mappedUser);
                return { user: mappedUser };
            }

            throw new Error('Login failed');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await clientService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('aramex_user');
            authCookies.clearAll();
            router.push('/auth/login');
        }
    }, [router]);

    const updateUser = useCallback(async (data: Partial<User>) => {
        try {
            const updateData: any = {};

            if (data.name !== undefined) updateData.name = data.name;
            if (data.email !== undefined) updateData.email = data.email;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.notifications !== undefined) updateData.notifications = data.notifications;

            if (data.photoURL !== undefined && data.photoURL) {
                if (data.photoURL.startsWith('data:')) {
                    updateData.avatar = dataURLtoFile(data.photoURL, 'avatar.jpg');
                }
            }

            await clientService.updateProfile(updateData);

            const userResponse = await clientService.getCurrentUser();
            const mappedUser = mapBackendUserToType(userResponse);
            setUser(mappedUser);
            localStorage.setItem('aramex_user', JSON.stringify(mappedUser));
            syncAuthCookies(mappedUser);
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        signOut,
        updateUser,
        signIn
    }), [user, loading, signOut, updateUser, signIn]);


    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
