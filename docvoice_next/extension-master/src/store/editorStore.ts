import { create } from 'zustand'
import { Note, Template } from '../types/note'

interface EditorState {
  currentNote: Note | null
  selectedTemplate: Template | null
  processedContent: string
  isLoading: boolean
  error: string | null
}

interface EditorStore extends EditorState {
  setCurrentNote: (note: Note | null) => void
  setSelectedTemplate: (template: Template | null) => void
  setProcessedContent: (content: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearEditor: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  currentNote: null,
  selectedTemplate: null,
  processedContent: '',
  isLoading: false,
  error: null,
  
  setCurrentNote: (note) => set({ currentNote: note }),
  
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setProcessedContent: (content) => set({ processedContent: content }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearEditor: () => set({
    currentNote: null,
    selectedTemplate: null,
    processedContent: '',
    isLoading: false,
    error: null
  })
}))