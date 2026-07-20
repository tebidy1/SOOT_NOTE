import { create } from 'zustand'

interface RecordingState {
  isRecording: boolean
  isStarting: boolean
  isStopping: boolean
  audioBlob: Blob | null
  audioUrl: string | null
  duration: number
  error: string | null
  mimeType: string
  realtimeTranscript: string
  finalTranscript: string
  realtimeStatus: 'idle' | 'connecting' | 'authenticated' | 'error' | 'unavailable'
}

type RealtimeStatus = RecordingState['realtimeStatus']

interface RecordingStore extends RecordingState {
  startRecording: () => void
  stopRecording: () => void
  setStarting: (value: boolean) => void
  setStopping: (value: boolean) => void
  setAudioBlob: (blob: Blob, mimeType: string) => void
  setAudioUrl: (url: string) => void
  setDuration: (duration: number) => void
  setError: (error: string | null) => void
  setRealtimeTranscript: (text: string) => void
  setFinalTranscript: (text: string) => void
  setRealtimeStatus: (status: RealtimeStatus) => void
  clearRecording: () => void
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  isRecording: false,
  isStarting: false,
  isStopping: false,
  audioBlob: null,
  audioUrl: null,
  duration: 0,
  error: null,
  mimeType: 'audio/webm',
  realtimeTranscript: '',
  finalTranscript: '',
  realtimeStatus: 'idle',

  startRecording: () =>
    set({
      isRecording: true,
      isStarting: false,
      error: null,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      realtimeTranscript: '',
      finalTranscript: '',
      realtimeStatus: 'connecting',
    }),

  stopRecording: () => set({ isRecording: false }),

  setStarting: (value) => set({ isStarting: value }),

  setStopping: (value) => set({ isStopping: value }),

  setAudioBlob: (blob, mimeType) => set({ audioBlob: blob, mimeType }),

  setAudioUrl: (url) => set({ audioUrl: url }),

  setDuration: (duration) => set({ duration }),

  setError: (error) => set({ error, realtimeStatus: 'error' }),

  setRealtimeTranscript: (text) => set({ realtimeTranscript: text }),

  setFinalTranscript: (text) => set({ finalTranscript: text }),

  setRealtimeStatus: (status) => set({ realtimeStatus: status }),

  clearRecording: () =>
    set({
      isRecording: false,
      isStarting: false,
      isStopping: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null,
      mimeType: 'audio/webm',
      realtimeTranscript: '',
      finalTranscript: '',
      realtimeStatus: 'idle',
    }),
}))
