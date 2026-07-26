import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { apiClient } from '../../services/apiClient'
import { parsePairingPayload } from '../pairing/parsePairingPayload'

type Phase = 'requesting' | 'scanning' | 'authorizing' | 'success' | 'error'

interface QrScannerModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const DEVICE_NAME = 'SoutNote Mobile Web'

export default function QrScannerModal({ open, onClose, onSuccess }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  // Prevent double-POST if two consecutive frames both decode the same QR.
  const authorizingRef = useRef(false)

  const [phase, setPhase] = useState<Phase>('requesting')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)

  const stopStream = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const handleClose = () => {
    stopStream()
    onClose()
  }

  const showToast = (text: string, ms = 1800) => {
    setToast(text)
    setTimeout(() => setToast(null), ms)
  }

  const authorize = async (id: string) => {
    if (authorizingRef.current) return
    authorizingRef.current = true
    setPhase('authorizing')
    try {
      const res = await apiClient.authorizePairing(id, DEVICE_NAME)
      if (res.success) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30)
        setPhase('success')
        setTimeout(() => {
          stopStream()
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setErrorMsg(((res as any).message) || ((res as any).error) || 'تعذّر ربط الإضافة. حاول مجدداً.')
        setPhase('error')
        authorizingRef.current = false
      }
    } catch {
      setErrorMsg('خطأ في الاتصال بالخادم. تأكد من الاتصال ثم أعِد المحاولة.')
      setPhase('error')
      authorizingRef.current = false
    }
  }

  const scanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h)
    const code = jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' })
    if (code && code.data) {
      const parsed = parsePairingPayload(code.data)
      if (parsed) {
        authorize(parsed)
        return
      } else {
        showToast('هذا ليس رمز SoutNote')
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop)
  }

  const startCamera = async () => {
    setPhase('requesting')
    setErrorMsg('')
    authorizingRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('scanning')
      scanLoop()
    } catch (e: any) {
      const name = e?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('إذن الكاميرا مرفوض. لتفعيله: افتح إعدادات المتصفح لهذا الموقع ← الأذونات ← الكاميرا ← السماح.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMsg('لا توجد كاميرا متاحة على هذا الجهاز. استخدم الإدخال اليدوي بدلاً منها.')
      } else {
        setErrorMsg('تعذّر فتح الكاميرا: ' + (e?.message || 'خطأ غير معروف'))
      }
      setPhase('error')
    }
  }

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (!/^\d{6}$/.test(code)) {
      showToast('أدخل 6 أرقام بالضبط')
      return
    }
    setManualSubmitting(true)
    await authorize(code)
    setManualSubmitting(false)
  }

  useEffect(() => {
    if (open) startCamera()
    return stopStream
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[200] bg-black text-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
        <h2 className="text-base font-bold">امسح رمز الربط</h2>
        <button
          onClick={handleClose}
          aria-label="إغلاق"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video / scan viewport */}
      <div className="flex-1 relative overflow-hidden">
        {(phase === 'scanning' || phase === 'authorizing' || phase === 'success' || phase === 'requesting') && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Dim overlay with clear square */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-2xl" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
                <span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-2xl" />
                <span className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-2xl" />
                <span className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-2xl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-2xl" />
              </div>
            </div>

            {phase === 'authorizing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm">جارٍ ربط الإضافة...</p>
                </div>
              </div>
            )}

            {phase === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-3 text-base font-bold">تم ربط الإضافة بنجاح</p>
                </div>
              </div>
            )}

            {phase === 'requesting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm">جارٍ فتح الكاميرا...</p>
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
            <div className="max-w-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed text-slate-200 mb-4">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-sm font-bold"
              >
                أعِد المحاولة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with hint + manual entry */}
      <div className="relative z-10 px-4 py-4 bg-black/70 backdrop-blur-sm">
        {!manualOpen ? (
          <>
            <p className="text-center text-xs text-slate-300 mb-3 leading-relaxed">
              افتح إضافة الكروم لتظهر شاشة رمز الربط، ثم صوّب الكاميرا على الرمز.
            </p>
            <button
              onClick={() => setManualOpen(true)}
              className="w-full py-2.5 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/10"
            >
              أدخل الكود يدوياً
            </button>
          </>
        ) : (
          <form onSubmit={submitManual} className="space-y-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              dir="ltr"
              className="w-full py-3 px-4 rounded-xl bg-white text-black text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setManualOpen(false); setManualCode('') }}
                className="flex-1 py-2.5 border border-white/20 rounded-xl text-sm"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={manualSubmitting || manualCode.length !== 6}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-sm font-bold"
              >
                {manualSubmitting ? '...' : 'ربط'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[210] px-4 py-2 bg-black/80 text-white text-sm rounded-full backdrop-blur-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
