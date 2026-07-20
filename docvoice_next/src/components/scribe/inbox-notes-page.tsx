'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { InboxNote, FieldMapping, NoteOutput } from '@/app/company/inbox-notes/columns';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { inboxNoteService } from '@/lib/services/inbox-note.service';
import { showError, showSuccess } from '@/lib/notification.service';
import { useDataTable } from '@/hooks/use-data-table';
import { useCreateNoteStore } from '@/stores/create-note-store';
import { InboxCard } from '@/components/scribe/inbox-card';
import { Logo } from '@/components/scribe/logo';
import { ProcessingOverlay } from '@/components/scribe/processing-overlay';
import { generateClipboardHTML } from '@/components/scribe/note-viewer';
import NoteViewer from '@/components/scribe/note-viewer';
import { injectionService } from '@/lib/services/injection.service';

const deleteNote = async (id: string) => {
  await inboxNoteService.deleteNote(id);
};

interface MutationVariables {
  action: 'delete';
  payload: any;
}

const statusBadgeColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabelMap: Record<string, string> = {
  pending: 'قيد الانتظار',
  processed: 'قيد المعالجة',
  completed: 'مكتملة',
  archived: 'مؤرشفة',
  failed: 'فاشلة',
};

function extractFieldMappings(apiNote: any): FieldMapping[] {
  if (apiNote.field_mappings) return apiNote.field_mappings;
  if (apiNote.text_analyses && apiNote.text_analyses.length > 0) {
    const ta = apiNote.text_analyses[0];
    return ta.field_mappings || ta.analysis_data?.field_mappings || [];
  }
  return [];
}

function getAudioUrl(audioPath: string | null | undefined): string {
  if (!audioPath) return '';
  if (audioPath.startsWith('http')) return audioPath;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/api\/?$/, '');
  return `${base}/storage/${audioPath.replace(/^\//, '')}`;
}

