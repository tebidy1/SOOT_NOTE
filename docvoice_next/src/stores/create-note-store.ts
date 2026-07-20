import { create } from 'zustand';

interface CreateNoteState {
  isOpen: boolean;
  onNoteCreated: ((note: any) => void) | null;
  pendingNote: any | null;
  open: (onNoteCreated?: (note: any) => void) => void;
  close: () => void;
  setPendingNote: (note: any | null) => void;
}

export const useCreateNoteStore = create<CreateNoteState>((set) => ({
  isOpen: false,
  onNoteCreated: null,
  pendingNote: null,
  open: (onNoteCreated) => set({ isOpen: true, onNoteCreated: onNoteCreated ?? null }),
  close: () => set({ isOpen: false, onNoteCreated: null }),
  setPendingNote: (note) => set({ pendingNote: note }),
}));
