import { create } from 'zustand'

interface RecordingState {
  isRecording: boolean
  audioBlob: Blob | null
  audioUrl: string | null
  duration: number
  error: string | null
  realtimeTranscript: string
  finalTranscript: string
  realtimeStatus: 'idle' | 'connecting' | 'authenticated' | 'error' | 'unavailable'
}

interface RecordingStore extends RecordingState {
  startRecording: () => void
  stopRecording: () => void
  setAudioBlob: (blob: Blob) => void
  setAudioUrl: (url: string) => void
  setDuration: (duration: number) => void
  setError: (error: string | null) => void
  setRealtimeTranscript: (text: string) => void
  setFinalTranscript: (text: string) => void
  setRealtimeStatus: (status: 'idle' | 'connecting' | 'authenticated' | 'error' | 'unavailable') => void
  clearRecording: () => void
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  isRecording: false,
  audioBlob: null,
  audioUrl: null,
  duration: 0,
  error: null,
  realtimeTranscript: '',
  finalTranscript: '',
  realtimeStatus: 'idle',
  
  startRecording: () => set({
    isRecording: true,
    error: null,
    realtimeTranscript: '',
    finalTranscript: '',
    realtimeStatus: 'connecting'
  }),
  
  stopRecording: () => set({
    isRecording: false
  }),
  
  setAudioBlob: (blob) => set({ audioBlob: blob }),
  
  setAudioUrl: (url) => set({ audioUrl: url }),
  
  setDuration: (duration) => set({ duration }),
  
  setError: (error) => set({ error, realtimeStatus: 'error' }),
  
  setRealtimeTranscript: (text) => set({ realtimeTranscript: text }),
  
  setFinalTranscript: (text) => set({ finalTranscript: text }),
  
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  
  clearRecording: () => set({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    error: null,
    realtimeTranscript: '',
    finalTranscript: '',
    realtimeStatus: 'idle'
  })
}))