function macroEmoji(macro: any): string {
  const emojiRegex = /^([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  const match = macro.trigger?.match(emojiRegex);
  if (match) return match[0];
  const lc = (macro.trigger || '').toLowerCase();
  if (lc.includes('insurance')) return '🛡️';
  if (lc.includes('sick leave')) return '🤒';
  if (lc.includes('free note')) return '✨';
  if (lc.includes('discharge')) return '🏥';
  return '📄';
}

function macroLabel(macro: any): string {
  return (macro.trigger || '').replace(
    /^([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u,
    '',
  ).trim();
}

export function InboxNotesPage() {
  const queryClient = useQueryClient();
  const [isViewOpen, setViewOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<InboxNote | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState('source');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMacroDropdown, setShowMacroDropdown] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'completed' | 'pending'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);
  const openCreateNote = useCreateNoteStore((s) => s.open);
  const pendingNote = useCreateNoteStore((s) => s.pendingNote);
  const setPendingNote = useCreateNoteStore((s) => s.setPendingNote);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    if (noteId) {
      const loadNote = async () => {
        try {
          const note = await inboxNoteService.getNoteById(noteId);
          setSelectedNote(note);
          setSelectedNoteId(noteId);
          setViewOpen(true);
          if (note.outputs && note.outputs.length > 0) {
            setViewTab('output-0');
          }
        } catch (e) {
          console.error('Failed to load note from URL:', e);
        }
      };
      loadNote();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const {
    currentPage,
    perPage,
    sortColumn,
    sortDirection,
    searchQuery,
    handlePageChange,
    handleSearch,
  } = useDataTable();

  const fetchData = useCallback(async () => {
    const params: any = {
      page: currentPage,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
    };
    if (searchQuery) params.search = searchQuery;
    return inboxNoteService.getNotes(params);
  }, [currentPage, perPage, sortColumn, sortDirection, searchQuery]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['inbox-notes', currentPage, perPage, sortColumn, sortDirection, searchQuery],
    queryFn: fetchData,
  });

  const { data: macrosData } = useQuery({
    queryKey: ['macros'],
    queryFn: () => inboxNoteService.getMacros(),
    enabled: isViewOpen,
  });

  const { data: noteDetail } = useQuery({
    queryKey: ['inbox-note-detail', selectedNoteId],
    queryFn: () => (selectedNoteId ? inboxNoteService.getNoteById(selectedNoteId) : null),
    enabled: isViewOpen && !!selectedNoteId,
  });

  const detailData = useMemo(() => {
    if (!noteDetail) return null;
    return {
      outputs: noteDetail.outputs || [],
      field_mappings: extractFieldMappings(noteDetail),
    };
  }, [noteDetail]);

  const macros = (macrosData as any)?.data || [];

  const notes = (response as any)?.data || [];
  const paginationMeta = (response as any)?.meta;

  const unreadCount = notes.filter((n: any) => n.status === 'pending').length;

  const filteredNotes = notes.filter((note: any) => {
    if (filter === 'unread') return note.status === 'pending';
    if (filter === 'completed') return note.status === 'completed' || note.status === 'processed';
    if (filter === 'pending') return note.status === 'pending';
    return true;
  });

  const mutation = useMutation({
    mutationFn: async (values: MutationVariables) => {
      switch (values.action) {
        case 'delete':
          return deleteNote(values.payload);
        default:
          throw new Error('Invalid action');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbox-notes'] });
      setDeleteAlertOpen(false);
      setSelectedNote(null);
      if (variables.action === 'delete') {
        showSuccess('تم حذف الملاحظة بنجاح');
      }
    },
    onError: (error: any) => {
      showError(error?.message || 'حدث خطأ أثناء تنفيذ العملية');
    },
  });

  const applyMacroMutation = useMutation({
    mutationFn: async (macroId: number) => {
      if (!selectedNote) return;
      return inboxNoteService.applyMacro(selectedNote.id, macroId);
    },
    onSuccess: (data) => {
      setSelectedNote((prev) =>
        prev && data
          ? {
              ...prev,
              outputs: data.outputs || prev.outputs,
              applied_macro_id: data.applied_macro_id || prev.applied_macro_id,
              field_mappings: extractFieldMappings(data) || prev.field_mappings,
            }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['inbox-notes'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-note-detail', selectedNoteId] });
      setIsGenerating(false);
      setShowMacroDropdown(false);
      showSuccess('تم تطبيق القالب بنجاح');
    },
    onError: (error: any) => {
      showError(error?.message || 'فشل تطبيق القالب');
      setIsGenerating(false);
    },
  });

  const handleApplyMacro = (macroId: number) => {
    setIsGenerating(true);
    setShowMacroDropdown(false);
    applyMacroMutation.mutate(macroId);
  };

  const outputs = useMemo(
    () => detailData?.outputs || selectedNote?.outputs || [],
    [detailData?.outputs, selectedNote?.outputs],
  );
  const fieldMappings = useMemo(
    () => detailData?.field_mappings || selectedNote?.field_mappings || [],
    [detailData?.field_mappings, selectedNote?.field_mappings],
  );

  const handleView = (note: InboxNote) => {
    setSelectedNote(note);
    setSelectedNoteId(String(note.id));
    setViewTab('source');
    setShowActions(null);
    setViewOpen(true);
  };

  const handleNoteCreated = (note: any) => {
    const created = note as InboxNote;
    setSelectedNote(created);
    setSelectedNoteId(created.id ? String(created.id) : null);
    setShowActions(null);
    setViewOpen(true);
    if (created.outputs && created.outputs.length > 0) {
      setViewTab('output-0');
    } else {
      setViewTab('source');
    }
  };

  useEffect(() => {
    if (pendingNote) {
      handleNoteCreated(pendingNote);
      setPendingNote(null);
    }
  }, []);

  const handleDelete = (note: InboxNote) => {
    setSelectedNote(note);
    setDeleteAlertOpen(true);
  };

  const handleSmartCopy = async (note: any) => {
    const rawContent = note.formatted_text || note.raw_text || '';
    if (!rawContent) return;
    const cleanedContent = injectionService.applySmartCopy(rawContent);
    try {
      const htmlContent = generateClipboardHTML(cleanedContent);
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([cleanedContent], { type: 'text/plain' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]);
    } catch {
      navigator.clipboard.writeText(cleanedContent);
    }
    showSuccess('تم النسخ بنجاح');
  };

  const handleCopy = async () => {
    if (!selectedNote) return;
    const sourceContent =
      viewTab === 'source'
        ? selectedNote.formatted_text || selectedNote.raw_text || ''
        : outputs.find((_: NoteOutput, i: number) => `output-${i}` === viewTab)?.content || '';
    if (!sourceContent) return;

    const cleanedContent = injectionService.applySmartCopy(sourceContent);

    try {
      const htmlContent = generateClipboardHTML(cleanedContent);
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([cleanedContent], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
      ]);
    } catch {
      navigator.clipboard.writeText(cleanedContent);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showSuccess('تم النسخ بنجاح');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox-notes'] });
  };

  const handlePageChangeLocal = (page: number) => {
    if (page < 1 || (paginationMeta && page > paginationMeta.last_page)) return;
    handlePageChange(page);
  };

  const filters = [
    { id: 'all' as const, label: 'الكل', count: notes.length },
    { id: 'unread' as const, label: 'غير مقروء', count: unreadCount },
    {
      id: 'completed' as const,
      label: 'مكتملة',
      count: notes.filter((n: any) => n.status === 'completed' || n.status === 'processed').length,
    },
    { id: 'pending' as const, label: 'معلقة', count: notes.filter((n: any) => n.status === 'pending').length },
  ];

  const isOnGeneratedTab = viewTab.startsWith('output-');

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Logo className="h-12 w-auto" variant="dark" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openCreateNote(handleNoteCreated)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-teal-600 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            ملاحظة جديدة
          </button>
          <button
            type="button"
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث في الملاحظات..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute start-3 top-3.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearch('')}
              className="absolute end-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 relative">
        <div className="relative overflow-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 pe-8">
            {filters.map((filterItem) => (
              <button
                key={filterItem.id}
                type="button"
                onClick={() => setFilter(filterItem.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                  filter === filterItem.id
                    ? 'bg-blue-600 text-white shadow-blue-100'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{filterItem.label}</span>
                {filterItem.count > 0 && (
                  <span
                    className={`ms-2 px-1.5 py-0.5 text-xs rounded-full ${
                      filter === filterItem.id ? 'bg-blue-800 text-blue-100' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {filterItem.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="absolute start-0 top-0 bottom-0 w-3 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none" />
          <div className="absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">جاري تحميل الملاحظات...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد ملاحظات</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'لا توجد ملاحظات مطابقة لبحثك' : filter !== 'all' ? `لا توجد ملاحظات ${filter}` : 'ابدأ بتسجيل ملاحظتك الأولى'}
          </p>
          {!searchQuery && filter === 'all' && (
            <button
              type="button"
              onClick={() => openCreateNote(handleNoteCreated)}
              className="bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-colors"
            >
              تسجيل ملاحظة جديدة
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note: any) => (
            <InboxCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === String(note.id)}
              showActions={showActions === String(note.id)}
              onSelect={() => handleView(note)}
              onToggleActions={() => setShowActions(showActions === String(note.id) ? null : String(note.id))}
              onDelete={() => handleDelete(note)}
              onSmartCopy={() => handleSmartCopy(note)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {paginationMeta && paginationMeta.last_page > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <button
            type="button"
            onClick={() => handlePageChangeLocal(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 inline-block rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {paginationMeta.last_page}
          </span>
          <button
            type="button"
            onClick={() => handlePageChangeLocal(currentPage + 1)}
            disabled={currentPage >= paginationMeta.last_page || isLoading}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>تتم مزامنة الملاحظات تلقائياً كل 5 دقائق</p>
      </div>

      {/* Note detail overlay (matches NoteDetailScreen) */}
      {isViewOpen && selectedNote && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {isGenerating && (
            <ProcessingOverlay
              step="جاري تطبيق القالب..."
              progress={50}
              stepsList={['جاري تحليل النص...', 'جاري تطبيق القالب...', 'جاري تنسيق المخرجات...']}
              onCancel={() => setIsGenerating(false)}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white">
            <Logo className="h-12 w-auto" variant="dark" />
            <button
              type="button"
              onClick={() => {
                setViewOpen(false);
                setShowMacroDropdown(false);
                setIsGenerating(false);
              }}
              className="flex items-center text-gray-600 hover:text-gray-900 font-semibold px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg shadow-sm text-sm transition-all"
            >
              <svg className="w-4 h-4 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              إغلاق
            </button>
          </div>

          {/* Sub-header */}
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">NO-{String(selectedNote.id).slice(-4)}</span>
                {selectedNote.patient_name && selectedNote.patient_name !== 'Untitled' && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-700 font-medium text-sm truncate">{selectedNote.patient_name}</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {new Date(selectedNote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[selectedNote.status] || statusBadgeColor.archived}`}>
                {statusLabelMap[selectedNote.status] || selectedNote.status}
              </span>

              <button
                type="button"
                onClick={() => handleDelete(selectedNote)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="حذف الملاحظة"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabbed editor */}
          <div className="flex-1 flex flex-col mt-3 min-h-0">
            <div className="flex items-center justify-between border-b border-gray-200 px-2 flex-shrink-0">
              <div className="relative flex-1 overflow-hidden">
                <div className="flex items-center overflow-x-auto min-w-0 scrollbar-hide py-1 pe-8">
                  <button
                    type="button"
                    onClick={() => setViewTab('source')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      viewTab === 'source' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    المصدر
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('field-mappings')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                      viewTab === 'field-mappings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>بيانات الحقن ({fieldMappings.length})</span>
                  </button>
                  {outputs.map((output: NoteOutput, i: number) => (
                    <div key={`output-${i}`} className="flex items-center me-1">
                      <button
                        type="button"
                        onClick={() => setViewTab(`output-${i}`)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                          viewTab === `output-${i}` ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>{output.title || `مخرج ${i + 1}`}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="absolute start-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>

              {/* Template selector dropdown */}
              <div className="relative flex-shrink-0 ms-2 py-1">
                <button
                  type="button"
                  onClick={() => setShowMacroDropdown(!showMacroDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm group"
                  title="تطبيق قالب جديد"
                >
                  <svg className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>إضافة</span>
                </button>

                {showMacroDropdown && !isGenerating && (
                  <div className="absolute end-0 top-full mt-2 w-[340px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                    <div className="bg-gray-50/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">القوالب</span>
                    </div>
                    {macros.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">لا توجد قوالب متاحة</p>
                      </div>
                    ) : (
                      <div className="max-h-[290px] overflow-y-auto p-3">
                        <div className="grid grid-cols-2 gap-2">
                          {macros.map((macro: any) => (
                            <button
                              key={macro.id}
                              type="button"
                              onClick={() => handleApplyMacro(macro.id)}
                              disabled={isGenerating}
                              className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-start text-xs font-semibold text-gray-700 hover:text-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors shadow-sm text-base">
                                {macroEmoji(macro)}
                              </div>
                              <span className="truncate flex-1 font-semibold">{macroLabel(macro)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 min-h-0 overflow-auto">
              {viewTab === 'field-mappings' ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-bold text-gray-800">بيانات الحقن</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {fieldMappings.filter((fm: FieldMapping) => fm.value != null && fm.value !== '').length}/{fieldMappings.length} حقل بقيمة
                    </span>
                  </div>
                  {fieldMappings.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                      لا توجد بيانات حقن متاحة. استخدم قالباً لإنشاء البيانات.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const nonEmpty = fieldMappings.filter((fm: FieldMapping) => fm.value != null && fm.value !== '');
                        const empty = fieldMappings.filter((fm: FieldMapping) => fm.value == null || fm.value === '');
                        return (
                          <>
                            {nonEmpty.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-500 mb-2">جاهزة للحقن</p>
                                <div className="space-y-1">
                                  {nonEmpty.map((fm: FieldMapping, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-green-50/50 border border-green-200/50 rounded-lg">
                                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{fm.form_field}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
                                        <p className="text-xs text-gray-600 mt-0.5 truncate">{fm.value}</p>
                                      </div>
                                      {fm.confidence > 0 && (
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${fm.confidence > 0.7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
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
                                {nonEmpty.length > 0 && <div className="h-4" />}
                                <p className="text-xs font-semibold text-gray-400 mb-2">حقول فارغة (تم تخطيها)</p>
                                <div className="space-y-1">
                                  {empty.map((fm: FieldMapping, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg">
                                      <svg className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-600">{fm.form_field}{fm.form_type ? ` (${fm.form_type})` : ''}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : viewTab === 'source' ? (
                <NoteViewer
                  content={selectedNote.formatted_text || selectedNote.raw_text || '—'}
                  placeholder="لا يوجد نص"
                />
              ) : (
                <NoteViewer
                  content={outputs.find((_: NoteOutput, i: number) => `output-${i}` === viewTab)?.content || ''}
                  placeholder="لا يوجد مخرجات"
                />
              )}
            </div>
          </div>

          {/* Action dock */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              disabled={viewTab === 'field-mappings'}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>نسخ ذكي</span>
                </>
              )}
            </button>
          </div>

          {/* Audio player (if available) */}
          {selectedNote.audio_path && (
            <div className="px-4 py-2 border-t border-gray-100 bg-white">
              <audio src={getAudioUrl(selectedNote.audio_path)} controls className="w-full" />
            </div>
          )}
        </div>
      )}

      <DeleteAlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={(open) => setDeleteAlertOpen(open)}
        onConfirm={() => mutation.mutate({ action: 'delete', payload: selectedNote?.id })}
        isPending={mutation.isPending}
        title="حذف الملاحظة"
        description="هل أنت متأكد من حذف هذه الملاحظة؟ هذا الإجراء لا يمكن التراجع عنه."
      />
    </div>
  );
}
