import { useEffect, useState, useRef } from 'react'
import { useRecordingStore } from '../../store/recordingStore'
import { audioRecordingService } from '../../services/audioRecordingService'
import { ociRealtimeService } from '../../services/ociRealtimeService'
interface ListeningModeViewProps {
  onStopRecording?: () => void
  onCancel?: () => void
}

export default function ListeningModeView({ onStopRecording, onCancel }: ListeningModeViewProps) {
  const { duration, isRecording } = useRecordingStore()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const animationFrameRef = useRef<number>()
  const audioContextRef = useRef<AudioContext>()
  const analyserRef = useRef<AnalyserNode>()
  const dataArrayRef = useRef<Uint8Array>()
  const sourceRef = useRef<MediaStreamAudioSourceNode>()
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (isRecording) {
      startAudioAnalysis()
    } else {
      stopAudioAnalysis()
    }
    return () => stopAudioAnalysis()
  }, [isRecording])

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
      // Scale based on volume, similar to the requested JS snippet
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col justify-between items-center p-6 pb-8">
      {/* Top Timer - Quiet and Clean */}
      <div className="w-full text-center mt-6">
        <span className="text-gray-500 font-mono text-3xl tracking-widest font-medium">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Center Animation */}
      <div className="flex-1 flex items-center justify-center w-full my-8">
          <div ref={playerRef} className="relative flex items-center justify-center w-64 h-64 transition-transform duration-75">
            <div className="absolute inset-0 rounded-full bg-blue-100/40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full bg-blue-200/50 animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-8 rounded-full bg-blue-300/60 animate-pulse pointer-events-none" style={{ animationDuration: '1s' }} />
            <div className="relative w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
          </div>
      </div>

      {/* Bottom Buttons */}
      <div className="w-full max-w-sm flex flex-col space-y-4 mb-2">
        {/* Glow Recording Button */}
        <button
          onClick={handleStopRecording}
          disabled={isAnalyzing}
          className="w-full bg-red-500 text-white font-semibold py-4 rounded-xl hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              جاري معالجة الصوت...
            </div>
          ) : (
            <div className="flex items-center text-lg">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              إيقاف التسجيل
            </div>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isAnalyzing}
          className="w-full bg-transparent text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors duration-200 disabled:opacity-50"
        >
          إلغاء التسجيل
        </button>
      </div>
    </div>
  )
}