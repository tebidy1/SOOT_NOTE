import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AuthGuard from './components/AuthGuard'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import EditorScreen from './screens/EditorScreen'
import InboxScreen from './screens/InboxScreen'
import NoteDetailScreen from './screens/NoteDetailScreen'
import SecurePairingScreen from './screens/SecurePairingScreen'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="w-full min-h-screen bg-white">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <LoginScreen />
          } />
          <Route path="/pairing" element={
            isAuthenticated ? <Navigate to="/" /> : <SecurePairingScreen />
          } />
          <Route path="/" element={
            <AuthGuard>
              <HomeScreen />
            </AuthGuard>
          } />
          <Route path="/editor" element={
            <AuthGuard>
              <EditorScreen />
            </AuthGuard>
          } />
          <Route path="/inbox" element={
            <AuthGuard>
              <InboxScreen />
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