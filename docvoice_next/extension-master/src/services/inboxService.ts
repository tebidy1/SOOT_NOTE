import { apiClient } from './apiClient'
import { useInboxStore } from '../store/inboxStore'
import { Note, SuggestedMacro, PaginationMeta } from '../types/note'

class InboxService {
  private pollingInterval: NodeJS.Timeout | null = null
  private isPolling = false
  private readonly POLLING_INTERVAL = 300000 // 5 minutes

  async pollInbox(page = 1, perPage = 15): Promise<void> {
    try {
      useInboxStore.getState().setLoading(true)
      
      const response = await apiClient.getInbox(page, perPage)
      
      const payload = (response as any).payload || response.data
      const isSuccess = (response as any).code === 200 || response.success
      
      if (isSuccess && payload) {
        const notesData = payload?.data || (Array.isArray(payload) ? payload : [])
        const notes = notesData.map((note: any) => this.mapApiNoteToNote(note))
        
        useInboxStore.getState().setNotes(notes)
        
        const meta = payload?.meta || null
        if (meta) {
          useInboxStore.getState().setPagination(meta as PaginationMeta)
          useInboxStore.getState().setUnreadCount(meta.total)
        } else {
          useInboxStore.getState().setUnreadCount(notes.filter((n: Note) => n.status === 'pending').length)
        }
      }
    } catch (error) {
      console.error('Failed to poll inbox:', error)
    } finally {
      useInboxStore.getState().setLoading(false)
    }
  }

  async loadPage(page: number, perPage = 15): Promise<void> {
    return this.pollInbox(page, perPage)
  }

  startPolling(): void {
    if (this.isPolling) return

    this.isPolling = true
    this.pollInbox() // Initial poll

    this.pollingInterval = setInterval(() => {
      this.pollInbox()
    }, this.POLLING_INTERVAL)
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.isPolling = false
  }

  async getNote(noteId: string): Promise<Note | null> {
    try {
      const response = await apiClient.getNote(noteId)
      
      const payload = (response as any).payload || response.data
      const isSuccess = (response as any).code === 200 || response.success
      
      if (isSuccess && payload) {
        const fetchedNote = this.mapApiNoteToNote(payload)
        const existingNote = this.getNotes().find(n => n.id === noteId)
        if (existingNote && existingNote.outputs) {
          const mergedOutputs = [...existingNote.outputs]
          for (const newOut of fetchedNote.outputs) {
            const existingIdx = mergedOutputs.findIndex(o => o.macro_id === newOut.macro_id)
            if (existingIdx >= 0) {
              mergedOutputs[existingIdx] = newOut
            } else {
              mergedOutputs.push(newOut)
            }
          }
          fetchedNote.outputs = mergedOutputs
        }
        return fetchedNote
      }
    } catch (error) {
      console.error('Failed to get note:', error)
      return null
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const response = await apiClient.deleteNote(noteId)
      
      if (response.success || (response as any).code === 200) {
        useInboxStore.getState().removeNote(noteId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete note:', error)
      return false
    }
  }

  async updateNoteStatus(noteId: string, status: Note['status']): Promise<boolean> {
    try {
      const response = await apiClient.updateNoteStatus(noteId, status)
      if (response.success || (response as any).code === 200) {
        useInboxStore.getState().updateNote(noteId, { status })
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update note status:', error)
      return false
    }
  }

  async fetchMacros(): Promise<SuggestedMacro[]> {
    try {
      const response = await apiClient.getMacros()
      const payload = (response as any).payload || response.data
      const isSuccess = (response as any).code === 200 || response.success
      if (isSuccess && payload) {
        const macros = Array.isArray(payload) ? payload : (payload?.data || payload?.macros || [])
        return macros.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          company_id: m.company_id,
          trigger: m.trigger || m.name || '',
          category: m.category || 'general',
          content: m.content || '',
          is_ai_macro: m.is_ai_macro ?? false,
          is_favorite: m.is_favorite ?? false,
          ai_instruction: m.ai_instruction ?? null,
          usage_count: m.usage_count ?? 0,
          last_used: m.last_used ?? null,
          created_at: m.created_at || '',
          updated_at: m.updated_at || ''
        }))
      }
      return []
    } catch (error) {
      console.error('Failed to fetch macros:', error)
      return []
    }
  }

