import { useState, useEffect, useRef, useCallback } from 'react'

// Single shared medical processing steps (timed across 0s–12s+ total journey)
export const NOTE_PROCESSING_STEPS = [
  'Transcribing audio to text...',
  'Extracting clinical details & symptoms...',
  'Formatting clinical template & final note...'
]

const STEP_ICONS = ['🎙️', '🧠', '📋']

interface ProcessingOverlayProps {
  step?: string
  progress?: number
  onCancel?: () => void
  cyclingMessages?: boolean
  stepsList?: string[]
}

export default function ProcessingOverlay({
  step,
  progress = 0,
  onCancel,
  stepsList
}: ProcessingOverlayProps) {
  const steps = stepsList || NOTE_PROCESSING_STEPS
  const isComplete = progress >= 100

  // ── Elapsed time counter (Increments every 1.5 seconds) ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
    setElapsedSeconds(0)
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── Smooth Time-Based Step & Progress Controller (0s - 12s+) ──
  // Step 1: 0s - 4s (Transcribing audio)
  // Step 2: 4s - 8s (Extracting clinical details)
  // Step 3: 8s - 12s+ (Formatting final note)
  const [barProgress, setBarProgress] = useState<number[]>([0, 0, 0])
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const animFrameRef = useRef<number>(0)

  const updateProgress = useCallback(() => {
    const elapsedMs = Date.now() - startTimeRef.current

    if (isComplete) {
      setBarProgress([100, 100, 100])
      setActiveStepIndex(2)
      return
    }

    // Determine progress per bar based on timeline
    // Bar 0: 0 to 4000ms
    const b0 = Math.min(100, (elapsedMs / 4000) * 100)

    // Bar 1: 4000ms to 8000ms
    const b1 = elapsedMs < 4000 ? 0 : Math.min(100, ((elapsedMs - 4000) / 4000) * 100)

    // Bar 2: 8000ms to 12000ms+ (eases up to 94% smoothly if waiting longer)
    let b2 = 0
    if (elapsedMs >= 8000) {
      if (elapsedMs <= 12000) {
        b2 = ((elapsedMs - 8000) / 4000) * 90
      } else {
        // Slow continuous creep towards 95% to maintain visual activity without stalling
        const extraTime = elapsedMs - 12000
        b2 = Math.min(95, 90 + (extraTime / 5000) * 5)
      }
    }

    // Active step calculation
    let currentIdx = 0
    if (elapsedMs >= 4000 && elapsedMs < 8000) currentIdx = 1
    else if (elapsedMs >= 8000) currentIdx = 2

    setActiveStepIndex(currentIdx)
    setBarProgress([b0, b1, b2])

    animFrameRef.current = requestAnimationFrame(updateProgress)
  }, [isComplete])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateProgress)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [updateProgress])

  // Overall visual progress metric
  const totalBars = steps.length
  const completedBars = barProgress.filter(b => b >= 100).length
  const currentBarContrib = barProgress[activeStepIndex] || 0
  const visualProgress = isComplete
    ? 100
    : Math.min(99, Math.round(((completedBars + currentBarContrib / 100) / totalBars) * 100))

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800"
        style={{ animation: 'overlaySlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="p-7">
          {/* Header Badge */}
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              AI Clinical Scribe
            </span>
          </div>

          {/* ── Static Ring Circle with Internal Glow Pulse & Timer ── */}
          <div className="text-center mb-6">
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              {/* Static Smooth Border Ring (No Spinning Outer Line) */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="4"
                />
                {/* Static Progress Arc reflecting progress percentage */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={isComplete ? '#10B981' : 'url(#medicalGradient)'}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (visualProgress / 100) * 276.46}
                  style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.4s ease' }}
                />
                <defs>
                  <linearGradient id="medicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#0D9488" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Internal Pulse Effect (Inside Circle Only) */}
              {!isComplete && (
                <div
                  className="absolute inset-4 rounded-full bg-teal-500/10 dark:bg-teal-400/10 pointer-events-none"
                  style={{ animation: 'innerPulse 2.5s ease-in-out infinite' }}
                />
              )}

              {/* Timer & Status Display inside the circle */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                {isComplete ? (
                  <div style={{ animation: 'checkmarkPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      key={elapsedSeconds}
                      className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white"
                      style={{ animation: 'numberPop 0.4s ease-out' }}
                    >
                      {formatTime(elapsedSeconds)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      Elapsed Time
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Status Headline */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-1">
              {isComplete ? 'Note Ready for Review' : 'Processing Clinical Note'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isComplete
                ? 'Structured documentation generated successfully'
                : 'AI model is formatting your clinical encounter'}
            </p>
          </div>

          {/* ── 3-Step Continuous Progressive Bars (0s - 12s+) ── */}
          <div className="space-y-3.5 mb-6">
            {steps.slice(0, 3).map((stepText, index) => {
              const isStepCompleted = barProgress[index] >= 100
              const isCurrent = index === activeStepIndex && !isComplete
              const isFuture = index > activeStepIndex && !isComplete
              const icon = STEP_ICONS[index] || '📋'

              return (
                <div
                  key={index}
                  className={`p-3 rounded-2xl border transition-all duration-400 ${
                    isCurrent
                      ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-200/80 dark:border-teal-800/80 shadow-sm'
                      : isStepCompleted
                      ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800'
                      : 'bg-transparent border-slate-100 dark:border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Step Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isStepCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isStepCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{icon}</span>
                      )}
                    </div>

                    {/* Step Label & Progress Line */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span
                          className={
                            isStepCompleted
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isCurrent
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }
                        >
                          {stepText}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {Math.round(barProgress[index])}%
                        </span>
                      </div>

                      {/* Continuous Filling Progress Track */}
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isStepCompleted
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-gradient-to-r from-blue-600 to-teal-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          style={{
                            width: `${barProgress[index]}%`,
                            transition: isCurrent ? 'width 0.1s linear' : 'width 0.3s ease-out'
                          }}
                        />
                        {/* Smooth shimmer line for active step */}
                        {isCurrent && (
                          <div
                            className="absolute top-0 bottom-0 rounded-full overflow-hidden"
                            style={{
                              left: 0,
                              width: `${barProgress[index]}%`,
                              background:
                                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                              animation: 'shimmer 1.8s infinite'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          {onCancel && (
            <div>
              {isComplete ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full font-bold py-3 px-4 rounded-2xl text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #059669, #0D9488)' }}
                >
                  View Note Results
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98] transition-all text-xs"
                >
                  Cancel Processing
                </button>
              )}
            </div>
          )}
        </div>

        {/* Medical Security & Compliance Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/40 py-2.5 px-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              HIPAA Compliant
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Encrypted Stream
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Medical AI
            </span>
          </div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes overlaySlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes checkmarkPop {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes numberPop {
          0% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes innerPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}