import { useEffect, useState } from 'react'
import { platform } from '../../platform'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (platform.isExtension) return
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true)

  if (platform.isExtension || dismissed || isStandalone || !deferred) return null

  return (
    <div
      dir="rtl"
      className="fixed left-4 right-4 z-[150] bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-black/5 dark:border-white/5"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex-1 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
        ثبّت SoutNote على شاشتك الرئيسية لتجربة أسرع وأشبه بالتطبيق.
      </div>
      <button
        onClick={async () => {
          deferred.prompt()
          await deferred.userChoice
          setDeferred(null)
        }}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors"
      >
        تثبيت
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="إغلاق"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 text-lg"
      >
        ✕
      </button>
    </div>
  )
}
