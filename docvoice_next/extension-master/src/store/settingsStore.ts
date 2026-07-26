import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SpeechModelType, SpeechModelConfig } from '../types/user'

// ── Model Configurations ──
// Defines the available speech models and their OCI WebSocket parameters.
// WHISPER: Multilingual (90+ languages), no partial results
// ORACLE_MEDICAL: English-only, medical terminology optimized, partial results

export const SPEECH_MODEL_CONFIGS: Record<SpeechModelType, SpeechModelConfig> = {
  ORACLE_MEDICAL: {
    modelType: 'ORACLE',
    modelDomain: 'MEDICAL',
    languageCode: 'en-US',
    label: 'MEDICAL',
    description: '(ONLY ENGLISH)',
    icon: '🏥'
  },
  WHISPER: {
    modelType: 'WHISPER',
    modelDomain: 'GENERIC',
    languageCode: 'en',
    label: 'GENERAL',
    description: '(ARABIC+ENGLISH)',
    icon: '🌐'
  }
}

// How the backend turns a dictation into a structured note:
//  fast    — one AI call, ~3x faster, clean note (default)
//  precise — two-stage repair+format with richer prose and exhaustive
//            uncertainty marking, slower
export type ProcessingMode = 'fast' | 'precise'

export type Theme = 'light' | 'dark' | 'semi-light'

interface SettingsState {
  selectedModel: SpeechModelType
  processingMode: ProcessingMode
  theme: Theme
  customTopics: string[]
  doctorSpecialty: string
}

interface SettingsStore extends SettingsState {
  setSelectedModel: (model: SpeechModelType) => void
  getActiveModelConfig: () => SpeechModelConfig
  setProcessingMode: (mode: ProcessingMode) => void
  setTheme: (theme: Theme) => void
  setCustomTopics: (topics: string[]) => void
  setDoctorSpecialty: (specialty: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Oracle Medical is markedly more accurate for clinical dictation, so it
      // is the default. Users can still switch to Whisper for Arabic-heavy notes.
      selectedModel: 'ORACLE_MEDICAL',
      // Fast is the default: for clean dictation it is markedly quicker and the
      // note reads cleaner. Doctors can switch to Precise for messy dictation.
      processingMode: 'fast',
      theme: 'light',
      customTopics: ['PATIENT COMPLAINT', 'PAIN SCORE', 'INVESTIGATIONS', 'ASSESSMENT & PLAN'],
      doctorSpecialty: 'General Practice (GP)',

      setSelectedModel: (model) => set({ selectedModel: model }),
      setProcessingMode: (mode) => set({ processingMode: mode }),
      setTheme: (theme) => set({ theme }),
      setCustomTopics: (topics) => set({ customTopics: topics }),
      setDoctorSpecialty: (specialty) => set({ doctorSpecialty: specialty }),

      getActiveModelConfig: () => {
        return SPEECH_MODEL_CONFIGS[get().selectedModel]
      }
    }),
    {
      name: 'scribeflow-settings',
      version: 2,
      // v0 installs persisted 'WHISPER' as the old default; migrate them once to
      // Oracle Medical. (Deliberate later switches to Whisper are preserved
      // because they were saved under version 1.)
      // v2 adds processingMode; existing installs default to 'fast'.
      migrate: (persisted: any, fromVersion: number) => {
        if (fromVersion < 1 && persisted?.selectedModel === 'WHISPER') {
          persisted.selectedModel = 'ORACLE_MEDICAL'
        }
        if (!persisted.theme) {
          persisted.theme = 'light'
        }
        if (!persisted.processingMode) {
          persisted.processingMode = 'fast'
        }
        return persisted as SettingsState
      },
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        processingMode: state.processingMode,
        theme: state.theme,
        customTopics: state.customTopics,
        doctorSpecialty: state.doctorSpecialty
      })
    }
  )
)
