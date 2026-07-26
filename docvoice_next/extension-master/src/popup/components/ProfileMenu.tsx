import { useState, useRef, useEffect } from 'react'
import { useSettingsStore, SPEECH_MODEL_CONFIGS } from '../../store/settingsStore'
import { useRecordingStore } from '../../store/recordingStore'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'
import { SpeechModelType } from '../../types/user'
import { platform } from '../../platform'
import QrScannerModal from '../../pwa/components/QrScannerModal'

const SPECIALTIES = [
  "General Practice (GP)", "Family Medicine", "Internal Medicine", "Pediatrics",
  "Obstetrics and Gynecology (OB/GYN)", "Emergency Medicine", "Cardiology",
  "Gastroenterology", "Pulmonology", "Endocrinology", "Neurology",
  "Psychiatry", "Dermatology", "Rheumatology", "Nephrology",
  "Infectious Disease", "Oncology", "Hematology", "Allergy and Immunology",
  "Geriatrics", "General Surgery", "Orthopedic Surgery", "Ophthalmology",
  "Otolaryngology (ENT)", "Urology", "Plastic Surgery", "Neurosurgery",
  "Cardiothoracic Surgery", "Vascular Surgery", "Pediatric Surgery",
  "Intensive Care Medicine (ICU)", "Anesthesiology", "Pain Management",
  "Neonatology", "Physical Medicine and Rehabilitation", "Radiology",
  "Pathology", "Medical Genetics", "Dentistry", "Oral and Maxillofacial Surgery",
  "Podiatry", "Other Specialty"
]

interface ProfileMenuProps {
  className?: string
  variant?: 'avatar' | 'gear'
  openUpward?: boolean
}

