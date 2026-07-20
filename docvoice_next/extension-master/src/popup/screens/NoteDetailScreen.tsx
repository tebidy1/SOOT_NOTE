import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useInboxStore } from '../../store/inboxStore'
import { inboxService } from '../../services/inboxService'

import { Note, NoteOutput, SuggestedMacro, FieldMapping, toDisplayStatus, displayStatusColor } from '../../types/note'
import ProcessingOverlay, { NOTE_PROCESSING_STEPS } from '../components/ProcessingOverlay'
import NoteViewer, { generateClipboardHTML } from '../components/NoteViewer'
import { injectionService } from '../../services/injectionService'
import Logo from '../components/Logo'


// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: These functions are injected into the target page via
// chrome.scripting.executeScript({ func }). Chrome serialises them with
// .toString(), so every helper they need MUST be defined *inside* them.
// Do NOT reference any outer-scope symbol; the bundler will hoist it away
// and the reference will be a ReferenceError on the target page.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const injectFieldMappings = function(mappings: { form_field: string; value: string; form_type: string }[]) {
  const _norm = (s: string): string => s.replace(/_/g, ' ').toLowerCase().replace(/[:;*。，、：；\s]+/g, ' ').trim()

  const _resolveInput = (label: HTMLLabelElement): HTMLElement | null => {
    if (label.htmlFor) {
      const el = document.getElementById(label.htmlFor)
      if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return el
    }
    const inside = label.querySelector('input, textarea, select')
    if (inside && (inside instanceof HTMLInputElement || inside instanceof HTMLTextAreaElement || inside instanceof HTMLSelectElement)) return inside as HTMLElement
    const parent = label.parentElement
    if (parent) {
      for (const child of Array.from(parent.children)) {
        if (child !== label && (child instanceof HTMLInputElement || child instanceof HTMLTextAreaElement || child instanceof HTMLSelectElement)) return child
      }
    }
    return null
  }

  const _findField = (formField: string): HTMLElement | null => {
    const target = _norm(formField)
    const labels = Array.from(document.querySelectorAll('label'))

    let exactMatch: HTMLLabelElement | undefined
    let partialMatch: HTMLLabelElement | undefined

    for (const label of labels) {
      const normText = _norm(label.textContent || '')
      if (normText === target) { exactMatch = label; break }
      if (!partialMatch && normText.includes(target)) { partialMatch = label }
    }

    const matchedLabel = exactMatch || partialMatch
    if (matchedLabel) {
      const input = _resolveInput(matchedLabel)
      if (input) return input
    }

    return document.querySelector(
      `input[name="${formField}"], textarea[name="${formField}"], select[name="${formField}"],` +
      `input[id="${formField}"], textarea[id="${formField}"], select[id="${formField}"],` +
      `input[placeholder*="${target}"], textarea[placeholder*="${target}"]`
    ) as HTMLElement | null
  }

  const _fill = (element: HTMLElement, value: string): boolean => {
    const niSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    const ntSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
    if (element instanceof HTMLInputElement) {
      niSetter?.call(element, value)
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
    if (element instanceof HTMLTextAreaElement) {
      ntSetter?.call(element, value)
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
    if (element instanceof HTMLSelectElement) {
      for (const opt of Array.from(element.options)) {
        if (opt.value === value || opt.text === value) {
          opt.selected = true
          element.dispatchEvent(new Event('change', { bubbles: true }))
          return true
        }
      }
    }
    return false
  }

  console.log('[PAGE] injectFieldMappings called with', mappings.length, 'mappings:', mappings)
  let filledCount = 0
  for (const mapping of mappings) {
    console.log('[PAGE] Processing field:', mapping.form_field, '→', mapping.value)
    const el = _findField(mapping.form_field)
    console.log('[PAGE] Element found:', el)
    if (el && _fill(el, mapping.value)) {
      console.log('[PAGE] ✅ Filled:', mapping.form_field)
      filledCount++
    } else {
      console.warn('[PAGE] ❌ Could not fill:', mapping.form_field)
    }
  }

  const notif = document.createElement('div')
  notif.textContent = filledCount > 0
    ? `ScribeFlow: Filled ${filledCount} fields`
    : 'ScribeFlow: No matching fields found'
  Object.assign(notif.style, {
    position: 'fixed', top: '20px', right: '20px', zIndex: '10000',
    padding: '12px 20px', borderRadius: '8px', color: 'white',
    fontSize: '14px', fontFamily: 'system-ui',
    backgroundColor: filledCount > 0 ? '#10b981' : '#f59e0b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  })
  document.body.appendChild(notif)
  setTimeout(() => notif.remove(), 3000)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const injectContentFallback = function(content: string) {
  /* ── inline helpers ── */
  // Parse both "KEY: value" (single line) and the sectioned format the backend
  // now emits ("KEY:" on its own line, value on the following lines).
  const _parseSections = (raw: string): Record<string, string> => {
    const out: Record<string, string> = {}
    const isHeader = (l: string) => {
      const t = l.trim()
      if (!t.endsWith(':')) return false
      const letters = t.slice(0, -1).replace(/[^A-Za-z]/g, '')
      return letters.length >= 2 && letters === letters.toUpperCase()
    }
    const lines = raw.split('\n')
    let curKey: string | null = null
    let buf: string[] = []
    const flush = () => {
      if (curKey && buf.length) {
        const v = buf.join(' ').trim()
        if (v) out[curKey] = v
      }
      buf = []
    }
    for (const line of lines) {
      if (isHeader(line)) {
        flush()
        curKey = line.trim().slice(0, -1).trim().toLowerCase().replace(/\s+/g, '_')
      } else {
        const ci = line.indexOf(':')
        if (curKey === null && ci > -1) {
          const key = line.substring(0, ci).trim().toLowerCase().replace(/\s+/g, '_')
          const val = line.substring(ci + 1).trim()
          if (key && val) out[key] = val
        } else if (line.trim()) {
          buf.push(line.trim())
        }
      }
    }
    flush()
    return out
  }

  const _findField = (formField: string): HTMLElement | null => {
    const labelText = formField.replace(/_/g, ' ').toLowerCase().trim()
    const labels = Array.from(document.querySelectorAll('label'))
    const matchedLabel = labels.find((label: HTMLLabelElement) => {
      const text = (label.textContent || '').toLowerCase().trim()
      return text === labelText || text.includes(labelText)
    }) as HTMLLabelElement | undefined
    if (matchedLabel) {
      if (matchedLabel.htmlFor) {
        const el = document.getElementById(matchedLabel.htmlFor) as HTMLElement | null
        if (el) return el
      }
      const inside = matchedLabel.querySelector('input, textarea, select') as HTMLElement | null
      if (inside) return inside
      const parent = matchedLabel.parentElement
      if (parent) {
        const sib = parent.querySelector('input, textarea, select') as HTMLElement | null
        if (sib && sib !== (matchedLabel as unknown as HTMLElement)) return sib
      }
    }
    return document.querySelector(
      `input[name="${formField}"], textarea[name="${formField}"], select[name="${formField}"],` +
      `input[id="${formField}"], textarea[id="${formField}"], select[id="${formField}"]`
    ) as HTMLElement | null
  }

  const _fill = (element: HTMLElement, value: string): boolean => {
    const niSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    const ntSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
    if (element instanceof HTMLInputElement) {
      niSetter?.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return true
    }
    if (element instanceof HTMLTextAreaElement) {
      ntSetter?.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return true
    }
    if (element instanceof HTMLSelectElement) {
      for (const opt of Array.from(element.options)) {
        if (opt.value === value || opt.text === value) { opt.selected = true; element.dispatchEvent(new Event('change', { bubbles: true })); return true }
      }
    }
    return false
  }
  /* ── end helpers ── */

  console.log('[PAGE-FALLBACK] injectContentFallback called, content length:', content.length)
  const data = _parseSections(content)
  console.log('[PAGE-FALLBACK] Parsed fields from content:', data)

  let filledCount = 0
  for (const [key, value] of Object.entries(data)) {
    const el = _findField(key)
    if (el && _fill(el, value)) filledCount++
  }

  const notif = document.createElement('div')
  notif.textContent = filledCount > 0 ? `ScribeFlow: Filled ${filledCount} fields (fallback)` : 'ScribeFlow: No fields matched'
  Object.assign(notif.style, {
    position: 'fixed', top: '20px', right: '20px', zIndex: '10000',
    padding: '12px 20px', borderRadius: '8px', color: 'white',
    fontSize: '14px', fontFamily: 'system-ui',
    backgroundColor: filledCount > 0 ? '#10b981' : '#f59e0b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  })
  document.body.appendChild(notif)
  setTimeout(() => notif.remove(), 3000)
}

export default function NoteDetailScreen() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes } = useInboxStore()

  const [note, setNote] = useState<Note | null>(null)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [quickMacros, setQuickMacros] = useState<SuggestedMacro[]>([])
  const [selectedMacroId, setSelectedMacroId] = useState<number | null>(null)
  const [generatedOutputs, setGeneratedOutputs] = useState<NoteOutput[]>([])
  const [editorContent, setEditorContent] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [reviewInfo, setReviewInfo] = useState<import('../../types/note').NoteReview | null>(null)
  const [generatingMessage, setGeneratingMessage] = useState('Analyzing transcript...')
  const [processingProgress, setProcessingProgress] = useState(0)
  // Same shared list as HomeScreen's saving overlay → one continuous animation
  const processingSteps = NOTE_PROCESSING_STEPS

  const FIELD_PREVIEW_TAB_INDEX = -1

  const fieldMappings = useMemo(() => note?.fieldMappings || [], [note?.fieldMappings])
  const isOnFieldPreviewTab = activeTabIndex === FIELD_PREVIEW_TAB_INDEX

  const location = useLocation()
  const [autoApplyTriggered, setAutoApplyTriggered] = useState(false)

  useEffect(() => {
    if (!noteId) return

    const existingNote = notes.find(n => n.id === noteId) || null
    if (existingNote) {
      setNote(existingNote)
      setGeneratedOutputs(existingNote.outputs || [])
      
      if (existingNote.appliedMacroId) {
        setSelectedMacroId(existingNote.appliedMacroId)
      } else if (existingNote.suggestedMacroId) {
        setSelectedMacroId(existingNote.suggestedMacroId)
      }

      if (existingNote.outputs && existingNote.outputs.length > 0) {
        const lastIndex = existingNote.outputs.length - 1
        setActiveTabIndex(lastIndex + 1)
        setEditorContent(existingNote.outputs[lastIndex].content || '')
      } else {
        setActiveTabIndex(0)
        setEditorContent(existingNote.rawText || '')
      }
    }
    
    // Always fetch fresh data from server
    loadNote()
  }, [noteId])

  useEffect(() => {
    // Auto-apply macro if we just came from HomeScreen's fast-track selection
    if (note && location.state?.autoApplyMacroId && !autoApplyTriggered && !isGenerating) {
      setAutoApplyTriggered(true)
      handleApplyMacro(location.state.autoApplyMacroId)
    }
  }, [note, location.state, autoApplyTriggered, isGenerating])

  useEffect(() => {
    loadMacros()
  }, [])

  const loadNote = async () => {
    if (!noteId) return
    const loaded = await inboxService.getNote(noteId)
    if (loaded) {
      setNote(loaded)
      setGeneratedOutputs(loaded.outputs || [])

      if (loaded.appliedMacroId) {
        setSelectedMacroId(loaded.appliedMacroId)
      } else if (loaded.suggestedMacroId) {
        setSelectedMacroId(loaded.suggestedMacroId)
      }

      if (loaded.outputs && loaded.outputs.length > 0) {
        const lastIndex = loaded.outputs.length - 1
        setActiveTabIndex(lastIndex + 1)
        setEditorContent(loaded.outputs[lastIndex].content || '')
      } else {
        setActiveTabIndex(0)
        setEditorContent(loaded.rawText || '')
      }
    }
  }

  const loadMacros = async () => {
    const macros = await inboxService.fetchMacros()
    setQuickMacros(macros)
  }

  const displayedMacros = useMemo(() => {
    if (!quickMacros.length) return []
    
    // Sort by favorites first, then alphabetical by trigger
    const sorted = [...quickMacros].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1
      return a.trigger.localeCompare(b.trigger)
    })

    // Move selected macro to the front
    const activeId = selectedMacroId || note?.appliedMacroId || note?.suggestedMacroId
    if (activeId) {
      const activeIndex = sorted.findIndex(m => m.id === activeId)
      if (activeIndex > -1) {
        const [activeMacro] = sorted.splice(activeIndex, 1)
        sorted.unshift(activeMacro)
      }
    }
    
    return sorted
  }, [quickMacros, selectedMacroId, note?.appliedMacroId, note?.suggestedMacroId])

  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleDelete = async () => {
    if (!noteId || !window.confirm('Delete this note?')) return
    const success = await inboxService.deleteNote(noteId)
    if (success) navigate('/inbox')
  }

  const handleMarkAsReady = async () => {
    if (!noteId) return
    const success = await inboxService.updateNoteStatus(noteId, 'completed')
    if (success && note) {
      setNote({ ...note, status: 'completed' })
    }
  }

  const handleApplyMacro = async (macroId: number) => {
    if (!noteId || isGenerating) return
    setSelectedMacroId(macroId)
    setIsGenerating(true)
    setIsTemplateExpanded(false)
    setGeneratingMessage('Analyzing transcript...')
    setProcessingProgress(0)

    try {
      // No artificial setTimeout pauses — the AI call is the real (and only)
      // wait; the overlay's bars animate smoothly on their own.
      setGeneratingMessage('Applying template...')
      setProcessingProgress(50)

      const updatedNote = await inboxService.applyMacro(noteId, macroId)

      setGeneratingMessage('Formatting output...')
      setProcessingProgress(90)

      if (updatedNote) {
        setProcessingProgress(100)
        setReviewInfo(updatedNote.review ?? null)
        setNote(updatedNote)
        setGeneratedOutputs(updatedNote.outputs || [])
        if (updatedNote.outputs && updatedNote.outputs.length > 0) {
          const lastIndex = updatedNote.outputs.length - 1
          setActiveTabIndex(lastIndex + 1)
          setEditorContent(updatedNote.outputs[lastIndex]?.content || '')
        }
        setIsTemplateExpanded(false)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTabSelect = (index: number) => {
    setActiveTabIndex(index)
    if (index === 0) {
      setEditorContent(note?.rawText || '')
    } else if (index > 0) {
      const outputIndex = index - 1
      setEditorContent(generatedOutputs[outputIndex]?.content || '')
    }
  }

  const handleCloseTab = (outputIndex: number) => {
    const newOutputs = generatedOutputs.filter((_, i) => i !== outputIndex)
    setGeneratedOutputs(newOutputs)
    if (note) {
      setNote({ ...note, outputs: newOutputs })
    }
    if (activeTabIndex === outputIndex + 1) {
      const newActive = newOutputs.length > 0 ? newOutputs.length : 0
      setActiveTabIndex(newActive)
      if (newActive === 0) {
        setEditorContent(note?.rawText || '')
      } else {
        setEditorContent(newOutputs[newActive - 1]?.content || '')
      }
    } else if (activeTabIndex > outputIndex + 1) {
      setActiveTabIndex(activeTabIndex - 1)
    }
  }

  const [isInjecting, setIsInjecting] = useState(false)

  const handleSmartCopyInject = async () => {
    console.log('[INJECT] 🚀 handleSmartCopyInject called')
    console.log('[INJECT] noteId:', noteId, '| isInjecting:', isInjecting)

    if (!noteId || isInjecting) {
      console.warn('[INJECT] ⛔ Blocked: noteId or isInjecting check failed', { noteId, isInjecting })
      return
    }

    // Clean the text before copying or injecting
    const cleanedContent = injectionService.applySmartCopy(editorContent)

    // Copy both plain text AND rich HTML to clipboard so it pastes beautifully
    try {
      const htmlContent = generateClipboardHTML(cleanedContent)
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
      const textBlob = new Blob([cleanedContent], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ])
    } catch {
      // Fallback to plain text if ClipboardItem is not available
      navigator.clipboard.writeText(cleanedContent)
    }

    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)

    setIsInjecting(true)
    setGeneratingMessage('Injecting fields...')

    try {
      console.log('[INJECT] 🔍 Querying active tab...')
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('[INJECT] Tabs found:', tabs)

      const tabId = tabs[0]?.id
      console.log('[INJECT] tabId:', tabId)

      if (!tabId) {
        console.error('[INJECT] ❌ No active tab found, aborting.')
        return
      }

      let fieldMappings = note?.fieldMappings || []
      console.log('[INJECT] 📋 fieldMappings from note:', fieldMappings)
      console.log('[INJECT] fieldMappings.length:', fieldMappings.length)

      // The field analysis runs in the background on the server after the note
      // is saved — if it wasn't ready when this screen loaded, refetch once now.
      if (fieldMappings.length === 0) {
        console.log('[INJECT] ⏳ No mappings yet — refetching note (background analysis may have finished)...')
        const fresh = await inboxService.getNote(noteId)
        if (fresh) {
          setNote(fresh)
          fieldMappings = fresh.fieldMappings || []
          console.log('[INJECT] 🔄 After refetch, fieldMappings.length:', fieldMappings.length)
        }
      }

      if (fieldMappings.length > 0) {
        console.log('[INJECT] ✅ fieldMappings exist, filtering by confidence >= 0.5 and non-null value...')

        const mappingsToInject = fieldMappings.filter(
          (m) => m.value !== null && m.value !== undefined && m.confidence >= 0.5
        ).map((m) => ({
          form_field: m.form_field,
          value: m.value!,
          form_type: m.form_type
        }))

        console.log('[INJECT] 🗂 mappingsToInject after filter:', mappingsToInject)
        console.log('[INJECT] mappingsToInject.length:', mappingsToInject.length)

        if (mappingsToInject.length > 0) {
          console.log('[INJECT] ✅ Injecting via injectFieldMappings...')
          await chrome.scripting.executeScript({
            target: { tabId },
            func: injectFieldMappings,
            args: [mappingsToInject]
          })
          console.log('[INJECT] ✅ injectFieldMappings script executed successfully')
        } else {
          console.warn('[INJECT] ⚠️ All mappings filtered out (confidence < 0.5 or null value), falling back to content injection')
          await chrome.scripting.executeScript({
            target: { tabId },
            func: injectContentFallback,
            args: [editorContent]
          })
          console.log('[INJECT] ✅ injectContentFallback (from empty mappings) executed')
        }
      } else {
        console.warn('[INJECT] ⚠️ No fieldMappings found on note, using content fallback')
        console.log('[INJECT] editorContent to inject:', editorContent.substring(0, 200))
        await chrome.scripting.executeScript({
          target: { tabId },
          func: injectContentFallback,
          args: [cleanedContent]
        })
        console.log('[INJECT] ✅ injectContentFallback (no mappings) executed')
      }
    } catch (err) {
      console.error('[INJECT] ❌ Exception caught:', err)
      console.log('[INJECT] 🔄 Attempting fallback after exception...')
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tabId = tabs[0]?.id
        console.log('[INJECT] Fallback tabId:', tabId)
        if (tabId) {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: injectContentFallback,
            args: [editorContent]
          })
          console.log('[INJECT] ✅ Fallback injectContentFallback executed after exception')
        } else {
          console.error('[INJECT] ❌ No tab found in catch block either')
        }
      } catch (fallbackErr) {
        console.error('[INJECT] ❌ Fallback also failed:', fallbackErr)
      }
    } finally {
      setIsInjecting(false)
      console.log('[INJECT] 🏁 handleSmartCopyInject finished')
    }
  }

  const handleInsurance = () => {
    const insuranceMacro = quickMacros.find(m =>
      m.trigger.toLowerCase().includes('insurance') ||
      m.category.toLowerCase().includes('insurance')
    )
    if (insuranceMacro) {
      handleApplyMacro(insuranceMacro.id)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isAutoApplying = location.state?.autoApplyMacroId && !autoApplyTriggered;

  if (!note) {
    if (isAutoApplying) {
      return (
        <div className="min-h-screen bg-white">
          <ProcessingOverlay
            step="Analyzing transcript..."
            progress={30}
            stepsList={processingSteps}
            onCancel={() => {}}
          />
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading note...</p>
        </div>
      </div>
    )
  }

  const displayStatus = toDisplayStatus(note.status, isCopied)
  const isOnGeneratedTab = activeTabIndex > 0 && !isOnFieldPreviewTab

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {isGenerating && (
        <ProcessingOverlay
          step={generatingMessage}
          progress={processingProgress}
          stepsList={processingSteps}
          onCancel={() => {}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="flex items-center space-x-3">
          <Logo className="h-12 w-auto" variant="dark" />
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 font-semibold px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg shadow-sm text-sm transition-all"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Note Sub-header details */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 text-sm">
              NO-{note.id.slice(-4)}
            </span>
            {note.patientName && note.patientName !== 'Untitled' && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-gray-700 font-medium text-sm truncate">{note.patientName}</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(note.createdAt)}</p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${displayStatusColor(displayStatus)}`}>
            {displayStatus}
          </span>

          <button
            onClick={handleDelete}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete note"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {note.status !== 'completed' && note.status !== 'failed' && (
            <button
              onClick={handleMarkAsReady}
              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Mark as ready"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabbed Editor */}
      <div className="flex-1 flex flex-col mt-3 min-h-0">
        {/* Tab Bar Container */}
        <div className="flex items-center justify-between border-b border-gray-200 px-2 flex-shrink-0">
          {/* Tabs Wrapper with fading edge indicators */}
          <div className="relative flex-1 overflow-hidden">
            <div className="flex items-center overflow-x-auto min-w-0 scrollbar-hide py-1 pr-8">
              <button
                onClick={() => handleTabSelect(0)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTabIndex === 0
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Source
              </button>
              {fieldMappings.length > 0 && (
                <button
                  onClick={() => handleTabSelect(FIELD_PREVIEW_TAB_INDEX)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    isOnFieldPreviewTab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Injection Data ({fieldMappings.length})</span>
                </button>
              )}
              {generatedOutputs.map((output, index) => (
                <div key={`${output.macro_id}-${index}`} className="flex items-center mr-1">
                  <button
                    onClick={() => handleTabSelect(index + 1)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1 ${
                      activeTabIndex === index + 1
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>{output.title || `Output ${index + 1}`}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(index) }}
                    className="p-0.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {/* Edge fades for modern horizontal scroll hint */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          </div>

          {/* Template Selector Dropdown */}
          <div className="relative flex-shrink-0 ml-2 py-1">
            <button
              onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm group"
              title="Apply new template"
            >
              <svg className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </button>

            {isTemplateExpanded && (
              <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transform origin-top-right transition-all duration-200">
                <div className="bg-gray-50/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Templates</span>
                </div>
                {displayedMacros.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">No templates available</p>
                  </div>
                ) : (
                  <div className="max-h-[290px] overflow-y-auto custom-scrollbar p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {displayedMacros.map(macro => {
                        const emojiRegex = /^([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
                        const match = macro.trigger.match(emojiRegex);
                        let emoji = '📄';
                        let text = macro.trigger;
                        if (match) {
                          emoji = match[0];
                          text = macro.trigger.replace(emojiRegex, '').trim();
                        } else if (macro.trigger.toLowerCase().includes('sick leave')) {
                          emoji = '🤒';
                        } else if (macro.trigger.toLowerCase().includes('free note')) {
                          emoji = '✨';
                        } else if (macro.trigger.toLowerCase().includes('discharge')) {
                          emoji = '🏥';
                        }
                        
                        return (
                          <button
                            key={macro.id}
                            onClick={() => handleApplyMacro(macro.id)}
                            disabled={isGenerating}
                            className="flex items-center space-x-2 p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-left text-xs font-semibold text-gray-700 hover:text-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors shadow-sm text-base">
                              {emoji}
                            </div>
                            <span className="truncate flex-1 font-semibold">{text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Numeric-integrity review banner (deterministic backend check) */}
        {reviewInfo && !reviewInfo.passed && (
          <div className="mx-3 mt-2 flex items-start space-x-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Please verify — </span>
              {reviewInfo.missing_numbers.length > 0 && (
                <span>values from dictation not found in the note: <span className="font-mono font-semibold">{reviewInfo.missing_numbers.join(', ')}</span>. </span>
              )}
              {reviewInfo.suspicious_ranges.length > 0 && (
                <span>possibly merged range(s): <span className="font-mono font-semibold">{reviewInfo.suspicious_ranges.join(', ')}</span>. </span>
              )}
            </div>
          </div>
        )}

        {/* Editor Area — unified view+edit with rich formatting */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isOnFieldPreviewTab ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-bold text-gray-800">Injection Data Preview</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {fieldMappings.filter(fm => fm.value != null && fm.value !== '').length}/{fieldMappings.length} fields with value
                </span>
              </div>
              {fieldMappings.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  No field mappings available. Use a template to generate injection data.
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const nonEmpty = fieldMappings.filter(fm => fm.value != null && fm.value !== '')
                    const empty = fieldMappings.filter(fm => fm.value == null || fm.value === '')
                    return (
                      <>
                        {nonEmpty.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-500 mb-2">Ready to inject</p>
                            <div className="space-y-1">
                              {nonEmpty.map((fm, i) => (
                                <div key={i} className="flex items-start space-x-3 p-3 bg-green-50/50 border border-green-200/50 rounded-lg">
                                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{fm.form_field}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
                                    <p className="text-xs text-gray-600 mt-0.5 truncate">{fm.value}</p>
                                  </div>
                                  {fm.confidence > 0 && (
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${fm.confidence > 0.7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {Math.round(fm.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {empty.length > 0 && (
                          <div>
                            {nonEmpty.length > 0 && <div className="h-4" />}
                            <p className="text-xs font-semibold text-gray-400 mb-2">Empty fields (skipped)</p>
                            <div className="space-y-1">
                              {empty.map((fm, i) => (
                                <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg">
                                  <svg className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600">{fm.form_field}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          ) : isOnGeneratedTab ? (
            <NoteViewer
              content={editorContent}
              onChange={setEditorContent}
              placeholder="Generated output will appear here..."
            />
          ) : (
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-full min-h-[300px] p-4 text-sm text-gray-800 font-mono resize-none focus:outline-none bg-white"
              placeholder="Raw transcript text..."
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Action Dock */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex-shrink-0">
        {isOnGeneratedTab && (
          <button
            onClick={handleInsurance}
            disabled={isGenerating || !quickMacros.some(m =>
              m.trigger.toLowerCase().includes('insurance') ||
              m.category.toLowerCase().includes('insurance')
            )}
            className="mb-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>INSURANCE</span>
          </button>
        )}
        <button
          onClick={handleSmartCopyInject}
          disabled={!editorContent.trim() || isInjecting}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isInjecting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>ANALYZING & INJECTING...</span>
            </>
          ) : isCopied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>COPIED!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>SMART COPY / INJECT</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
