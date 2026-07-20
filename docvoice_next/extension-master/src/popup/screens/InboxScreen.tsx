import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInboxStore } from '../../store/inboxStore'
import { ROUTES } from '../routes'
import InboxCard from '../components/InboxCard'
import BottomNav from '../components/BottomNav'
import { inboxService } from '../../services/inboxService'
import Logo from '../components/Logo'

export default function InboxScreen() {
  const navigate = useNavigate()
  const { notes, isLoading, unreadCount, selectedNoteId, pagination } = useInboxStore()
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
    if (note) {
      const injectText = note.formattedText || note.rawText || note.content
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'INJECT_CONTENT',
            content: injectText
          })
        }
      })
    }
  }

  const filters = [
    { id: 'all', label: 'All', count: notes.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'completed', label: 'Completed', count: notes.filter(n => n.status === 'completed').length },
    { id: 'pending', label: 'Pending', count: notes.filter(n => n.status === 'pending').length }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Logo className="h-12 w-auto" variant="dark" />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {unreadCount > 0 ? unreadCount : '0'}
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 relative">
          {/* Filters Wrapper with fading edge indicators */}
          <div className="relative overflow-hidden">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-1 pr-8">
              {filters.map((filterItem) => (
                <button
                  key={filterItem.id}
                  onClick={() => setFilter(filterItem.id as any)}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                    ${filter === filterItem.id
                      ? 'bg-blue-600 text-white shadow-blue-100'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-150 border border-gray-200'
                    }
                  `}
                >
                  <span>{filterItem.label}</span>
                  {filterItem.count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                      filter === filterItem.id
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filterItem.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Edge fades for modern horizontal scroll hint */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'No notes match your search'
                : filter !== 'all'
                ? `No ${filter} notes`
                : 'Start by recording your first note'}
            </p>
            {!searchQuery && filter === 'all' && (
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-colors"
              >
                Record New Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <InboxCard
                key={note.id}
                note={note}
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
        )}

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {pagination.last_page}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.last_page || isLoading}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Notes are automatically synced every 5 minutes</p>
        </div>
      </div>

      <BottomNav activeRoute="inbox" />
    </div>
  )
}