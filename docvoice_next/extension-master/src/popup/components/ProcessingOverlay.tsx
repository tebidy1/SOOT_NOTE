import { useState, useEffect, useRef, useCallback } from 'react'

// Single shared step list for the whole note-processing journey
// (save → analyze → apply template → format). Used by both HomeScreen and
// NoteDetailScreen so the doctor sees ONE continuous animation, not two.
export const NOTE_PROCESSING_STEPS = [
  'Saving recording...',
  'Analyzing transcript...',
  'Applying template...',
  'Formatting output...'
]

interface ProcessingOverlayProps {
  step: string
  progress: number
  onCancel?: () => void
  cyclingMessages?: boolean
  stepsList?: string[]
}

export default function ProcessingOverlay({ step, progress, onCancel, cyclingMessages, stepsList }: ProcessingOverlayProps) {
  const defaultSteps = [
    'Saving recording...',
    'Extracting medical terms...',
    'Applying template...',
    'Formatting notes...',
    'Finalizing...'
  ]
  const steps = stepsList || defaultSteps

  // Find the current step index. If not exactly matched, try partial match.
  let currentStepIndex = steps.indexOf(step)
  if (currentStepIndex === -1) {
    const match = steps.findIndex(s => s.toLowerCase().includes(step.toLowerCase()) || step.toLowerCase().includes(s.toLowerCase()))
    if (match !== -1) currentStepIndex = match
  }

  const isComplete = progress >= 100

  // ── Elapsed time counter (SLOWED: ticks every 2 seconds) ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
    setElapsedSeconds(0)
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 2000) // ← Tick every 2 seconds for a calmer feel
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── Self-contained bar animation system ──
  // Each step's bar fills independently at a smooth, consistent pace
  const [barProgress, setBarProgress] = useState<number[]>(() => steps.map(() => 0))
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // When step changes (from parent), smoothly progress bars
  const animateBar = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const delta = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    setBarProgress(prev => {
      const next = [...prev]
      let changed = false

      for (let i = 0; i < steps.length; i++) {
        if (isComplete) {
          // When complete, fill all bars rapidly
          if (next[i] < 100) {
            next[i] = Math.min(100, next[i] + (delta * 0.5))
            changed = true
          }
        } else if (i < currentStepIndex) {
          // Completed steps: fill to 100% quickly
          if (next[i] < 100) {
            next[i] = Math.min(100, next[i] + (delta * 0.4))
            changed = true
          }
        } else if (i === currentStepIndex) {
          // Current step: smooth fill up to 90% (leaves room for completion jump)
          const target = 90
          if (next[i] < target) {
            // Ease-out speed: faster at start, slower approaching target
            const remaining = target - next[i]
            const speed = Math.max(0.015, remaining * 0.0008)
            next[i] = Math.min(target, next[i] + (delta * speed))
            changed = true
          }
        } else {
          // Future steps: stay at 0
          if (next[i] !== 0) {
            next[i] = 0
            changed = true
          }
        }
      }

      return changed ? next : prev
    })

    animFrameRef.current = requestAnimationFrame(animateBar)
  }, [currentStepIndex, isComplete, steps.length])

  useEffect(() => {
    lastTimeRef.current = 0
    animFrameRef.current = requestAnimationFrame(animateBar)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [animateBar])

  // ── Compute visual progress from bar states ──
  const totalBars = steps.length
  const completedBars = barProgress.filter(b => b >= 100).length
  const currentBarContribution = barProgress[currentStepIndex] || 0
  const visualProgress = isComplete
    ? 100
    : Math.min(99, ((completedBars + currentBarContribution / 100) / totalBars) * 100)

  // ── Cycling messages ──
  const [cyclingText, setCyclingText] = useState(step)

  useEffect(() => {
    if (!cyclingMessages) {
      setCyclingText(step)
      return
    }
    setCyclingText(step)
    const messages = [
      step,
      'Analyzing content...',
      'Generating output...',
      'Formatting results...',
      'Almost done...'
    ]
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length
      setCyclingText(messages[idx])
    }, 2000)
    return () => clearInterval(interval)
  }, [step, cyclingMessages])

  const displayStep = cyclingMessages ? cyclingText : step

  // ── SVG circle metrics ──
  const circleRadius = 44
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circleCircumference - (visualProgress / 100) * circleCircumference

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'overlaySlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            {/* ── Circular Progress with Timer ── */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r={circleRadius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="6"
                />
                {/* Progress arc */}
                <circle
                  cx="50" cy="50" r={circleRadius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center content: Timer */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <div style={{ animation: 'checkmarkPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <>
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{
                        background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {formatTime(elapsedSeconds)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">
                      elapsed
                    </span>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {isComplete ? 'Processing Complete!' : 'Processing Your Notes'}
            </h3>
            <p className="text-gray-500 text-sm mb-4" style={{ animation: 'fadeInUp 0.3s ease' }} key={displayStep}>
              {isComplete ? 'Your notes are ready for review' : displayStep}
            </p>

            {/* Percentage display */}
            <div className="text-3xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {Math.round(visualProgress)}%
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="space-y-3">
            {steps.map((stepText, index) => {
              const isStepCompleted = barProgress[index] >= 100
              const isCurrent = index === currentStepIndex && !isComplete
              const isFuture = index > currentStepIndex && !isComplete

              return (
                <div
                  key={index}
                  className="flex items-center"
                  style={{
                    opacity: isFuture ? 0.4 : 1,
                    transition: 'opacity 0.5s ease'
                  }}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 transition-all duration-500 ${
                    isStepCompleted
                      ? 'bg-green-100 text-green-600 scale-100'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isStepCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium transition-colors duration-300 ${
                      isStepCompleted
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-blue-700'
                        : 'text-gray-500'
                    }`}>
                      {stepText}
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isStepCompleted
                            ? 'bg-green-400'
                            : isCurrent
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                        style={{
                          width: `${barProgress[index]}%`,
                          transition: 'width 0.3s ease-out, background-color 0.4s ease'
                        }}
                      />
                      {/* Shimmer effect on current bar */}
                      {isCurrent && (
                        <div
                          className="h-full rounded-full -mt-1 overflow-hidden"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.15) 50%, transparent 100%)',
                            animation: 'shimmer 2s infinite',
                            width: `${barProgress[index]}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pulsing status ── */}
          {!isComplete && (
            <div className="mt-6 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </div>
                <span>AI is analyzing your recording...</span>
              </div>
            </div>
          )}

          <div className="mt-6">
            {isComplete ? (
              <button
                onClick={onCancel}
                className="w-full font-semibold py-3 rounded-xl text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #16A34A, #14B8A6)' }}
              >
                View Results
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
              >
                Cancel Processing
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-50 py-3 px-4 text-center">
          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                <span>Secure processing</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                <span>HIPAA compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes overlaySlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes checkmarkPop {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}