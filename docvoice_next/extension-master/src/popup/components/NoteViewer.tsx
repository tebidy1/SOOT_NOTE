import { useRef, useEffect, useCallback } from 'react'

interface NoteViewerProps {
  content: string
  onChange?: (text: string) => void
  placeholder?: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.endsWith(':')) return false
  const withoutColon = trimmed.slice(0, -1)
  const letters = withoutColon.replace(/[^A-Za-z]/g, '')
  return letters.length >= 2 && letters === letters.toUpperCase()
}

function humanizeHeader(header: string): string {
  let human = header.replace(/:$/, '').trim()

  // Exact medical field mappings (backend names → display names)
  const map: Record<string, string> = {
    'patientcomplaintstext': 'Patient Complaints',
    'patientcomplaints': 'Patient Complaints',
    'patientnotes': 'Patient Notes',
    'painscore': 'Pain Score',
    'familyeducation': 'Family Education',
    'patienthistoryofpresentilness': 'History of Present Illness',
    'patienthistoryofpresentillness': 'History of Present Illness',
    'historyofpresentillness': 'History of Present Illness',
    'patientphisicalexaminition': 'Physical Examination',
    'patientphysicalexamination': 'Physical Examination',
    'physicalexamination': 'Physical Examination',
    'vitalsinvestigation': 'Vitals & Investigation',
    'vitalsinvestigations': 'Vitals & Investigation',
    'labsinvestigation': 'Labs & Investigation',
    'labsinvestigations': 'Labs & Investigation',
    'assessmentandplan': 'Assessment & Plan',
    'assessment': 'Assessment',
    'plan': 'Plan',
    'impression': 'Impression',
    'diagnosis': 'Diagnosis',
    'differentialdiagnosis': 'Differential Diagnosis',
    'medications': 'Medications',
    'currentmedications': 'Current Medications',
    'allergies': 'Allergies',
    'pastmedicalhistory': 'Past Medical History',
    'socialhistory': 'Social History',
    'familyhistory': 'Family History',
    'reviewofsystems': 'Review of Systems',
    'chiefcomplaint': 'Chief Complaint',
    'complaints': 'Complaints',
    'procedures': 'Procedures',
    'followup': 'Follow-up',
    'disposition': 'Disposition',
    'dischargeinstructions': 'Discharge Instructions',
  }

  const key = human.toLowerCase().replace(/[\s_]/g, '')
  if (map[key]) return map[key]

  human = human.replace(/^(TXT|DLL|SYS)\s+/i, '')
  human = human.replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaces
  human = human.replace(/_/g, ' ')
  human = human.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return human
}

