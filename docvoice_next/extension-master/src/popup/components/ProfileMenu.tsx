import { useState, useRef, useEffect } from 'react'
import { useSettingsStore, SPEECH_MODEL_CONFIGS } from '../../store/settingsStore'
import { useRecordingStore } from '../../store/recordingStore'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'
import { SpeechModelType } from '../../types/user'

interface ProfileMenuProps {
  className?: string
}

export default function ProfileMenu({ className }: ProfileMenuProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { selectedModel, setSelectedModel } = useSettingsStore()
  const { isRecording } = useRecordingStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingModel, setPendingModel] = useState<SpeechModelType | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleModelSelect = (model: SpeechModelType) => {
    if (model === selectedModel) return
    if (isRecording) return // Block model change during recording

    // If switching TO Oracle Medical, show confirmation
    if (model === 'ORACLE_MEDICAL') {
      setPendingModel(model)
      setShowConfirmDialog(true)
    } else {
      // Switching back to Whisper — no confirmation needed
      setSelectedModel(model)
    }
  }

  const handleConfirmSwitch = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel)
    }
    setShowConfirmDialog(false)
    setPendingModel(null)
  }

  const handleCancelSwitch = () => {
    setShowConfirmDialog(false)
    setPendingModel(null)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await authService.logout()
    navigate(ROUTES.LOGIN)
  }

  const activeConfig = SPEECH_MODEL_CONFIGS[selectedModel]

  return (
    <>
      <div ref={menuRef} className={`relative ${className || ''}`}>
        {/* Profile Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 focus:outline-none group"
          id="profile-menu-button"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {/* Active model indicator dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center text-[8px]">
            {activeConfig.icon}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Info Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Speech Model Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Speech Model</span>
                {isRecording && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                    Locked
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {(Object.keys(SPEECH_MODEL_CONFIGS) as SpeechModelType[]).map((modelKey) => {
                  const config = SPEECH_MODEL_CONFIGS[modelKey]
                  const isActive = selectedModel === modelKey
                  const isDisabled = isRecording

                  return (
                    <button
                      key={modelKey}
                      onClick={() => handleModelSelect(modelKey)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                          : 'border-2 border-transparent hover:bg-gray-50'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      id={`model-option-${modelKey.toLowerCase()}`}
                    >
                      <span className="text-xl mr-3 flex-shrink-0">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{config.description}</span>
                      </div>
                      {isActive && (
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Logout */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
                id="logout-button"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Oracle Medical */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏥</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Switch to Oracle Medical?
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Oracle Medical model is optimized for <strong>clinical terminology</strong> and medical dictation.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold text-amber-800 text-xs">English Only</p>
                      <p className="text-amber-700 text-xs mt-0.5">Arabic and other languages are not supported with this model.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmSwitch}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition-colors shadow-md"
                id="confirm-model-switch"
              >
                Switch to Medical Model
              </button>
              <button
                onClick={handleCancelSwitch}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                id="cancel-model-switch"
              >
                Keep Whisper
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