  async applyMacro(noteId: string, macroId: number): Promise<Note | null> {
    try {
      const response = await apiClient.applyMacro(noteId, macroId)
      const payload = (response as any).payload || response.data
      const isSuccess = (response as any).code === 200 || response.success
      if (isSuccess && payload) {
        const updatedNote = this.mapApiNoteToNote(payload)
        
        // Merge with existing outputs so we don't lose previous templates' tabs
        const existingNote = this.getNotes().find(n => n.id === noteId)
        if (existingNote && existingNote.outputs) {
          const mergedOutputs = [...existingNote.outputs]
          for (const newOut of updatedNote.outputs) {
            const existingIdx = mergedOutputs.findIndex(o => o.macro_id === newOut.macro_id)
            if (existingIdx >= 0) {
              mergedOutputs[existingIdx] = newOut
            } else {
              mergedOutputs.push(newOut)
            }
          }
          updatedNote.outputs = mergedOutputs
        }

        useInboxStore.getState().updateNote(noteId, updatedNote)
        return updatedNote
      }
      return null
    } catch (error) {
      console.error('Failed to apply macro:', error)
      return null
    }
  }

  async markAsRead(noteId: string): Promise<boolean> {
    return this.updateNoteStatus(noteId, 'completed')
  }

  getUnreadCount(): number {
    return useInboxStore.getState().unreadCount
  }

  getNotes(): Note[] {
    return useInboxStore.getState().notes
  }

  private mapApiNoteToNote(apiNote: any): Note {
    const fieldMappings = apiNote.field_mappings ||
      (apiNote.text_analyses && apiNote.text_analyses.length > 0
        ? apiNote.text_analyses[0].field_mappings || apiNote.text_analyses[0].analysis_data?.field_mappings || []
        : [])

    return {
      id: String(apiNote.id),
      uuid: apiNote.uuid ?? null,
      userId: String(apiNote.user_id),
      companyId: apiNote.company_id,
      title: apiNote.patient_name || 'Untitled',
      content: apiNote.raw_text || '',
      rawText: apiNote.raw_text || '',
      originalText: apiNote.original_text ?? null,
      formattedText: apiNote.formatted_text ?? null,
      patientName: apiNote.patient_name || 'Untitled',
      summary: apiNote.summary ?? null,
      audioPath: apiNote.audio_path ?? null,
      status: this.mapStatus(apiNote.status),
      appliedMacroId: apiNote.applied_macro_id ?? null,
      suggestedMacroId: apiNote.suggested_macro_id ?? null,
      suggestedMacro: apiNote.suggested_macro ?? null,
      outputs: apiNote.outputs ?? [],
      fieldMappings,
      review: apiNote.review ?? null,
      aiFlags: apiNote.ai_flags ?? [],
      company: apiNote.company ?? undefined,
      user: apiNote.user ?? undefined,
      createdAt: apiNote.created_at || new Date().toISOString(),
      updatedAt: apiNote.updated_at || new Date().toISOString()
    }
  }

  private mapStatus(status: string): Note['status'] {
    switch (status) {
      case 'pending':
      case 'processing':
      case 'completed':
      case 'failed':
        return status
      default:
        return 'pending'
    }
  }

  isPollingActive(): boolean {
    return this.isPolling
  }

  async clearInbox(): Promise<void> {
    useInboxStore.getState().setNotes([])
    useInboxStore.getState().setUnreadCount(0)
  }
}

export const inboxService = new InboxService()