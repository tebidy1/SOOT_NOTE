import { useState } from 'react'
import { Note } from '../../types/note'

interface InboxCardProps {
  note: Note
  noteNumber?: number
  isSelected: boolean
  showActions: boolean
  onSelect: () => void
  onToggleActions: () => void
  onDelete: () => void
  onMarkAsRead: () => void
  onSmartCopy: () => void
  onInjectToPage: () => void
}

import { useInboxStore } from '../../store/inboxStore'

export default function InboxCard({
  note,
  noteNumber = 0,
  onSelect,
  onSmartCopy,
  onInjectToPage
}: InboxCardProps) {
  const isDraft = note.status === 'pending'
  const { interactedNotes, setNoteInteraction } = useInboxStore()
  
  // Use global interacted state, default to none
  const actionTaken = interactedNotes[note.id] || 'none'


  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 
    const strMinutes = minutes < 10 ? '0' + minutes : minutes
    return `${hours}:${strMinutes} ${ampm}`
  }

  const isInteracted = actionTaken === 'copied' || actionTaken === 'injected'
  const isFailed = note.status === 'failed'

  const getStatusIcon = () => {
    if (isInteracted || note.status === 'completed') {
      return (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  }

  const getBadgeLabel = () => {
    if (actionTaken === 'copied') return 'COPIED'
    if (actionTaken === 'injected') return 'INJECTED'
    if (isFailed) return 'FAILED'
    return 'WAITING'
  }

  const displayText = note.formattedText || note.rawText || note.content || ''
  const displayTitle = noteNumber > 0 ? `NO-${noteNumber}` : 'Draft Note'

  return (
    <div 
      onClick={onSelect}
      className={`mb-3 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg cursor-pointer overflow-hidden flex shadow-none border border-transparent dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#283548] transition-all`}
    >
      {/* Side Color Bar */}
      <div className={`w-1 shrink-0 ${
        isFailed ? 'bg-red-500' : isInteracted ? 'bg-blue-400/40 dark:bg-blue-500/30' : 'bg-blue-500'
      }`}></div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-3 min-w-0">
        
        {/* Row 1: Icon, Title, Action */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isFailed
                ? 'bg-red-500/20 text-red-500'
                : isInteracted
                ? 'bg-blue-500/10 text-blue-500/60 dark:bg-blue-500/15 dark:text-blue-400/60'
                : 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
            }`}>
              {getStatusIcon()}
            </div>
            <span className={`text-[16px] ${isDraft ? 'font-medium italic text-gray-700 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-slateDark-text'}`}>
              {displayTitle}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Inject Button */}
            {!isDraft && note.status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNoteInteraction(note.id, 'injected')
                  if (onInjectToPage) onInjectToPage()
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  actionTaken === 'injected'
                    ? 'bg-blue-100/70 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
                }`} title="Inject to Page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isDraft) {
                  setNoteInteraction(note.id, 'copied')
                  onSmartCopy()
                }
              }}
              disabled={isDraft}
              className={`p-1.5 rounded-lg transition-colors ${
                actionTaken === 'copied'
                  ? 'bg-blue-100/70 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
              }`} title={isDraft ? "Select a template first" : "Copy to Clipboard"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Preview Text */}
        <div className="mb-3">
          <p className={`text-[14px] leading-[1.4] line-clamp-2 transition-all duration-300 ${
            isInteracted
              ? 'text-gray-500 dark:text-[#64748B] font-normal' // Matte
              : 'text-gray-800 dark:text-gray-200 font-normal' // Matches NoteViewer (clear, normal weight)
          }`}>
            {displayText}
          </p>
        </div>

        {/* Row 3: Time & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isFailed
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isInteracted
                ? 'bg-blue-100/40 text-blue-600/75 dark:bg-blue-900/20 dark:text-blue-400/60'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {getBadgeLabel()}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {formatTime(note.createdAt)}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}