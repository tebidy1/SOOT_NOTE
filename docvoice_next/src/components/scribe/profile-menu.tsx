'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/providers/i18n-provider';

interface ProfileMenuProps {
  className?: string;
  baseUrl?: string;
}

export function ProfileMenu({ className, baseUrl = '/company' }: ProfileMenuProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div ref={menuRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none group"
        id="profile-menu-button"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="absolute end-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="p-2">
            {baseUrl !== '/member' && (
              <>
                <Link
                  href={`${baseUrl}/members`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center px-4 py-2.5 rounded-xl text-start text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4 0 4 4 0 004 0zm6 0a4 4 0 10-4 0 4 4 0 004 0z" />
                  </svg>
                  <span className="font-medium">{t.users}</span>
                </Link>
                <Link
                  href={`${baseUrl}/settings`}
                  onClick={() => setIsOpen(false)}
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
              id="logout-button"
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
  );
}

export default ProfileMenu;
