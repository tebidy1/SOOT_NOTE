import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useInboxStore } from '../../store/inboxStore'
import { useSettingsStore } from '../../store/settingsStore'
import { inboxService } from '../../services/inboxService'

import { Note, NoteOutput, SuggestedMacro, FieldMapping, toDisplayStatus, displayStatusColor } from '../../types/note'
import ProcessingOverlay, { NOTE_PROCESSING_STEPS } from '../components/ProcessingOverlay'
import NoteViewer, { generateClipboardHTML } from '../components/NoteViewer'
import { injectionService } from '../../services/injectionService'
import Logo from '../components/Logo'
import { platform } from '../../platform'


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
    ? `SoutNote: Filled ${filledCount} fields`
    : 'SoutNote: No matching fields found'
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
    const friendlyToRaw: Record<string, string> = {
      'patient_complaints': 'patientcomplaintstext',
      'patient_notes': 'patientnotes',
      'pain_score': 'painscore'
    }
    const mappedField = friendlyToRaw[formField] || formField

    const labelText = formField.replace(/_/g, ' ').toLowerCase().trim()
    const rawLabelText = mappedField.replace(/_/g, ' ').toLowerCase().trim()

    const labels = Array.from(document.querySelectorAll('label'))
    const matchedLabel = labels.find((label: HTMLLabelElement) => {
      const text = (label.textContent || '').toLowerCase().trim()
      return text === labelText || text.includes(labelText) || text === rawLabelText || text.includes(rawLabelText)
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
      `input[name="${mappedField}"], textarea[name="${mappedField}"], select[name="${mappedField}"],` +
      `input[id="${mappedField}"], textarea[id="${mappedField}"], select[id="${mappedField}"],` +
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
  notif.textContent = filledCount > 0 ? `SoutNote: Filled ${filledCount} fields (fallback)` : 'SoutNote: No fields matched'
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
  const { notes, setNoteInteraction } = useInboxStore()
  const { theme } = useSettingsStore()

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

  const tabsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeTabEl = tabsContainerRef.current?.querySelector('[data-active="true"]')
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [activeTabIndex, generatedOutputs])

  const FIELD_PREVIEW_TAB_INDEX = -1

  const fieldMappings = useMemo(() => note?.fieldMappings || [], [note?.fieldMappings])
  const isOnFieldPreviewTab = activeTabIndex === FIELD_PREVIEW_TAB_INDEX

  const location = useLocation()
  const [autoApplyTriggered, setAutoApplyTriggered] = useState(false)

  useEffect(() => {
    if (!noteId) return

    const existingNote = notes.find(n => n.id === noteId) || null
    let hasInitialized = false
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
      hasInitialized = true
    }
    
    // Always fetch fresh data from server
    const fetchNote = async () => {
      const loaded = await inboxService.getNote(noteId)
      if (loaded) {
        setNote(loaded)
        setGeneratedOutputs(loaded.outputs || [])

        if (loaded.appliedMacroId) {
          setSelectedMacroId(loaded.appliedMacroId)
        } else if (loaded.suggestedMacroId) {
          setSelectedMacroId(loaded.suggestedMacroId)
        }

        // Only force tab switch if we haven't initialized yet
        // This prevents a delayed load from resetting the user's active tab
        if (!hasInitialized) {
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
    }
    fetchNote()
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

      const processingMode = useSettingsStore.getState().processingMode
      const updatedNote = await inboxService.applyMacro(noteId, macroId, processingMode)

      setGeneratingMessage('Formatting output...')
      setProcessingProgress(90)

      if (updatedNote) {
        setProcessingProgress(100)
        setReviewInfo(updatedNote.review ?? null)
        setNote(updatedNote)
        setGeneratedOutputs(updatedNote.outputs || [])
        if (updatedNote.outputs && updatedNote.outputs.length > 0) {
          const targetIndex = updatedNote.outputs.findIndex(o => o.macro_id === macroId)
          const idxToUse = targetIndex >= 0 ? targetIndex : updatedNote.outputs.length - 1
          setActiveTabIndex(idxToUse + 1)
          setEditorContent(updatedNote.outputs[idxToUse]?.content || '')
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
    setNoteInteraction(noteId, 'copied')

    // PWA has no access to another site's DOM (sandboxed origin). Copy is the
    // full journey there — no chrome.scripting.executeScript to attempt.
    if (!platform.isExtension) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
      return
    }

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

      // Field mappings are generated inline when applyMacro is called. If none
      // are on the current state, refetch in case a prior session already ran one.
      if (fieldMappings.length === 0) {
        console.log('[INJECT] ⏳ No mappings yet — refetching note...')
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
    <div className="h-screen bg-white dark:bg-[#0F172A] flex flex-col overflow-hidden relative">
      {isGenerating && (
        <ProcessingOverlay
          step={generatingMessage}
          progress={processingProgress}
          stepsList={processingSteps}
          onCancel={() => {}}
        />
      )}

      {/* Header — pinned at top, never scrolls. Removed hard borders. */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-sm flex-shrink-0 z-30">
        <div className="flex items-center space-x-3">
          <Logo className="h-11 w-auto" variant={theme === 'dark' ? 'light' : 'dark'} />
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold px-3 py-1.5 bg-[#F1F5F9] dark:bg-[#1E293B]/80 border border-slate-200 dark:border-slate-700 rounded-lg shadow-none text-sm transition-all"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>


      {/* Tabbed Editor Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1E293B] border-t border-transparent dark:border-slate-800 rounded-t-3xl shadow-none mx-0 mt-2 z-20">
        {/* Tab Bar Container — removed hard borders */}
        <div className="flex items-center justify-between px-4 pt-3 flex-shrink-0">
          {/* Tabs Wrapper with fading edge indicators */}
          <div className="relative flex-1 overflow-hidden">
            <div ref={tabsContainerRef} className="flex items-center overflow-x-auto min-w-0 scrollbar-hide py-1 pr-8">
              <button
                onClick={() => handleTabSelect(0)}
                data-active={activeTabIndex === 0}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTabIndex === 0
                    ? 'border-blue-600 text-blue-600 dark:border-[#38BDF8] dark:text-[#38BDF8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Source
              </button>
              {fieldMappings.length > 0 && (
                <button
                  onClick={() => handleTabSelect(FIELD_PREVIEW_TAB_INDEX)}
                  data-active={isOnFieldPreviewTab}
                  className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    isOnFieldPreviewTab
                      ? 'border-blue-600 text-blue-600 dark:border-[#38BDF8] dark:text-[#38BDF8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
                    data-active={activeTabIndex === index + 1}
                    className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1 ${
                      activeTabIndex === index + 1
                        ? 'border-blue-600 text-blue-600 dark:border-[#38BDF8] dark:text-[#38BDF8]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>{output.title || `Output ${index + 1}`}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(index) }}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {/* Edge fades for modern horizontal scroll hint */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white dark:from-[#1E293B] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#1E293B] to-transparent pointer-events-none" />
          </div>

          {/* Template Selector Dropdown */}
          <div className="relative flex-shrink-0 ml-2 py-1">
            <button
              onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 dark:bg-[#0F172A] hover:bg-blue-50 dark:hover:bg-[#1E293B] hover:text-blue-600 dark:hover:text-[#38BDF8] rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm group"
              title="Apply new template"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-[#38BDF8] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </button>

            {isTemplateExpanded && (
              <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transform origin-top-right transition-all duration-200">
                <div className="bg-gray-50/80 dark:bg-[#0F172A]/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Templates</span>
                </div>
                {displayedMacros.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No templates available</p>
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
                            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-[#0F172A] hover:bg-blue-50 dark:hover:bg-[#1E293B] rounded-xl text-left text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E293B] group-hover:bg-blue-100 dark:group-hover:bg-[#0F172A] flex items-center justify-center flex-shrink-0 transition-colors shadow-sm text-base">
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

        {/* Editor Area — unified view+edit with rich formatting */}
        <div className="flex-1 min-h-0 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-16">
          {/* Verification banner — now inside scroll area so it scrolls up with content */}
          {reviewInfo && !reviewInfo.passed && (
            <div className="mx-4 mt-3 mb-2 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-[#2A2312]/40 p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2.5">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wide">
                  Verify before signing
                </span>
              </div>
              <ul className="text-[13px] text-amber-800 dark:text-amber-200/90 leading-relaxed space-y-2 ml-1">
                {reviewInfo.unverified && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Automatic formatting could not be verified.</span>
                    <span className="opacity-90"> — the AI did not return a structured result, so none of the safety checks could run. Read the entire note against your dictation before signing.</span>
                  </li>
                )}
                {reviewInfo.missing_numbers.length > 0 && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Numbers not in the note:</span>{' '}
                    <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{reviewInfo.missing_numbers.join(', ')}</span>
                    <span className="opacity-90"> — you dictated them; confirm they weren't dropped.</span>
                  </li>
                )}
                {reviewInfo.suspicious_ranges.length > 0 && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Merged into a range:</span>{' '}
                    <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{reviewInfo.suspicious_ranges.join(', ')}</span>
                    <span className="opacity-90"> — two separate readings may have been joined.</span>
                  </li>
                )}
                {!!reviewInfo.unverified_entities?.length && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Acronyms not heard in dictation:</span>{' '}
                    <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{reviewInfo.unverified_entities.join(', ')}</span>
                    <span className="opacity-90"> — the AI may have substituted a wrong test/drug.</span>
                  </li>
                )}
                {!!reviewInfo.unverified_terms?.length && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Drug/test names to double-check:</span>{' '}
                    <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{reviewInfo.unverified_terms.join(', ')}</span>
                    <span className="opacity-90"> — not a phonetic match to anything you said.</span>
                  </li>
                )}
                {!!reviewInfo.polarity_flags?.length && (
                  <li>
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Possible reversed meaning:</span>{' '}
                    <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{reviewInfo.polarity_flags.join(', ')}</span>
                    <span className="opacity-90"> — negation disagrees with dictation (e.g. you may have said "denies X" but the note asserts X).</span>
                  </li>
                )}
              </ul>
            </div>
          )}
          {isOnFieldPreviewTab ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Injection Data Preview</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  {fieldMappings.filter(fm => fm.value != null && fm.value !== '').length}/{fieldMappings.length} fields with value
                </span>
              </div>

              {/* Injection-path safety net */}
              {note?.fieldReview && !note.fieldReview.passed && (
                <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-[#2A2312]/40 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2.5">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wide">
                      Verify before injecting
                    </span>
                  </div>
                  <ul className="text-[13px] text-amber-800 dark:text-amber-200/90 leading-relaxed space-y-2 ml-1">
                    {note.fieldReview.missing_numbers.length > 0 && (
                      <li>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Numbers not in the injection data:</span>{' '}
                        <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{note.fieldReview.missing_numbers.join(', ')}</span>
                      </li>
                    )}
                    {note.fieldReview.suspicious_ranges.length > 0 && (
                      <li>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Merged into a range:</span>{' '}
                        <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{note.fieldReview.suspicious_ranges.join(', ')}</span>
                      </li>
                    )}
                    {!!note.fieldReview.unverified_entities?.length && (
                      <li>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Acronyms not heard in dictation:</span>{' '}
                        <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{note.fieldReview.unverified_entities.join(', ')}</span>
                      </li>
                    )}
                    {!!note.fieldReview.unverified_terms?.length && (
                      <li>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Drug/test names to double-check:</span>{' '}
                        <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{note.fieldReview.unverified_terms.join(', ')}</span>
                      </li>
                    )}
                    {!!note.fieldReview.polarity_flags?.length && (
                      <li>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Possible reversed meaning:</span>{' '}
                        <span className="font-mono font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{note.fieldReview.polarity_flags.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {fieldMappings.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
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
                          <div className="mb-6">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-3 uppercase tracking-wider">Ready to inject</p>
                            <div className="space-y-2.5">
                              {nonEmpty.map((fm, i) => (
                                <div key={i} className="flex items-start space-x-3 p-2.5 bg-green-50/40 dark:bg-slate-800/40 border border-green-100/50 dark:border-green-900/20 rounded-xl shadow-sm">
                                  <svg className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{fm.form_field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
                                    <p className="text-[13px] text-gray-600 dark:text-slate-400 mt-1 truncate">{fm.value}</p>
                                  </div>
                                  {fm.confidence > 0 && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${fm.confidence > 0.7 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'}`}>
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
                            {nonEmpty.length > 0 && <div className="h-2" />}
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Empty fields (skipped)</p>
                            <div className="space-y-2">
                              {empty.map((fm, i) => (
                                <div key={i} className="flex items-start space-x-3 p-2.5 bg-gray-50/50 dark:bg-[#0F172A]/50 border border-transparent rounded-xl">
                                  <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h8" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{fm.form_field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
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
              className="w-full min-h-[300px] p-5 text-[14px] leading-relaxed text-gray-800 dark:text-slate-200 font-sans resize-none focus:outline-none bg-white dark:bg-[#1E293B]"
              placeholder="Raw transcript text..."
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Floating Action Dock */}
      <div className="absolute bottom-5 left-0 right-0 flex flex-row items-center justify-center gap-2 pointer-events-none z-40 px-3">
        <button
          onClick={handleSmartCopyInject}
          disabled={!editorContent.trim() || isInjecting}
          className="w-auto px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-600 text-white font-bold shadow-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 pointer-events-auto border-none text-xs"
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
              <span>{platform.isExtension ? 'SMART COPY / INJECT' : 'COPY'}</span>
            </>
          )}
        </button>

        {/* Floating Insurance Button */}
        {isOnGeneratedTab && (
          <button
            onClick={handleInsurance}
            disabled={isGenerating || !quickMacros.some(m =>
              m.trigger.toLowerCase().includes('insurance') ||
              m.category.toLowerCase().includes('insurance')
            )}
            className="px-3 py-2 bg-white dark:bg-[#1E293B] text-blue-600 dark:text-[#38BDF8] border border-gray-200 dark:border-slate-700 shadow-md rounded-full text-[11px] font-extrabold hover:bg-gray-50 dark:hover:bg-[#334155] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center pointer-events-auto shadow-blue-500/10 shrink-0"
          >
            <span>INSURANCE</span>
          </button>
        )}
      </div>
    </div>
  )
}
