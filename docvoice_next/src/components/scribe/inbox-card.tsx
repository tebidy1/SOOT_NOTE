'use client';

interface InboxCardProps {
  note: any;
  isSelected: boolean;
  showActions: boolean;
  onSelect: () => void;
  onToggleActions: () => void;
  onDelete: () => void;
  onSmartCopy: () => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
};

const statusColorMap: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  processed: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

const statusLabelMap: Record<string, string> = {
  completed: 'مكتملة',
  processed: 'قيد المعالجة',
  pending: 'قيد الانتظار',
  failed: 'فاشلة',
  archived: 'مؤرشفة',
};

export function InboxCard({ note, isSelected, showActions, onSelect, onToggleActions, onDelete, onSmartCopy }: InboxCardProps) {
  const getStatusColor = (status: string) => statusColorMap[status] || statusColorMap.archived;

  const getPreviewText = (text: string) => {
    if (!text) return '';
    const plainText = text.replace(/\[([^\]]+)\]/g, '$1');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const displayText = note.formatted_text || note.raw_text || note.content || '';
  const displayTitle =
    note.patient_name && note.patient_name !== 'Untitled'
      ? note.patient_name
      : `ملاحظة #${note.id}`;

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed' || status === 'processed') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (status === 'pending') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'failed') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'processed') {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{displayTitle}</h3>
              {note.status === 'pending' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{getPreviewText(displayText)}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatDate(note.created_at)}</span>
              </div>

              {note.audio_path && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>صوت</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(note.status)}`}>
              <StatusIcon status={note.status} />
              <span>{statusLabelMap[note.status] || note.status}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActions();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end mt-2">
          <div className="flex items-center gap-2">
            {(note.status === 'completed' || note.status === 'processed') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSmartCopy();
                }}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                نسخ ذكي
              </button>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div
          className="absolute top-full end-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onToggleActions();
              }}
              className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              تمييز كمقروء
            </button>

            {(note.status === 'completed' || note.status === 'processed') && (
              <button
                type="button"
                onClick={() => {
                  onSmartCopy();
                  onToggleActions();
                }}
                className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                نسخ ذكي
              </button>
            )}

            <div className="border-t border-gray-200 my-1" />

            <button
              type="button"
              onClick={() => {
                onDelete();
                onToggleActions();
              }}
              className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف الملاحظة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InboxCard;
