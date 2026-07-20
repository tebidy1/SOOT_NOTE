import React, { useEffect, useState } from 'react'
import { apiClient } from '../../services/apiClient'

interface TemplateSelectionSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
}

export default function TemplateSelectionSheet({ isOpen, onClose, onSelectTemplate }: TemplateSelectionSheetProps) {
  const [macros, setMacros] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      loadMacros()
    }
  }, [isOpen])

  const loadMacros = async () => {
    try {
      const { inboxService } = await import('../../services/inboxService')
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
      <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Select Note Template</h3>
        
        <div className="flex flex-wrap gap-3 justify-center max-h-[50vh] overflow-y-auto pb-4">
          {macros.map((macro, idx) => (
            <button
              key={macro.id || idx}
              onClick={() => onSelectTemplate(macro)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 active:scale-95"
            >
              <span className="text-lg">{macro.icon || '✨'}</span>
              <span className="font-medium text-gray-700">{macro.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
