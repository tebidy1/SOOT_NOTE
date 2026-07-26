import React, { useEffect, useState } from 'react'
import { apiClient } from '../../services/apiClient'
import { inboxService } from '../../services/inboxService'

interface TemplateSelectionSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
}

export default function TemplateSelectionSheet({ isOpen, onClose, onSelectTemplate }: TemplateSelectionSheetProps) {
  const [macros, setMacros] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadMacros()
    } else {
      // Reset loading state when closed so it animates nicely next time
      setIsLoading(true)
    }
  }, [isOpen])

  const loadMacros = async () => {
    setIsLoading(true)
    try {
      const fetchedMacros = await inboxService.fetchMacros()
      // Map to the format expected by the sheet
      const formatted = fetchedMacros.map(m => ({
        id: m.id,
        name: m.trigger,
        icon: m.category?.toLowerCase().includes('insurance') ? '🛡️' : (m.trigger.includes('ER') ? '🚨' : '✨')
      }))
      setMacros(formatted)
    } catch (error) {
      console.error('Failed to load macros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-[#F0F4F8] dark:bg-[#1E293B] border-t border-slate-300/70 dark:border-slate-800 rounded-t-3xl shadow-2xl p-6 animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">Select Note Template</h3>
        
        <div className="flex flex-wrap gap-3 justify-center max-h-[50vh] overflow-y-auto pb-4 custom-scrollbar">
          {isLoading ? (
            // Skeleton Loader
            Array.from({ length: 5 }).map((_, idx) => (
              <div 
                key={idx}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full animate-pulse"
                style={{ width: `${Math.random() * 40 + 100}px`, height: '42px' }}
              >
                <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))
          ) : macros.length === 0 ? (
            <div className="w-full text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              No templates available.
            </div>
          ) : (
            macros.map((macro, idx) => (
              <button
                key={macro.id || idx}
                onClick={() => onSelectTemplate(macro)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#F0F4F8] dark:bg-[#0F172A] border border-slate-300/70 dark:border-slate-700 rounded-full shadow-sm hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 active:scale-95"
              >
                <span className="text-lg">{macro.icon || '✨'}</span>
                <span className="font-medium text-gray-700">{macro.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