function contentToHTML(content: string): string {
  if (!content.trim()) return ''
  
  const lines = content.split('\n')
  const blocks: { header: string | null, lines: string[] }[] = []
  
  let currentBlock: { header: string | null, lines: string[] } = { header: null, lines: [] }
  
  for (const line of lines) {
    if (isHeaderLine(line)) {
      if (currentBlock.header !== null || currentBlock.lines.length > 0) {
        blocks.push(currentBlock)
      }
      currentBlock = { header: line, lines: [] }
    } else {
      currentBlock.lines.push(line)
    }
  }
  blocks.push(currentBlock)
  
  let html = ''
  for (const block of blocks) {
    if (!block.header && block.lines.every(l => !l.trim())) {
      html += block.lines.map(() => '<div style="min-height:1.1em"><br></div>').join('')
      continue
    }
    
    let cardInner = ''
    if (block.header) {
      const humanHeader = humanizeHeader(block.header)
      cardInner += `<div class="mb-2 flex items-center font-bold text-slate-900 dark:text-white tracking-wide text-[14px]"><span class="w-1.5 h-3.5 bg-blue-500 dark:bg-blue-400 rounded-full shrink-0 mr-2.5"></span><span contenteditable="false" class="text-slate-900 dark:text-white font-extrabold">${escapeHTML(humanHeader)}:</span></div>`
    }
    
    for (const line of block.lines) {
      if (!line.trim()) {
        continue
      }
      const escaped = escapeHTML(line)
      let withTokens = escaped.replace(
        /\[Not\s+Reported\]/gi,
        `<span class="text-gray-400 dark:text-slate-500 italic px-1 cursor-pointer text-[13px] font-medium transition-colors hover:text-gray-600 dark:hover:text-slate-300" data-token="not-reported">[No notes added]</span>`
      )
      withTokens = withTokens.replace(
        /\[\?[^\]]*\]/g,
        `<span class="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 font-semibold px-2 py-0.5 rounded-md cursor-pointer border border-amber-200 dark:border-amber-900/40 text-xs" data-token="uncertain" title="Uncertain transcription — please verify">$&</span>`
      )
      cardInner += `<div class="py-0.5 leading-[1.6] text-gray-800 dark:text-slate-200 text-[13px]">${withTokens}</div>`
    }
    
    if (block.header) {
      html += `<div class="mb-3 bg-[#F1F5F9] dark:bg-slate-800/40 rounded-xl p-3 border border-transparent dark:border-slate-600 shadow-none transition-colors hover:bg-[#E2E8F0] dark:hover:border-slate-500 group outline-none">${cardInner}</div>`
    } else {
      html += cardInner
    }
  }
  
  return html
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function NoteViewer({ content, onChange, placeholder }: NoteViewerProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const prevContentRef = useRef(content)
  const isInternalChangeRef = useRef(false)

  // Initialize on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = contentToHTML(content)
      prevContentRef.current = content
    }
  }, [])

  // Re-render when content changes from outside (not from user typing)
  useEffect(() => {
    if (
      content !== prevContentRef.current &&
      editorRef.current &&
      !isInternalChangeRef.current
    ) {
      // Save cursor position approach: since content was replaced externally, just re-render
      editorRef.current.innerHTML = contentToHTML(content)
      prevContentRef.current = content
    }
    isInternalChangeRef.current = false
  }, [content])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    isInternalChangeRef.current = true
    const text = editorRef.current.innerText ?? ''
    prevContentRef.current = text
    onChange?.(text)
  }, [onChange])

  // Click handler: auto-select word under cursor or token for fast editing
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.dataset.token === 'not-reported') {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(target)
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }

    // Do not alter selection if clicking header or non-editable elements
    if (target.getAttribute('contenteditable') === 'false' || target.closest('[contenteditable="false"]')) return

    // Auto-select full word under cursor on single click
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount || !sel.isCollapsed) return

      const anchorNode = sel.anchorNode
      if (!anchorNode || anchorNode.nodeType !== Node.TEXT_NODE) return

      const text = anchorNode.nodeValue || ''
      const offset = sel.anchorOffset

      const charAt = text[offset]
      const charBefore = offset > 0 ? text[offset - 1] : ''

      if ((charAt && !/\s/.test(charAt)) || (charBefore && !/\s/.test(charBefore))) {
        if (typeof sel.modify === 'function') {
          sel.modify('move', 'backward', 'word')
          sel.modify('extend', 'forward', 'word')
        }
      }
    }, 0)
  }, [])

  // Handle paste: strip HTML and paste as plain text
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      dir="ltr"
      onInput={handleInput}
      onClick={handleClick}
      onPaste={handlePaste}
      data-placeholder={placeholder || ''}
      className="w-full min-h-[300px] p-3 text-[14px] leading-relaxed text-gray-800 dark:text-slate-200 font-sans focus:outline-none bg-transparent"
      style={{
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: '1.65',
        caretColor: '#3b82f6',
      }}
    />
  )
}

// ─── Utility: generate rich HTML for clipboard ─────────────────────────────

export function generateClipboardHTML(plainText: string): string {
  const lines = plainText.split('\n')
  const parts: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // Blank line → spacer paragraph
      parts.push('<p style="margin:0;line-height:0.6em">&nbsp;</p>')
      continue
    }

    if (isHeaderLine(trimmed)) {
      // SOAP header → bold, underline, dark blue
      parts.push(
        `<p style="` +
          `font-family:Arial,Helvetica,sans-serif;` +
          `font-size:13pt;` +
          `font-weight:bold;` +
          `color:#1e3a8a;` +
          `border-bottom:1.5px solid #93c5fd;` +
          `padding-bottom:3px;` +
          `margin:14px 0 4px 0` +
        `">${escapeHTML(trimmed)}</p>`
      )
    } else if (trimmed.startsWith('-')) {
      // Bullet line → indented
      const content = trimmed.slice(1).trim()
      parts.push(
        `<p style="` +
          `font-family:Arial,Helvetica,sans-serif;` +
          `font-size:11.5pt;` +
          `color:#111827;` +
          `margin:3px 0 3px 16px` +
        `">&#8226; ${escapeHTML(content)}</p>`
      )
    } else {
      // Regular line
      parts.push(
        `<p style="` +
          `font-family:Arial,Helvetica,sans-serif;` +
          `font-size:11.5pt;` +
          `color:#111827;` +
          `margin:3px 0` +
        `">${escapeHTML(trimmed)}</p>`
      )
    }
  }

  return (
    `<html><head><meta charset="utf-8"></head><body>` +
    `<div style="max-width:720px;padding:16px;font-family:Arial,Helvetica,sans-serif">` +
    parts.join('') +
    `</div></body></html>`
  )
}

