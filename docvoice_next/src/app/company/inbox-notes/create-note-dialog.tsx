'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, AudioLines } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { audioRecordingService } from '@/lib/services/audio-recording.service';
import { ociRealtimeService } from '@/lib/services/oci-realtime.service';
import { transcriptionService } from '@/lib/services/transcription.service';
import { useRecordingStore } from '@/stores/recording-store';
import { inboxNoteService } from '@/lib/services/inbox-note.service';
import { showError } from '@/lib/notification.service';
import { Logo } from '@/components/scribe/logo';
import { AnimatedRecordButton } from '@/components/scribe/animated-record-button';
import { ProcessingOverlay } from '@/components/scribe/processing-overlay';
import NoteViewer from '@/components/scribe/note-viewer';

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated?: (note: any) => void;
}

type Phase = 'idle' | 'recording' | 'macro-select' | 'processing';

interface Macro {
  id: number;
  trigger: string;
  category: string;
  icon?: string;
}

function macroEmoji(macro: Macro): string {
  const emojiRegex = /^([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  const match = macro.trigger.match(emojiRegex);
  if (match) return match[0];
  const lc = macro.trigger.toLowerCase();
  if (lc.includes('insurance')) return '🛡️';
  if (lc.includes('sick leave')) return '🤒';
  if (lc.includes('free note')) return '✨';
  if (lc.includes('discharge')) return '🏥';
  return '📄';
}

function macroLabel(macro: Macro): string {
  return macro.trigger
    .replace(/^([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u, '')
    .trim();
}

export function CreateNoteDialog({ open, onOpenChange, onNoteCreated }: CreateNoteDialogProps) {
  const queryClient = useQueryClient();

  const isStarting = useRecordingStore((s) => s.isStarting);
  const duration = useRecordingStore((s) => s.duration);
  const error = useRecordingStore((s) => s.error);
  const realtimeStatus = useRecordingStore((s) => s.realtimeStatus);

  const [phase, setPhase] = useState<Phase>('idle');
  const [patientName, setPatientName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingSteps = ['جاري معالجة الصوت...', 'جاري التفريغ الصوتي...', 'جاري تطبيق القالب...', 'جاري تنسيق المخرجات...', 'جاري حفظ الملاحظة...'];

  const playerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const { data: macrosData } = useQuery({
    queryKey: ['macros'],
    queryFn: () => inboxNoteService.getMacros({}),
    enabled: phase === 'macro-select',
    staleTime: 60_000,
  });
  const macros: Macro[] = (macrosData as any)?.data || [];

  const saveMutation = useMutation({
    mutationFn: async ({ raw_text, macroId }: { raw_text: string; macroId: number | null }) => {
      const saveResp = await inboxNoteService.createNote({
        raw_text,
        patient_name: patientName.trim() || 'Untitled',
        summary: null,
      });
      const saved = (saveResp as any)?.payload || (saveResp as any)?.data || saveResp;

      if (!saved?.id) throw new Error('فشل إنشاء الملاحظة');

      if (macroId != null) {
        setProcessingStep('جاري تطبيق القالب...');
        setProcessingProgress(85);
        const macroResp = await inboxNoteService.applyMacro(saved.id, macroId);
        const applied = (macroResp as any)?.payload || (macroResp as any)?.data || macroResp;
        return applied || saved;
      }

      return saved;
    },
    onSuccess: (note) => {
      const noteId = note?.id || (note as any)?.payload?.id;
      setProcessingStep('جاري الإنهاء...');
      setProcessingProgress(100);
      queryClient.invalidateQueries({ queryKey: ['inbox-notes'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-notes-recent'] });
      audioRecordingService.clearRecording();
      setTimeout(() => {
        clearProcessing();
        setPhase('idle');
        onOpenChange(false);
        if (noteId) {
          if (onNoteCreated) {
            onNoteCreated(note);
          } else {
            window.location.href = `/company/inbox-notes?noteId=${noteId}`;
          }
        } else {
          onNoteCreated?.(note);
        }
      }, 1200);
    },
    onError: (err: any) => {
      setSaveError(err?.message || 'فشل إنشاء الملاحظة');
      clearProcessing();
      setPhase('idle');
    },
  });

  useEffect(() => {
    if (open) {
      audioRecordingService.clearRecording();
      setPhase('idle');
      setPatientName('');
      setSaveError(null);
    }
  }, [open]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  useEffect(() => {
    if (phase !== 'recording') {
      stopAudioAnalysis();
      return;
    }
    startAudioAnalysis();
    return () => stopAudioAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function startAudioAnalysis() {
    const stream = audioRecordingService.getStream();
    if (!stream) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceNodeRef.current = source;
      animateFrame();
    } catch {}
  }

  function animateFrame() {
    if (!analyserRef.current || !dataArrayRef.current) return;
    const d = dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>;
    analyserRef.current.getByteFrequencyData(d);
    let sum = 0;
    for (let i = 0; i < d.length; i++) sum += d[i];
    const avg = sum / d.length;
    if (playerRef.current) {
      const scale = 1 + avg / 100;
      playerRef.current.style.transform = `scale(${scale})`;
    }
    animFrameRef.current = requestAnimationFrame(animateFrame);
  }

  function stopAudioAnalysis() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    sourceNodeRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    sourceNodeRef.current = null;
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      transcriptionService.cancel();
      audioRecordingService.clearRecording();
    }
    onOpenChange(next);
  };

  const handleStart = async () => {
    setSaveError(null);
    try {
      await audioRecordingService.startRecording();
      setPhase('recording');
    } catch {}
  };

  const handleCancelRecording = () => {
    audioRecordingService.clearRecording();
    setPhase('idle');
  };

  const handleStop = async () => {
    try {
      await ociRealtimeService.stopAndWait(3000);
    } catch (e) {
      console.error('stopAndWait failed:', e);
    }

    try {
      await audioRecordingService.stopRecording();
    } catch (e: any) {
      if (e?.message !== 'No active recording') console.error(e);
    }

    setPhase('macro-select');
  };

  const clearProcessing = () => {
    setProcessingStep('');
    setProcessingProgress(0);
  };

  const handleMacroSelect = async (macroId: number | null) => {
    setPhase('processing');
    setProcessingStep('جاري معالجة الصوت...');
    setProcessingProgress(10);

    const store = useRecordingStore.getState();
    let transcriptText = store.finalTranscript || store.realtimeTranscript;

    if (!transcriptText && store.audioBlob) {
      try {
        setProcessingStep('جاري التفريغ الصوتي...');
        setProcessingProgress(30);
        transcriptText = await transcriptionService.transcribeOracle(
          store.audioBlob,
          'en',
          'WHISPER_LARGE_V3T',
          (status) => {
            const step = `جاري التفريغ: ${status}`;
            setProcessingStep(step);
            setProcessingProgress(status === 'processing' ? 50 : 35);
          },
        );
      } catch (e: any) {
        console.error('Batch transcription failed:', e);
        setSaveError('فشل التفريغ الصوتي');
        setPhase('idle');
        clearProcessing();
        return;
      }
    }

    if (!transcriptText?.trim()) {
      setSaveError('لا يوجد نص لإنشاء الملاحظة');
      setPhase('idle');
      clearProcessing();
      return;
    }

    setProcessingStep('جاري حفظ الملاحظة...');
    setProcessingProgress(75);
    saveMutation.mutate({ raw_text: transcriptText, macroId });
  };

  const realtimeStatusLabel: Record<typeof realtimeStatus, string> = {
    idle: '',
    connecting: 'جاري الاتصال بخدمة التفريغ...',
    authenticated: 'التفريغ الفوري نشط',
    error: 'تعذّر التفريغ الفوري',
    unavailable: 'التفريغ الفوري غير متاح — سيتم استخدام التفريغ الدفعي',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* ═══ PHASE: IDLE ═══ */}
      {phase === 'idle' && (
        <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
          <header className="flex items-center justify-between p-6 flex-shrink-0">
            <Logo className="h-10 w-auto" variant="dark" />
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 overflow-y-auto">
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {isStarting ? 'جاري التجهيز...' : 'اضغط لبدء التسجيل'}
              </p>
              <p className="text-sm text-gray-600 mt-1">سيتم تفريغ الصوت إلى نص فورياً أثناء التسجيل</p>
            </div>

            <div className="flex justify-center">
              {isStarting ? (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                </div>
              ) : (
                <AnimatedRecordButton isRecording={false} onClick={handleStart} size="large" />
              )}
            </div>

            <div className="w-full max-w-sm space-y-2">
              <Label htmlFor="patient_name">اسم المريض (اختياري)</Label>
              <Input
                id="patient_name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="أدخل اسم المريض"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ PHASE: RECORDING ═══ */}
      {phase === 'recording' && (
        <div className="flex flex-col h-full bg-white justify-between items-center p-6 pb-8">
          <div className="w-full text-center mt-6">
            <span className="text-gray-500 font-mono text-3xl tracking-widest font-medium">
              {audioRecordingService.formatDuration(duration)}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center w-full my-8">
            <div ref={playerRef} className="relative flex items-center justify-center w-64 h-64 transition-transform duration-75">
              <div className="absolute inset-0 rounded-full bg-blue-100/40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-4 rounded-full bg-blue-200/50 animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-8 rounded-full bg-blue-300/60 animate-pulse pointer-events-none" style={{ animationDuration: '1s' }} />
              <div className="relative w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              {realtimeStatus === 'authenticated' ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <AudioLines className="h-4 w-4" />
                  {realtimeStatusLabel[realtimeStatus]}
                </span>
              ) : realtimeStatus === 'unavailable' || realtimeStatus === 'error' ? (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {realtimeStatusLabel[realtimeStatus]}
                </span>
              ) : realtimeStatus === 'connecting' ? (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {realtimeStatusLabel[realtimeStatus]}
                </span>
              ) : (
                <span className="text-gray-500">جاري التسجيل...</span>
              )}
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col gap-3 mb-2 mt-4">
            <button
              type="button"
              onClick={handleStop}
              className="w-full bg-red-500 text-white font-semibold py-4 rounded-xl hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-lg">إيقاف التسجيل</span>
            </button>
            <button
              type="button"
              onClick={handleCancelRecording}
              className="w-full bg-transparent text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            >
              إلغاء التسجيل
            </button>
          </div>
        </div>
      )}

      {/* ═══ PHASE: MACRO-SELECT (bottom sheet) ═══ */}
      {phase === 'macro-select' && (
        <div className="flex flex-col h-full justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleOpenChange(false)} />

          <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">اختر قالب الملاحظة</h3>

            {macros.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">جاري تحميل القوالب...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center max-h-[50vh] overflow-y-auto pb-4">
                {macros.map((macro) => (
                  <button
                    key={macro.id}
                    type="button"
                    onClick={() => handleMacroSelect(macro.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 active:scale-95"
                  >
                    <span className="text-lg">{macroEmoji(macro)}</span>
                    <span className="font-medium text-gray-700 text-sm">{macroLabel(macro)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => handleMacroSelect(null)}
                className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                حفظ بدون قالب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PHASE: PROCESSING ═══ */}
      {phase === 'processing' && (
        <ProcessingOverlay
          step={processingStep}
          progress={processingProgress}
          stepsList={processingSteps}
        />
      )}

    </div>
  );
}
