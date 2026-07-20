import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SpeechModelType, SpeechModelConfig } from '../types/user'

// ── Model Configurations ──
// Defines the available speech models and their OCI WebSocket parameters.
// WHISPER: Multilingual (90+ languages), no partial results
// ORACLE_MEDICAL: English-only, medical terminology optimized, partial results

export const SPEECH_MODEL_CONFIGS: Record<SpeechModelType, SpeechModelConfig> = {
  WHISPER: {
    modelType: 'WHISPER',
    modelDomain: 'GENERIC',
    languageCode: 'en',
    label: 'Whisper Multilingual',
    description: '90+ languages • Arabic supported',
    icon: '🌐'
  },
  ORACLE_MEDICAL: {
    modelType: 'ORACLE',
    modelDomain: 'MEDICAL',
    languageCode: 'en-US',
    label: 'Oracle Medical',
    description: 'English only • Clinical accuracy',
    icon: '🏥'
  }
}

interface SettingsState {
  selectedModel: SpeechModelType
}

interface SettingsStore extends SettingsState {
  setSelectedModel: (model: SpeechModelType) => void
  getActiveModelConfig: () => SpeechModelConfig
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Oracle Medical is markedly more accurate for clinical dictation, so it
      // is the default. Users can still switch to Whisper for Arabic-heavy notes.
      selectedModel: 'ORACLE_MEDICAL',

      setSelectedModel: (model) => set({ selectedModel: model }),

      getActiveModelConfig: () => {
        return SPEECH_MODEL_CONFIGS[get().selectedModel]
      }
    }),
    {
      name: 'scribeflow-settings',
      version: 1,
      // v0 installs persisted 'WHISPER' as the old default; migrate them once to
      // Oracle Medical. (Deliberate later switches to Whisper are preserved
      // because they were saved under version 1.)
      migrate: (persisted: any, fromVersion: number) => {
        if (fromVersion < 1 && persisted?.selectedModel === 'WHISPER') {
          persisted.selectedModel = 'ORACLE_MEDICAL'
        }
        return persisted as SettingsState
      },
      partialize: (state) => ({
        selectedModel: state.selectedModel
      })
    }
  )
)
