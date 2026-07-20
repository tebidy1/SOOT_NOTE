'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function InstallPrompt() {
  const deferredPromptRef = useRef<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [canShow, setCanShow] = useState(false)

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
      setCanShow(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      deferredPromptRef.current = null
      setIsInstalled(true)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (isInstalled) return null

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt()
      const result = await deferredPromptRef.current.userChoice
      if (result.outcome === 'accepted') {
        deferredPromptRef.current = null
        setIsInstalled(true)
      }
      return
    }

    if (isIOS) {
      setShowMenu(!showMenu)
      return
    }

    setShowMenu(!showMenu)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShowMenu(false)
  }

  if (!canShow) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5"
        onClick={handleInstall}
        title="تثبيت التطبيق"
      >
        <Download className="h-4 w-4" />
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-popover border rounded-lg shadow-lg p-4 z-50">
            {isIOS ? (
              <>
                <p className="font-semibold text-sm mb-2">لتثبيت التطبيق:</p>
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                  <li>اضغط على زر المشاركة <span className="text-base">⬆️</span></li>
                  <li>اختر <strong>"إلى الشاشة الرئيسية"</strong></li>
                  <li>اضغط على <strong>"إضافة"</strong></li>
                </ol>
              </>
            ) : deferredPromptRef.current ? (
              <p className="text-sm text-muted-foreground">اضغط على زر التثبيت لتثبيت التطبيق على جهازك.</p>
            ) : (
              <>
                <p className="font-semibold text-sm mb-2">لتثبيت التطبيق:</p>
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                  <li>افتح قائمة المتصفح <span className="text-base">⋮</span></li>
                  <li>اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong></li>
                </ol>
              </>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                عدم الإظهار مجدداً
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="text-xs text-primary hover:underline font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
