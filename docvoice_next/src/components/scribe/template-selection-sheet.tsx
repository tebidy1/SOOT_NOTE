'use client'

import { useEffect, useState } from 'react'
import { templateService } from '@/lib/services/template.service'

interface TemplateSelectionSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
}

function macroEmoji(macro: any): string {
  const lc = (macro.trigger || '').toLowerCase()
  if (lc.includes('insurance')) return '🛡️'
  if (lc.includes('sick leave')) return '🤒'
  if (lc.includes('free note')) return '✨'
  if (lc.includes('discharge')) return '🏥'
  if (lc.includes('er') || lc.includes('emergency')) return '🚨'
  return '📄'
}

export function TemplateSelectionSheet({ isOpen, onClose, onSelectTemplate }: TemplateSelectionSheetProps) {
  const [macros, setMacros] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      loadMacros()
    }
  }, [isOpen])

  const loadMacros = async () => {
    try {
      const response = await templateService.getTemplates()
      const list = (response as any)?.data || []
      setMacros(list)
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
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">اختر قالب الملاحظة</h3>

        <div className="flex flex-wrap gap-3 justify-center max-h-[50vh] overflow-y-auto pb-4">
          {macros.length === 0 && (
            <p className="text-sm text-gray-500 py-4">لا توجد قوالب متاحة</p>
          )}
          {macros.map((macro, idx) => (
            <button
              key={macro.id || idx}
              type="button"
              onClick={() => onSelectTemplate(macro)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 active:scale-95"
            >
              <span className="text-lg">{macroEmoji(macro)}</span>
              <span className="font-medium text-gray-700">{macro.trigger || macro.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemplateSelectionSheet
