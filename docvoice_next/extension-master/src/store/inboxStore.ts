import { create } from 'zustand'
import { InboxState, Note, PaginationMeta } from '../types/note'

interface InboxStore extends InboxState {
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (noteId: string, updates: Partial<Note>) => void
  removeNote: (noteId: string) => void
  setSelectedNoteId: (noteId: string | null) => void
  setLoading: (isLoading: boolean) => void
  setUnreadCount: (count: number) => void
  setPagination: (meta: PaginationMeta | null) => void
}

export const useInboxStore = create<InboxStore>((set) => ({
  notes: [],
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
  
  setPagination: (meta) => set({ pagination: meta })
}))