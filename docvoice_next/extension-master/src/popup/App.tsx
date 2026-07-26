import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import AuthGuard from './components/AuthGuard'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import InboxScreen from './screens/InboxScreen'
import NoteDetailScreen from './screens/NoteDetailScreen'
import OfflineBanner from '../pwa/components/OfflineBanner'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { theme } = useSettingsStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slateDark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="w-full min-h-screen bg-white dark:bg-slateDark-bg text-gray-900 dark:text-slateDark-text">
        <OfflineBanner />
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <LoginScreen />
          } />
          <Route path="/" element={
            <AuthGuard>
              <InboxScreen />
            </AuthGuard>
          } />
          <Route path="/record" element={
            <AuthGuard>
              <HomeScreen />
            </AuthGuard>
          } />
          <Route path="/note/:noteId" element={
            <AuthGuard>
              <NoteDetailScreen />
            </AuthGuard>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
