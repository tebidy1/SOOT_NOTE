interface TemplateCardProps {
  template: {
    id: string
    name: string
    description: string
    fields: string[]
    department: string
    isDefault: boolean
  }
  isSelected: boolean
  onSelect: () => void
}

export default function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const departmentColors: Record<string, string> = {
    General: 'bg-blue-100 text-blue-800',
    Pharmacy: 'bg-green-100 text-green-800',
    Laboratory: 'bg-purple-100 text-purple-800',
    Radiology: 'bg-indigo-100 text-indigo-800',
    Emergency: 'bg-red-100 text-red-800',
    Surgery: 'bg-amber-100 text-amber-800'
  }

  const departmentColor = departmentColors[template.department] || 'bg-gray-100 text-gray-800'

  return (
    <button
      onClick={onSelect}
      className={`
        relative text-left p-4 rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
          : 'border-slate-300/70 dark:border-slate-700 bg-[#F0F4F8] dark:bg-[#1E293B] hover:border-blue-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            {template.isDefault && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
        
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Fields ({template.fields.length})</span>
          <span className={`text-xs px-2 py-1 rounded-full ${departmentColor}`}>
            {template.department}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {template.fields.slice(0, 4).map((field, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200"
            >
              {field}
            </span>
          ))}
          {template.fields.length > 4 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
              +{template.fields.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~2 min processing</span>
        </div>
        
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>98% accuracy</span>
        </div>
      </div>

      {isSelected && (
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}
    </button>
  )
}