import { useOnlineStatus } from '../offline/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-amber-950 text-center text-sm font-medium py-1 px-3"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 4px)' }}
    >
      غير متصل — سيتم رفع التسجيلات تلقائياً عند عودة الاتصال
    </div>
  )
}
