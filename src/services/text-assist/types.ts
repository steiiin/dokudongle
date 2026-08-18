export type TextSuggestionType = 'word' | 'phrase' | 'snippet'

export interface TextMutation {
  start: number
  end: number
  replacement: string
  cursor: number
}

export interface TextInputSnapshot {
  text: string
  selectionStart: number
  selectionEnd: number
  isComposing: boolean
}

export interface TextInputChange {
  sessionId: string
  contextId: string
  before: TextInputSnapshot
  after: TextInputSnapshot
  inputType: string
  data: string | null
}

export interface ImeDictionary {
  words?: readonly string[]
  shortcuts?: Readonly<Record<string, string>>
}

export interface TextContext {
  text: string
  cursor: number
  currentWord: string
  previousWord?: string
  sessionId: string
  contextId: string
}

export interface CorrectionCandidate {
  original: string
  replacement: string
  confidence: number
}

export interface AppliedCorrection {
  original: string
  replacement: string
  start: number
  end: number
  delimiter: string
  cursorAfterCorrection: number
  timestamp: number
  contextId: string
}

export interface RejectedCorrection {
  original: string
  suggested: string
  rejectionCount: number
}

export type UserDictionaryWordSource = 'manual' | 'learned'

export interface UserDictionaryEntry {
  word: string
  normalized: string
  source: UserDictionaryWordSource
  addedAt: number
}

export interface TextSnippet {
  id: string
  trigger: string
  label: string
  replacement: string
  keywords?: string[]
  category?: string
}

export interface BaseTextSuggestion {
  id: string
  label: string
  replacement: string
  type: TextSuggestionType
  score: number
  start: number
  end: number
}

export interface WordSuggestion extends BaseTextSuggestion {
  type: 'word'
  source: 'spelling' | 'learned' | 'medical'
}

export interface PhraseSuggestion extends BaseTextSuggestion {
  type: 'phrase'
  source: 'learned'
}

export interface SnippetSuggestion extends BaseTextSuggestion {
  type: 'snippet'
  snippetId: string
}

export type TextSuggestion = WordSuggestion | PhraseSuggestion | SnippetSuggestion

export interface WordStats {
  word: string
  count: number
  lastUsedAt: number
}

export interface BigramStats {
  previousWord: string
  word: string
  count: number
  lastUsedAt: number
}

export interface PhraseStats {
  phrase: string
  count: number
  lastUsedAt: number
}

export interface LearningScopeState {
  words: Record<string, WordStats>
  bigrams: Record<string, BigramStats>
  phrases: Record<string, PhraseStats>
}

export interface TextLearningState {
  global: LearningScopeState
  contexts: Record<string, LearningScopeState>
}

export interface TextAssistPersistedState {
  schemaVersion: 1
  userDictionary: UserDictionaryEntry[]
  rejectedCorrections: RejectedCorrection[]
  learning: TextLearningState
}

export interface TextAssistUpdate {
  mutation?: TextMutation
  suggestions: TextSuggestion[]
}
