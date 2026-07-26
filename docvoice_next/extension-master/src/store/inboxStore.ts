import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InboxState, Note, PaginationMeta } from '../types/note'

interface InboxStore extends InboxState {
  interactedNotes: Record<string, 'copied' | 'injected'>
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (noteId: string, updates: Partial<Note>) => void
  removeNote: (noteId: string) => void
  setSelectedNoteId: (noteId: string | null) => void
  setLoading: (isLoading: boolean) => void
  setUnreadCount: (count: number) => void
  setPagination: (meta: PaginationMeta | null) => void
  setNoteInteraction: (noteId: string, action: 'copied' | 'injected') => void
}

export const useInboxStore = create<InboxStore>()(
  persist(
    (set) => ({
      notes: [],
      interactedNotes: {},
      unreadCount: 0,
      isLoading: false,
      selectedNoteId: null,
      pagination: null,
      
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => set((state) => ({
        notes: [note, ...state.notes]
      })),
      
      updateNote: (noteId, updates) => set((state) => ({
        notes: state.notes.map(note =>
          note.id === noteId ? { ...note, ...updates } : note
        )
      })),
      
      removeNote: (noteId) => set((state) => ({
        notes: state.notes.filter(note => note.id !== noteId)
      })),
      
      setSelectedNoteId: (noteId) => set({ selectedNoteId: noteId }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      setPagination: (meta) => set({ pagination: meta }),

      setNoteInteraction: (noteId, action) => set((state) => ({
        interactedNotes: { ...state.interactedNotes, [noteId]: action }
      }))
    }),
    {
      name: 'scribeflow-inbox',
      partialize: (state) => ({ interactedNotes: state.interactedNotes })
    }
  )
)