export default function ProfileMenu({ className, variant = 'avatar', openUpward = false }: ProfileMenuProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { selectedModel, setSelectedModel, processingMode, setProcessingMode, theme, setTheme, customTopics, setCustomTopics, doctorSpecialty, setDoctorSpecialty } = useSettingsStore()
  const { isRecording } = useRecordingStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingModel, setPendingModel] = useState<SpeechModelType | null>(null)
  const [showScanner, setShowScanner] = useState(false)
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
    if (model === selectedModel) {
      setIsOpen(false)
      return
    }
    if (isRecording) return // Block model change during recording

    // If switching TO Oracle Medical, show confirmation
    if (model === 'ORACLE_MEDICAL') {
      setPendingModel(model)
      setShowConfirmDialog(true)
    } else {
      // Switching back to Whisper — no confirmation needed
      setSelectedModel(model)
      setIsOpen(false)
    }
  }

  const handleConfirmSwitch = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel)
    }
    setShowConfirmDialog(false)
    setPendingModel(null)
    setIsOpen(false)
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
        {/* Trigger — gear (BottomNav) or avatar (header) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center focus:outline-none group"
          id="profile-menu-button"
          aria-label="Settings"
        >
          {variant === 'gear' ? (
            <div className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          {/* Active model indicator dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center text-[8px]">
            {activeConfig.icon}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute right-0 w-72 bg-[#F0F4F8] dark:bg-slateDark-bg rounded-2xl shadow-2xl border border-slate-300/70 dark:border-slateDark-border z-50 animate-in fade-in duration-200 overflow-y-auto ${
            openUpward
              ? 'bottom-full mb-3 slide-in-from-bottom-2 max-h-[calc(100dvh-5rem)]'
              : 'top-12 slide-in-from-top-2 max-h-[calc(100dvh-5rem)]'
          }`}>
            {/* User Info Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-slateDark-hover dark:to-slateDark-border border-b border-gray-100 dark:border-slateDark-divider">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-slateDark-text truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Speech Model Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-2">
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

              <div className="grid grid-cols-2 gap-1.5 bg-gray-200/70 dark:bg-slateDark-bg p-1 rounded-xl">
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
                        flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 text-center
                        ${isActive 
                          ? 'bg-white text-blue-700 dark:bg-slateDark-hover dark:text-blue-400 shadow-sm border border-blue-200/80 dark:border-blue-900/60' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      id={`model-option-${modelKey.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-center space-x-1 w-full">
                        <span className="text-xs">{config.icon}</span>
                        <span className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-[9px] leading-tight text-gray-500 dark:text-gray-400 mt-0.5 font-medium tracking-tight truncate w-full">
                        {config.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>


            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>

            {/* Processing Mode Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Processing Mode</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-gray-200/70 dark:bg-slateDark-bg p-1 rounded-xl">
                {([
                  { key: 'fast' as const, icon: '⚡', label: 'FAST', hint: '~3x faster' },
                  { key: 'precise' as const, icon: '🔬', label: 'PRECISE', hint: 'Deeper checks' },
                ]).map(({ key, icon, label, hint }) => {
                  const isActive = processingMode === key
                  return (
                    <button
                      key={key}
                      onClick={() => setProcessingMode(key)}
                      className={`
                        flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 text-center cursor-pointer
                        ${isActive
                          ? 'bg-white text-blue-700 dark:bg-slateDark-hover dark:text-blue-400 shadow-sm border border-blue-200/80 dark:border-blue-900/60'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
                        }
                      `}
                      id={`processing-mode-${key}`}
                    >
                      <div className="flex items-center justify-center space-x-1 w-full">
                        <span className="text-xs">{icon}</span>
                        <span className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {label}
                        </span>
                      </div>
                      <span className="text-[9px] leading-tight text-gray-500 dark:text-gray-400 mt-0.5 font-medium tracking-tight truncate w-full">
                        {hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>

            {/* Doctor Specialty Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Specialty</span>
              </div>
              <select
                className="w-full bg-gray-50 dark:bg-slateDark-bg border border-gray-200 dark:border-slateDark-border rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={doctorSpecialty}
                onChange={(e) => setDoctorSpecialty(e.target.value)}
                disabled={isRecording}
              >
                {SPECIALTIES.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>

            {/* Theme Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
              </div>
              
              <div className="flex bg-gray-100 dark:bg-slateDark-bg p-1 rounded-xl space-x-1">
                <button
                  onClick={() => {
                    setTheme('light')
                    setIsOpen(false)
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    theme === 'light' 
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-slateDark-hover dark:text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => {
                    setTheme('semi-light')
                    setIsOpen(false)
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    theme === 'semi-light' 
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-slateDark-hover dark:text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Semi Light
                </button>
                <button
                  onClick={() => {
                    setTheme('dark')
                    setIsOpen(false)
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    theme === 'dark' 
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-slateDark-hover dark:text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Dark Blue
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>

            {/* Custom Topics Section */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Recording Topics</span>
              </div>
              <textarea
                className="w-full bg-gray-50 dark:bg-slateDark-bg border border-gray-200 dark:border-slateDark-border rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter topics, one per line..."
                value={customTopics.join('\n')}
                onChange={(e) => {
                  const topics = e.target.value.split('\n').filter(t => t.trim() !== '')
                  setCustomTopics(topics)
                }}
              />
            </div>

            {/* PWA-only: pair a Chrome extension via QR */}
            {!platform.isExtension && (
              <>
                <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 5h.01M14 14h.01M17 14h.01M20 14h.01M20 17h.01M20 20h.01M17 17h.01M17 20h.01" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Link Chrome Extension
                    </span>
                  </div>
                  <button
                    onClick={() => { setIsOpen(false); setShowScanner(true) }}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm"
                    id="scan-qr-button"
                  >
                    امسح رمز الربط
                  </button>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>

            {/* Logout */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
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
          <div className="bg-white dark:bg-slateDark-bg rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-transparent dark:border-slateDark-border">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏥</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slateDark-text mb-2">
                Switch to Oracle Medical?
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>Oracle Medical model is optimized for <strong>clinical terminology</strong> and medical dictation.</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 text-left">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-400 text-xs">English Only</p>
                      <p className="text-amber-700 dark:text-amber-500/80 text-xs mt-0.5">Arabic and other languages are not supported with this model.</p>
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

      {/* PWA-only QR scanner modal */}
      {showScanner && (
        <QrScannerModal
          open
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
