'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/providers/i18n-provider';
import { useCreateNoteStore } from '@/stores/create-note-store';

interface BottomNavProps {
  basePath?: string;
  secondaryRoute?: string;
  secondaryLabel?: string;
}

export function BottomNav({ basePath = '/company', secondaryRoute = 'inbox-notes', secondaryLabel }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const openCreateNote = useCreateNoteStore((s) => s.open);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoute: 'home' | 'inbox' | 'none' =
    pathname === `${basePath}/dashboard` ? 'home' : pathname?.startsWith(`${basePath}/${secondaryRoute}`) ? 'inbox' : 'none';

  const handleLogout = async () => {
    setProfileOpen(false);
    await signOut();
  };

  const navItems = [
    {
      id: 'home' as const,
      label: t.home,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => router.push(`${basePath}/dashboard`),
    },
    {
      id: 'inbox' as const,
      label: secondaryLabel || t.notes,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      onClick: () => router.push(`${basePath}/${secondaryRoute}`),
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="mx-auto max-w-2xl flex items-center justify-around py-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeRoute === item.id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <div className={activeRoute === item.id ? 'text-blue-600' : 'text-gray-500'}>
              {item.icon}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}

        {/* Center Record FAB */}
        <button
          type="button"
          onClick={() => openCreateNote()}
          className="flex flex-col items-center justify-center"
          aria-label={t.newShipment}
        >
          <div className="w-14 h-14 -mt-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            {user ? (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0) || 'U'}
              </div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <span className="text-xs mt-1">{t.profile}</span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full mb-2 end-0 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-100">
                <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
              <div className="p-2">
                {basePath !== '/member' && (
                  <>
                    <Link
                      href={`${basePath}/members`}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 rounded-xl text-start text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4 0 4 4 0 004 0zm6 0a4 4 0 10-4 0 4 4 0 004 0z" />
                      </svg>
                      <span className="font-medium">{t.users}</span>
                    </Link>
                    <Link
                      href={`${basePath}/settings`}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 rounded-xl text-start text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{t.settings}</span>
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 rounded-xl text-start text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">{t.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BottomNav;
