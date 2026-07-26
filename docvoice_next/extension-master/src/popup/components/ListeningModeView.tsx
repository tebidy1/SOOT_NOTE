import { useEffect, useState, useRef } from 'react'
import { useRecordingStore } from '../../store/recordingStore'
import { useSettingsStore } from '../../store/settingsStore'
import { audioRecordingService } from '../../services/audioRecordingService'
import { ociRealtimeService } from '../../services/ociRealtimeService'

interface ListeningModeViewProps {
  onStopRecording?: () => void
  onCancel?: () => void
}

export default function ListeningModeView({ onStopRecording, onCancel }: ListeningModeViewProps) {
  const { duration, isRecording, realtimeStatus } = useRecordingStore()
  const { customTopics } = useSettingsStore()

  // Live transcription is the only source of the note's text (there is no batch
  // fallback wired). If Oracle's realtime stream drops — WebSocket or auth
  // failure sets status to 'unavailable'/'error' — the mic keeps recording but
  // nothing is being transcribed. Warn the doctor at once so they don't dictate
  // a whole encounter into a void and discover the empty note only afterwards.
  const transcriptionFailed = realtimeStatus === 'unavailable' || realtimeStatus === 'error'
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const animationFrameRef = useRef<number>()
  const audioContextRef = useRef<AudioContext>()
  const analyserRef = useRef<AnalyserNode>()
  const dataArrayRef = useRef<Uint8Array>()
  const sourceRef = useRef<MediaStreamAudioSourceNode>()
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (isRecording && !isPaused) {
      startAudioAnalysis()
    } else {
      stopAudioAnalysis()
    }
    return () => stopAudioAnalysis()
  }, [isRecording, isPaused])

  const startAudioAnalysis = async () => {
    try {
      const stream = audioRecordingService.getStream()
      if (!stream) {
        console.error('No active stream from audioRecordingService')
        return
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = dataArray
      sourceRef.current = source
      
      animateAudioAnalysis()
    } catch (error) {
      console.error('Failed to start audio analysis:', error)
    }
  }

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (sourceRef.current) sourceRef.current.disconnect()
    if (audioContextRef.current) audioContextRef.current.close()
  }

  const animateAudioAnalysis = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    let sum = 0;
    const bufferLength = dataArrayRef.current.length;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArrayRef.current[i];
    }
    const averageVolume = sum / bufferLength;

    if (playerRef.current) {
      // Scale based on volume
      const scale = 1 + (averageVolume / 100);
      try {
        if (playerRef.current.style) {
          playerRef.current.style.transform = `scale(${scale})`;
          playerRef.current.style.transition = "transform 0.05s ease-out";
        }
      } catch(e) {}
    }
    
    animationFrameRef.current = requestAnimationFrame(animateAudioAnalysis)
  }

  const handleStopRecording = async () => {
    setIsAnalyzing(true)
    try {
      ociRealtimeService.requestFinalResult()
      await new Promise(resolve => setTimeout(resolve, 1500))
      await audioRecordingService.stopRecording()
    } catch (error: any) {
      if (error?.message !== 'No active recording') {
        console.error('Failed to stop recording:', error)
      }
    } finally {
      setIsAnalyzing(false)
      if (onStopRecording) onStopRecording()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bottom-14 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md z-40 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      {/* Top Bar with Cancel Button */}
      <div className="w-full flex justify-end p-4">
        <button
          onClick={onCancel}
          disabled={isAnalyzing}
          className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full transition-colors disabled:opacity-50"
          aria-label="Cancel recording"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Live-transcription failure banner — only shown if the realtime stream drops */}
      {transcriptionFailed && (
        <div className="mx-6 mb-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Live transcription interrupted</p>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5">
              The connection to the transcription service dropped, so speech is no longer being captured. Please stop, check your connection, and record again.
            </p>
          </div>
        </div>
      )}

      {/* Top Half: Topics Board */}
      <div className="flex-1 px-6 pt-2 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Topics to cover
          </h3>
          
          {customTopics.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No topics defined. You can add them in the settings menu to serve as a reminder while dictating.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customTopics.map((topic, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-xl p-4 flex items-center transition-all duration-300"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-800 dark:text-slate-200 font-medium text-sm">
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Half: Recording Circle & Controls */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-t from-gray-50 to-transparent dark:from-slate-900 dark:to-transparent relative pb-12">
        {/* Timer */}
        <div className="absolute top-0 w-full text-center">
          <span className="text-gray-500 dark:text-gray-400 font-mono text-4xl tracking-widest font-medium">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Center Animation and Controls */}
        <div className="relative flex items-center justify-center w-72 h-72 mt-12">
          
          {/* Main Recording Visualizer (Center) */}
          <div className="relative flex items-center justify-center w-36 h-36 z-10">
            {!isPaused && (
              <>
                <div className="absolute inset-[-15%] rounded-full bg-blue-400/20 dark:bg-blue-500/10 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-[-5%] rounded-full bg-blue-400/30 dark:bg-blue-500/20 animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-[5%] rounded-full bg-blue-400/40 dark:bg-blue-500/30 animate-pulse pointer-events-none" style={{ animationDuration: '1s' }} />
              </>
            )}
            
            <div
              ref={playerRef}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-colors duration-300 z-10
                ${isPaused ? 'bg-amber-500 shadow-amber-500/50' : 'bg-blue-600'}
              `}
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
          </div>

          {/* Pause Button (Bottom Left) */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={isAnalyzing}
            className={`absolute bottom-6 left-6 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 z-20 border-2 hover:scale-105 active:scale-95
              ${isPaused 
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-[0_4px_12px_rgba(245,158,11,0.2)]' 
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)]'}
            `}
            aria-label="Pause recording"
          >
            {isPaused ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            )}
          </button>

          {/* Cancel Button (Bottom Right) */}
          <button
            onClick={onCancel}
            disabled={isAnalyzing}
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 z-20 border-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/30 hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(244,63,94,0.15)] disabled:opacity-50"
            aria-label="Cancel recording"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isAnalyzing && (
          <p className="absolute bottom-8 text-sm text-gray-500 font-medium">
            Processing audio...
          </p>
        )}
      </div>
    </div>
  )
}