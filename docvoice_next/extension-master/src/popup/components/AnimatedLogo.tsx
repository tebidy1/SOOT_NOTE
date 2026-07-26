import { useEffect, useRef } from 'react'

export interface AnimatedLogoProps {
  onComplete?: () => void
  width?: number
  height?: number
}

export default function AnimatedLogo({ onComplete, width = 160, height = 140 }: AnimatedLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set scale for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    let startTimestamp: number | null = null
    const duration = 2200 // 2.2 seconds total duration
    let animationFrameId: number

    // Cubic easeOut function: easeOut(t) = 1 - (1 - t)^3
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    // Normalise progress inside a specific start/end interval
    const getInterval = (progress: number, start: number, end: number) => {
      if (progress <= start) return 0
      if (progress >= end) return 1
      return (progress - start) / (end - start)
    }

    const ease = (t: number) => easeOut(t)

    const draw = (progress: number) => {
      // Clear canvas before drawing
      ctx.clearRect(0, 0, width, height)

      // Scale factor mapping 110x100 coordinates
      const s = width / 110 

      // Brand color constants
      const accentCyan = '#06B6D4' // BrandColors.accentCyan
      const darkNavy = '#0B1F3B' // BrandColors.darkNavy
      const white = '#FFFFFF'

      // Animations values derived from the timeline progress (0 to 1)
      const clipOp = ease(getInterval(progress, 0.055, 0.145))
      const clipSc = 0.96 + 0.04 * ease(getInterval(progress, 0.055, 0.145))

      const badgeT = getInterval(progress, 0.145, 0.227)
      const badgeOp = ease(badgeT)
      let badgeSc = 0
      if (badgeT < 0.6) {
        badgeSc = 0.80 + 0.25 * (badgeT / 0.6)
      } else {
        badgeSc = 1.05 - 0.05 * ((badgeT - 0.6) / 0.4)
      }

      const pulseProgress = getInterval(progress, 0.227, 0.386)
      const waveProgress = getInterval(progress, 0.227, 0.386)
      const morphProgress = getInterval(progress, 0.386, 0.568)

      // 1) Drawing Clipboard
      if (clipOp > 0) {
        ctx.save()

        // Apply scale around clipboard center: (cx, cy)
        const cx = 25 * s
        const cy = 50 * s
        ctx.translate(cx, cy)
        ctx.scale(clipSc, clipSc)
        ctx.translate(-cx, -cy)

        // Set opacity
        ctx.globalAlpha = clipOp

        // Body stroke
        ctx.strokeStyle = darkNavy
        ctx.lineWidth = 3.5 * s
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.roundRect(0, 22 * s, 50 * s, 62 * s, 6 * s)
        ctx.stroke()

        // Top clip rectangle
        ctx.fillStyle = darkNavy
        ctx.beginPath()
        ctx.roundRect(15 * s, 16 * s, 20 * s, 10 * s, 2 * s)
        ctx.fill()

        // Top circle pin
        ctx.beginPath()
        ctx.arc(25 * s, 11 * s, 5 * s, 0, 2 * Math.PI)
        ctx.fill()

        // ── Content lines inside clipboard (appears during morph/finalize)
        if (morphProgress > 0) {
          for (let i = 0; i < 3; i++) {
            const stagger = Math.max(0, Math.min(1, morphProgress - i * 0.20))
            const lineOp = ease(stagger)
            const slideX = 4 * s * (1 - lineOp)
            const y = (38 + i * 15) * s
            const endX = (i === 2 ? 32 : 40) * s

            ctx.save()
            ctx.globalAlpha = lineOp * clipOp

            // Checkbox square
            ctx.strokeStyle = darkNavy
            ctx.lineWidth = 2 * s
            ctx.beginPath()
            ctx.roundRect((8 + slideX / s) * s, y - 3.5 * s, 7 * s, 7 * s, 1.5 * s)
            ctx.stroke()

            // Line text
            ctx.lineWidth = 3 * s
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo((20 + slideX / s) * s, y)
            ctx.lineTo(endX + slideX, y)
            ctx.stroke()

            ctx.restore()
          }
        }

        ctx.restore()
      }

      // 2) Drawing Pulse Rings
      if (pulseProgress > 0 && pulseProgress < 1) {
        const ringCx = 68 * s
        const ringCy = 22 * s
        ctx.save()
        for (let i = 0; i < 2; i++) {
          const delay = i * 0.35
          const t = Math.max(0, Math.min(1, (pulseProgress - delay) / 0.65))
          if (t <= 0) continue

          const radius = 20 * s + 18 * s * t
          const opacity = (1.0 - t) * 0.5

          ctx.strokeStyle = accentCyan
          ctx.globalAlpha = opacity
          ctx.lineWidth = 2 * s
          ctx.beginPath()
          ctx.arc(ringCx, ringCy, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        ctx.restore()
      }

      // 3) Drawing Badge (mic circle)
      if (badgeOp > 0) {
        ctx.save()

        const bCx = 68 * s
        const bCy = 22 * s
        ctx.translate(bCx, bCy)
        ctx.scale(badgeSc, badgeSc)
        ctx.translate(-bCx, -bCy)

        ctx.globalAlpha = badgeOp

        // Subtle drop shadow/glow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
        ctx.beginPath()
        ctx.arc(bCx, bCy + 1.5 * s, 22 * s, 0, 2 * Math.PI)
        ctx.fill()

        // White background circle
        ctx.fillStyle = white
        ctx.beginPath()
        ctx.arc(bCx, bCy, 22 * s, 0, 2 * Math.PI)
        ctx.fill()

        // Cyan ring
        ctx.strokeStyle = accentCyan
        ctx.lineWidth = 3.5 * s
        ctx.beginPath()
        ctx.arc(bCx, bCy, 18 * s, 0, 2 * Math.PI)
        ctx.stroke()

        // Mic capsule body
        ctx.fillStyle = darkNavy
        ctx.beginPath()
        ctx.roundRect(65 * s, 12 * s, 6 * s, 12 * s, 3 * s)
        ctx.fill()

        // Mic cup arc
        ctx.strokeStyle = darkNavy
        ctx.lineWidth = 2.2 * s
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(68 * s, 21 * s, 7 * s, 0, Math.PI) // draws bottom semicircle
        ctx.stroke()

        // Mic stands
        ctx.beginPath()
        ctx.moveTo(68 * s, 26.5 * s)
        ctx.lineTo(68 * s, 31 * s)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(64 * s, 31 * s)
        ctx.lineTo(72 * s, 31 * s)
        ctx.stroke()

        // Sound wave ticks
        if (waveProgress > 0 && morphProgress < 1) {
          const waveOp = (1.0 - morphProgress) * badgeOp
          ctx.strokeStyle = accentCyan
          ctx.globalAlpha = waveOp * 0.8
          ctx.lineWidth = 2 * s
          ctx.lineCap = 'round'

          const wobble = Math.sin(waveProgress * Math.PI * 4) * 2 * s

          // Left wave tick
          ctx.beginPath()
          ctx.moveTo(57 * s, (18 + wobble / s) * s)
          ctx.lineTo(57 * s, (25 - wobble / s) * s)
          ctx.stroke()

          // Right wave tick
          ctx.beginPath()
          ctx.moveTo(79 * s, (17 - wobble / s) * s)
          ctx.lineTo(79 * s, (26 + wobble / s) * s)
          ctx.stroke()
        }

        ctx.restore()
      }
    }

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)

      draw(progress)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        if (onComplete) {
          onComplete()
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [width, height, onComplete])

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
        }}
      />
    </div>
  )
}
