'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function FloatingInstallButton() {
  const deferredPromptRef = useRef<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    if ((window.navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed !== 'true') {
      setShow(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      deferredPromptRef.current = null
      setIsInstalled(true)
      setShow(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleClick = async () => {
    if (deferredPromptRef.current && !isIOS) {
      deferredPromptRef.current.prompt()
      const result = await deferredPromptRef.current.userChoice
      if (result.outcome === 'accepted') {
        deferredPromptRef.current = null
        setIsInstalled(true)
        setShow(false)
      }
      return
    }

    setShowMenu(!showMenu)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
    setShowMenu(false)
  }

  if (isInstalled || !show) return null

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2.5 shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        <Download className="h-4 w-4" />
        <span className="text-xs font-semibold">تثبيت التطبيق</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="fixed bottom-20 left-6 z-50 w-72 bg-popover border rounded-xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">
                {isIOS ? 'تثبيت على iOS' : 'تثبيت التطبيق'}
              </p>
              <button onClick={() => setShowMenu(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                <li>اضغط على زر المشاركة <span className="text-base">⬆️</span></li>
                <li>اختر <strong>"إلى الشاشة الرئيسية"</strong></li>
                <li>اضغط على <strong>"إضافة"</strong></li>
              </ol>
            ) : deferredPromptRef.current ? (
              <p className="text-sm text-muted-foreground">اضغط على زر التثبيت لتثبيت التطبيق على جهازك والوصول السريع.</p>
            ) : (
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                <li>افتح قائمة المتصفح <span className="text-base">⋮</span></li>
                <li>اختر <strong>"تثبيت التطبيق"</strong></li>
                <li>أو ابحث عن <strong>"إضافة إلى الشاشة الرئيسية"</strong></li>
              </ol>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                إخفاء للأبد
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="text-xs text-primary hover:underline font-medium"
              >
                حسناً
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
