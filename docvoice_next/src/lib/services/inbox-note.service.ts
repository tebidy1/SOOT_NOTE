import { createBaseService } from './base.service';

const baseNoteService = createBaseService('inbox-notes');
const baseMacroService = createBaseService('macros');

export const inboxNoteService = {
  ...baseNoteService,

  async getNotes(params?: Record<string, any>) {
    return baseNoteService.getPaginated(params);
  },

  async getNoteById(id: string | number) {
    return baseNoteService.getById(id);
  },

  async createNote(data: any) {
    return baseNoteService.create(data);
  },

  async updateNote(id: string | number, data: any) {
    return baseNoteService.update(id, data);
  },

  async deleteNote(id: string | number) {
    return baseNoteService.delete(id);
  },

  async updateNoteStatus(id: string | number, status: string) {
    return baseNoteService.customPatch(`inbox-notes/${id}/status`, { status });
  },

  async applyMacro(noteId: string | number, macroId: number) {
    return baseNoteService.customPost(`inbox-notes/${noteId}/apply-macro`, { macro_id: macroId });
  },

  async getMacros(params?: Record<string, any>) {
    return baseMacroService.getPaginated(params);
  },
};

export default inboxNoteService;
