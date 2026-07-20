import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'

interface BottomNavProps {
  activeRoute: 'home' | 'inbox' | 'record' | 'profile'
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.LOGIN)
  }

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => navigate(ROUTES.HOME)
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      onClick: () => navigate(ROUTES.INBOX)
    },
    {
      id: 'record',
      label: 'Record',
      icon: (
        <div className="w-14 h-14 -mt-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      ),
      onClick: () => navigate(ROUTES.HOME)
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: user ? (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {user.name?.charAt(0) || 'U'}
        </div>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {}, // Profile screen excluded per plan
      showDropdown: true,
      dropdownItems: [
        {
          label: 'Logout',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ),
          onClick: handleLogout
        }
      ]
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => (
          <div key={item.id} className="relative">
            {item.id === 'record' ? (
              <button
                onClick={item.onClick}
                className="flex flex-col items-center justify-center"
              >
                {item.icon}
              </button>
            ) : (
              <button
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  activeRoute === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className={`${activeRoute === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}