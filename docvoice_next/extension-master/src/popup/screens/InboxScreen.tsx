import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInboxStore } from '../../store/inboxStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ROUTES } from '../routes'
import InboxCard from '../components/InboxCard'
import BottomNav from '../components/BottomNav'
import { inboxService } from '../../services/inboxService'
import Logo from '../components/Logo'

export default function InboxScreen() {
  const navigate = useNavigate()
  const { notes, isLoading, unreadCount, selectedNoteId, pagination } = useInboxStore()
  const { theme } = useSettingsStore()
  const [filter, setFilter] = useState<'all' | 'unread' | 'completed' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showActions, setShowActions] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadInbox()
  }, [])

  const loadInbox = async (page = 1) => {
    setCurrentPage(page)
    await inboxService.pollInbox(page, 15)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.last_page)) return
    loadInbox(page)
  }

  const filteredNotes = notes.filter(note => {
    if (filter === 'unread') return note.status === 'pending'
    if (filter === 'completed') return note.status === 'completed'
    if (filter === 'pending') return note.status === 'pending'
    return true
  }).filter(note => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return note.patientName.toLowerCase().includes(q) ||
           note.rawText.toLowerCase().includes(q) ||
           (note.formattedText || '').toLowerCase().includes(q) ||
           (note.summary || '').toLowerCase().includes(q)
  })

  const handleNoteClick = (noteId: string) => {
    useInboxStore.getState().setSelectedNoteId(noteId)
    navigate(`/note/${noteId}`)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await inboxService.deleteNote(noteId)
    }
  }

  const handleRefresh = () => {
    loadInbox(currentPage)
  }

  const handleMarkAsRead = async (noteId: string) => {
    // Implementation would mark note as read
    console.log('Marking note as read:', noteId)
  }

  const handleSmartCopy = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      const copyText = note.formattedText || note.rawText || note.content
      navigator.clipboard.writeText(copyText)
    }
  }

  const handleInjectToPage = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const injectText = note.formattedText || note.rawText || note.content
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'INJECT_CONTENT', content: injectText })
        }
      })
    } else {
      navigator.clipboard.writeText(injectText || '')
    }
  }

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return 'TODAY'
    if (diffDays === 1) return 'YESTERDAY'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
  }

  // Group notes by date
  const groupedNotes: { [key: string]: typeof filteredNotes } = {}
  filteredNotes.forEach(note => {
    const groupKey = formatGroupDate(note.createdAt)
    if (!groupedNotes[groupKey]) groupedNotes[groupKey] = []
    groupedNotes[groupKey].push(note)
  })

  return (
    <div className="h-screen bg-white dark:bg-[#0F172A] pb-[60px] flex flex-col">
      {/* Sticky Header - Removed hard bottom border */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-sm flex items-center justify-between px-4 pt-4 pb-2">
        <Logo className="h-11 w-auto" variant={theme === 'dark' ? 'light' : 'dark'} />
        <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="View Archive">
          <svg className="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500 text-[15px]">All caught up!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {Object.entries(groupedNotes).map(([groupTitle, notesInGroup]) => (
              <div key={groupTitle}>
                <div className="px-1 py-2 mb-1">
                  <span className="text-blue-500 dark:text-[#38BDF8] font-bold text-[12px] tracking-[1.2px]">
                    {groupTitle}
                  </span>
                </div>
                <div>
                  {notesInGroup.map((note, index) => (
                    <InboxCard
                      key={note.id}
                      note={note}
                      noteNumber={notes.length - notes.findIndex(n => n.id === note.id)}
                      isSelected={selectedNoteId === note.id}
                      showActions={showActions === note.id}
                      onSelect={() => handleNoteClick(note.id)}
                      onToggleActions={() => setShowActions(showActions === note.id ? null : note.id)}
                      onDelete={() => handleDeleteNote(note.id)}
                      onMarkAsRead={() => handleMarkAsRead(note.id)}
                      onSmartCopy={() => handleSmartCopy(note.id)}
                      onInjectToPage={() => handleInjectToPage(note.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredNotes.length > 0 && pagination && (
          <div className="absolute bottom-[65px] right-4 bg-[#F8FAFC]/95 dark:bg-slateDark-hover/95 backdrop-blur shadow-[0_2px_12px_rgba(15,23,42,0.06)] rounded-full px-3 py-1.5 flex items-center space-x-2 z-10 border border-slate-200/80 dark:border-slateDark-divider">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slateDark-border rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[12px] font-bold text-gray-800 dark:text-slateDark-text">
              {currentPage} / {pagination.last_page}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.last_page || isLoading}
              className="p-1 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slateDark-border rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <BottomNav activeRoute="inbox" />
    </div>
  )
}