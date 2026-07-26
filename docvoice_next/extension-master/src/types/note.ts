export interface NoteOutput {
  id: number
  inbox_note_id: number
  macro_id: number
  title: string
  content?: string
}

export interface SuggestedMacro {
  id: number
  user_id: number
  company_id: number
  trigger: string
  category: string
  content: string
  is_ai_macro: boolean
  is_favorite?: boolean
  ai_instruction?: string | null
  usage_count: number
  last_used?: string | null
  created_at: string
  updated_at: string
}

export interface NoteCompany {
  id: number
  name: string
  domain?: string | null
  invitation_code?: string
}

export interface NoteUser {
  id: number
  name: string
  email: string
  company_id: number
  email_verified_at?: string | null
  profile_image_url?: string | null
}

export type NoteStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type DisplayStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'COPIED' | 'FAILED'

export function toDisplayStatus(status: NoteStatus, isCopied = false): DisplayStatus {
  switch (status) {
    case 'pending': return 'DRAFT'
    case 'processing': return 'PROCESSING'
    case 'completed': return isCopied ? 'COPIED' : 'READY'
    case 'failed': return 'FAILED'
  }
}

export function displayStatusColor(display: DisplayStatus): string {
  switch (display) {
    case 'DRAFT': return 'bg-amber-100 text-amber-800'
    case 'PROCESSING': return 'bg-blue-100 text-blue-800'
    case 'READY': return 'bg-green-100 text-green-800'
    case 'COPIED': return 'bg-indigo-100 text-indigo-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
  }
}

export interface FieldMapping {
  form_field: string
  form_type: string
  value: string | null
  matched_key: string | null
  confidence: number
}

// Generation-time advisories from the backend's deterministic numeric check
// and the AI's own low-confidence repair flags.
export interface NoteReview {
  passed: boolean
  missing_numbers: string[]
  suspicious_ranges: string[]
  // Uppercase acronyms (BNP, CBC...) in the note but absent from the raw ASR.
  unverified_entities?: string[]
  // Long lowercase clinical terms (procalcitonin, albuterol...) in critical
  // fields that lack any exact / stem / phonetic match in the raw ASR.
  unverified_terms?: string[]
  // Polarity reversals: anchor terms whose negation state in the note
  // disagrees with the raw ASR (e.g. doctor said "denies chest pain",
  // note asserts "chest pain present"). Format: "term (field: direction)".
  polarity_flags?: string[]
  unverified?: boolean
}

export interface AiFlag {
  original: string
  repaired: string
  confidence: 'high' | 'low'
  reason: string
}

export interface Note {
  id: string
  uuid: string | null
  userId: string
  companyId: number
  title: string
  content: string
  rawText: string
  originalText?: string | null
  formattedText?: string | null
  patientName: string
  summary?: string | null
  audioPath?: string | null
  status: NoteStatus
  appliedMacroId?: number | null
  suggestedMacroId?: number | null
  suggestedMacro?: SuggestedMacro | null
  outputs: NoteOutput[]
  fieldMappings?: FieldMapping[]
  review?: NoteReview | null
  // Deterministic verification of the injection data (field_mappings) against
  // the raw ASR — shown on the injection-preview tab, separate from `review`.
  fieldReview?: NoteReview | null
  aiFlags?: AiFlag[]
  company?: NoteCompany
  user?: NoteUser
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  fields: TemplateField[]
  department: string
  isDefault: boolean
}

export interface TemplateField {
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  label: string
  placeholder?: string
  required: boolean
  mappingPatterns?: string[]
}

export interface CreateNoteData {
  raw_text: string
  formatted_text?: string
  doctor_specialty?: string
  patient_name?: string
  summary?: string | null
  audio_path?: string
  generated_outputs?: Array<{
    macro_id: number
    title: string
    content: string
  }>
}

export interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number
  to: number
}

export interface InboxState {
  notes: Note[]
  unreadCount: number
  isLoading: boolean
  selectedNoteId: string | null
  pagination: PaginationMeta | null
}