import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { apiClient } from '../../services/apiClient'
import { ROUTES } from '../routes'
import AnimatedLogo from '../components/AnimatedLogo'

export default function LoginScreen() {
  const navigate = useNavigate()
  
  // ── States ───────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [obscurePassword, setObscurePassword] = useState(true)
  
  // Credentials submit loading & error
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // QR Pairing states
  const [pairingId, setPairingId] = useState<string | null>(null)
  const [shortCode, setShortCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)

  // Timer refs
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Initiate QR Pairing ──────────────────────────────────────
  const initPairing = async () => {
    setQrLoading(true)
    setQrError(null)
    
    // Stop any existing timers
    stopTimers()

    try {
      const response = await apiClient.initiatePairing()
      if (response.success && response.data) {
        const { pairing_id, short_code } = response.data
        setPairingId(pairing_id)
        setShortCode(short_code)
        setQrLoading(false)

        // Start polling the status of authorization
        startPolling(pairing_id)

        // Auto-refresh pairing code every 2 minutes (120000ms)
        refreshTimerRef.current = setTimeout(() => {
          initPairing()
        }, 120000)
      } else {
        throw new Error(response.error || 'Failed to initiate pairing')
      }
    } catch (e: any) {
      console.error('QR Initiation error:', e)
      setQrLoading(false)
      setQrError('تعذر توليد رمز QR: خطأ في الاتصال بالخادم')
    }
  }

  // ── Poll for Pairing Success ──────────────────────────────────
  const startPolling = (id: string) => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const response = await apiClient.checkPairingStatus(id)
        if (response.success && response.data) {
          const { status, token, user } = response.data
          if (status === 'authorized' && token) {
            stopTimers()
            
            // Login via AuthService (Zustand & Chrome Storage)
            const ok = await authService.loginWithToken(token, user)
            if (ok) {
              navigate(ROUTES.HOME)
            }
          }
        }
      } catch (e) {
        console.error('QR Polling error:', e)
      }
    }, 3000) // Poll every 3 seconds
  }

  // ── Stop active pairing timers ───────────────────────────────
  const stopTimers = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  // Initial load
  useEffect(() => {
    initPairing()
    return () => stopTimers()
  }, [])

  // ── Credentials login handler ────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setLoginError('الرجاء إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoginLoading(true)
    setLoginError(null)

    try {
      const success = await authService.login({ email: email.trim(), password })
      if (success) {
        stopTimers()
        navigate(ROUTES.HOME)
      } else {
        setLoginError('بيانات الدخول غير صحيحة')
      }
    } catch (error: any) {
      setLoginError(error.message || 'خطأ في الاتصال بالخادم')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Render Static Brand Logo ─────────────────────────────────
  const renderStaticLogo = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className="w-[110px] h-[100px] mx-auto select-none"
    >
      {/* Clipboard Body */}
      <rect 
        x="2" y="24" width="46" height="58" rx="5" 
        fill="none" stroke="#0B1F3B" strokeWidth="3.2" 
        strokeLinecap="round" strokeLinejoin="round" 
      />
      {/* Clip */}
      <rect 
        x="15" y="15" width="20" height="10" rx="2" 
        fill="#0B1F3B" 
      />
      <circle cx="25" cy="10" r="5" fill="#0B1F3B" />

      {/* Checklist Lines */}
      {[0, 1, 2].map((i) => {
        const y = 36 + i * 15
        const endX = i === 2 ? 35 : 42
        return (
          <g key={i}>
            <rect 
              x="8" y={y - 3.5} width="7" height="7" rx="1.5" 
              fill="none" stroke="#0B1F3B" strokeWidth="2" 
            />
            <line 
              x1="20" y1={y} x2={endX} y2={y} 
              stroke="#0B1F3B" strokeWidth="2.5" strokeLinecap="round" 
            />
          </g>
        )
      })}

      {/* Mic Badge Shadow */}
      <circle cx="68" cy="22" r="22" fill="rgba(0, 0, 0, 0.06)" />
      
      {/* Badge Circle Background */}
      <circle cx="68" cy="22" r="22" fill="#FFFFFF" />
      
      {/* Cyan Inner Ring */}
      <circle cx="68" cy="22" r="18" fill="none" stroke="#06B6D4" strokeWidth="3.5" />
      
      {/* Microphone Capsule */}
      <rect x="65" y="12" width="6" height="12" rx="3" fill="#0B1F3B" />
      
      {/* Microphone Cup Arc */}
      <path 
        d="M 61 21 A 7 7 0 0 0 75 21" 
        fill="none" stroke="#0B1F3B" strokeWidth="2.2" strokeLinecap="round" 
      />
      
      {/* Microphone Stand */}
      <line x1="68" y1="26.5" x2="68" y2="31" stroke="#0B1F3B" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="64" y1="31" x2="72" y2="31" stroke="#0B1F3B" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )

  // ── Render Splash State ──────────────────────────────────────
  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-white dark:bg-slate-950 transition-colors duration-500">
        {/* Top spacer */}
        <div className="h-10" />

        {/* Core Animated Splash Elements */}
        <div className="text-center flex flex-col items-center justify-center">
          <AnimatedLogo onComplete={() => setShowSplash(false)} width={160} height={140} />
          
          {/* Animated Fade-in Wordmark */}
          <div className="mt-5 animate-fade-in text-center">
            <h1 className="font-outfit text-3xl font-extrabold tracking-tight">
              <span className="text-slate-900 dark:text-white">Sout</span>
              <span className="text-cyan-500">Note</span>
            </h1>
            <h2 className="font-cairo text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200">
              صوت نوت
            </h2>
            <p className="font-cairo text-slate-500 dark:text-slate-400 mt-2 text-sm">
              استمع أكثر. اكتب أقل.
            </p>
          </div>
        </div>

        {/* Bottom trust badge */}
        <div className="w-full text-center pb-4 animate-fade-in opacity-80">
          <p className="font-cairo text-slate-400 dark:text-slate-500 text-xs">
            قوالب الملاحظات تتماشى مع توصيات SABAHI
          </p>
        </div>
      </div>
    )
  }

  // ── Render Main Login Screen ──────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-md my-auto py-4">
        {/* Static Header Logo */}
        <div className="text-center mb-6">
          <div className="mb-3 hover:scale-105 transition-transform duration-300">
            {renderStaticLogo()}
          </div>
          
          <h1 className="font-outfit text-2xl font-extrabold tracking-tight">
            <span className="text-slate-900 dark:text-white">Sout</span>
            <span className="text-cyan-500">Note</span>
          </h1>
          <h2 className="font-cairo text-lg font-bold text-slate-800 dark:text-slate-200">
            صوت نوت
          </h2>
          <p className="font-cairo text-slate-500 dark:text-slate-400 text-xs mt-1">
            تسجيل الدخول / Login
          </p>
        </div>

        {/* Credentials and QR code container card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 transition-colors duration-500">
          
          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-lg text-xs font-cairo text-right flex items-center justify-between">
                <span className="flex-1 text-center font-semibold">{loginError}</span>
                <svg className="w-4 h-4 ml-2 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block font-cairo text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 text-right">
                البريد الإلكتروني / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="doctor@hospital.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block font-cairo text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 text-right">
                كلمة المرور / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={obscurePassword ? 'password' : 'text'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setObscurePassword(!obscurePassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {obscurePassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-cairo font-bold py-2.5 rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
            >
              {loginLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  تسجيل الدخول...
                </div>
              ) : (
                'تسجيل الدخول / Sign In'
              )}
            </button>
          </form>

          {/* QR Pairing Divider */}
          <div className="my-6 flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-700/80 flex-grow"></div>
            <span className="font-cairo text-[10px] md:text-xs text-slate-400 px-3 select-none">
              أو سجّل الدخول بـ QR / Or scan QR with phone
            </span>
            <div className="border-t border-slate-200 dark:border-slate-700/80 flex-grow"></div>
          </div>

          {/* QR Pairing Instructions */}
          <div className="flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4 select-none">
            <svg className="w-4 h-4 mr-2 text-cyan-500 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-cairo text-[10px] md:text-[11px] font-semibold text-center leading-relaxed">
              افتح التطبيق على هاتفك ← الإعدادات ← Scan QR to Authorize
            </p>
          </div>

          {/* QR Code Card Wrapper */}
          <div className="flex flex-col items-center justify-center mt-4">
            {qrError ? (
              <div className="text-center py-6 flex flex-col items-center">
                <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 5 5 0 011.414-3.536m0 0l2.829 2.829m-2.829-2.829L3 3m7.071 7.071L12 12m0 0l2.829 2.829m-2.829-2.829l2.829-2.829" />
                </svg>
                <p className="font-cairo text-xs text-red-500 dark:text-red-400 font-semibold mb-3">
                  {qrError}
                </p>
                <button
                  onClick={initPairing}
                  className="font-cairo text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg font-semibold transition-all border border-slate-200 dark:border-slate-700"
                >
                  إعادة المحاولة / Retry
                </button>
              </div>
            ) : qrLoading || !pairingId ? (
              <div className="w-[184px] h-[184px] bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100/50">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* QR Code Container with dynamic glow */}
                <div className="p-3 bg-white rounded-2xl shadow-[0_0_24px_rgba(6,182,212,0.15)] border border-cyan-100 select-none">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`pairing:${pairingId}`)}`}
                    alt="QR Pairing Code"
                    className="w-[160px] h-[160px] block rounded-lg bg-white"
                    draggable={false}
                  />
                </div>
                
                {/* Short numerical pairing code */}
                {shortCode && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <span className="font-outfit text-xs font-bold tracking-widest text-cyan-600 dark:text-cyan-400 select-all">
                      Code: {shortCode}
                    </span>
                  </div>
                )}

                {/* Refresh code button */}
                <button
                  type="button"
                  onClick={initPairing}
                  className="mt-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-cairo text-[10px] font-semibold"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
                  </svg>
                  تجديد الرمز / Generate New Code
                </button>
              </div>
            )}
          </div>

        </div>
        
        {/* Support Link */}
        <div className="text-center mt-6">
          <p className="font-cairo text-xs text-slate-400 dark:text-slate-500">
            تحتاج مساعدة؟ / Need help?
          </p>
        </div>
      </div>
    </div>
  )
}