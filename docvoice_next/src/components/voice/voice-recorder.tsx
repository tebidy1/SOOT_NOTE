'use client'

import { motion } from 'framer-motion'
import { Mic, Square, Trash2, RotateCcw, Volume2, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { showError } from '@/lib/notification.service'
import { useEffect } from 'react'

export interface VoiceRecorderProps {
  className?: string
  compact?: boolean
}

export function VoiceRecorder({ className, compact = false }: VoiceRecorderProps) {
  const {
    isRecording,
    isStarting,
    isStopping,
    audioBlob,
    audioUrl,
    duration,
    error,
    isSupported,
    startRecording,
    stopRecording,
    clearRecording,
    formatDuration,
  } = useVoiceRecorder()

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const handleStart = async () => {
    if (audioUrl) clearRecording()
    try {
      await startRecording()
    } catch {
      // الخطأ معروض عبر المتجر
    }
  }

  const handleStop = async () => {
    try {
      await stopRecording()
    } catch {
      // تجاهل
    }
  }

  const handleClear = () => {
    clearRecording()
  }

  if (!isSupported) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-6 text-center',
          className
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MicOff className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">التسجيل غير مدعوم</p>
        <p className="text-xs text-muted-foreground">
          متصفحك لا يدعم تسجيل الصوت. يرجى استخدام متصفح حديث مثل Chrome أو Firefox.
        </p>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div className="relative flex items-center justify-center">
          {/* Concentric circles animation matching extension pattern */}
          <div className="absolute h-24 w-24 rounded-full bg-red-500/20 animate-ping" />
          <div className="absolute h-20 w-20 rounded-full bg-red-500/10 animate-pulse" />
          <motion.span
            className="absolute inline-flex h-24 w-24 rounded-full bg-red-500/30"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inline-flex h-20 w-20 rounded-full bg-red-500/40"
            animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3,
            }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]">
            <Mic className="h-7 w-7" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-black tabular-nums text-red-600">
            {formatDuration(duration)}
          </p>
          <p className="text-sm text-muted-foreground">جاري التسجيل...</p>
        </div>

        <Button
          type="button"
          variant="destructive"
          size={compact ? 'default' : 'lg'}
          onClick={handleStop}
          disabled={isStopping}
          className="gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          <Square className="h-4 w-4 fill-current" />
          {isStopping ? 'جاري الإيقاف...' : 'إيقاف التسجيل'}
        </Button>
      </div>
    )
  }

  if (audioBlob && audioUrl) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">ملاحظة صوتية</p>
            <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="حذف التسجيل"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <audio src={audioUrl} controls className="w-full" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleStart}
          className="gap-2 self-start"
          disabled={isStarting}
        >
          <RotateCcw className="h-4 w-4" />
          إعادة التسجيل
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting}
        className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-700 hover:to-teal-600 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isStarting ? (
          <motion.span
            className="block h-6 w-6 rounded-full border-2 border-white border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold">
          {isStarting ? 'جاري التجهيز...' : 'اضغط للتسجيل'}
        </p>
        <p className="text-xs text-muted-foreground">
          سجّل ملاحظة صوتية ليتم رفعها مع الملاحظة
        </p>
      </div>
    </div>
  )
}
