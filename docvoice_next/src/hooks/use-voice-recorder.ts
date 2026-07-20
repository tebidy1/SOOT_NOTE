'use client'

import { useCallback, useEffect, useState } from 'react'
import { audioRecordingService } from '@/lib/services/audio-recording.service'
import { useRecordingStore } from '@/stores/recording-store'

export function useVoiceRecorder() {
  const isRecording = useRecordingStore((s) => s.isRecording)
  const isStarting = useRecordingStore((s) => s.isStarting)
  const isStopping = useRecordingStore((s) => s.isStopping)
  const audioBlob = useRecordingStore((s) => s.audioBlob)
  const audioUrl = useRecordingStore((s) => s.audioUrl)
  const duration = useRecordingStore((s) => s.duration)
  const error = useRecordingStore((s) => s.error)

  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported =
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    setIsSupported(supported)
  }, [])

  const startRecording = useCallback(async () => {
    await audioRecordingService.startRecording()
  }, [])

  const stopRecording = useCallback(async () => {
    const blob = await audioRecordingService.stopRecording()
    return blob
  }, [])

  const clearRecording = useCallback(() => {
    audioRecordingService.clearRecording()
  }, [])

  const formatDuration = useCallback(
    (seconds: number) => audioRecordingService.formatDuration(seconds),
    []
  )

  const getFileExtension = useCallback(
    () => audioRecordingService.getFileExtension(),
    []
  )

  return {
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
    getFileExtension,
  }
}
