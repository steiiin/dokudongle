import medicalWords from '@/assets/dictionaries/medical-de.json'
import type { CorrectionPolicy } from './CorrectionPolicy'
import { ConservativeCorrectionPolicy } from './CorrectionPolicy'
import type { GermanSpellChecker } from './GermanSpellChecker'
import { DefaultGermanSpellChecker } from './GermanSpellChecker'
import type {
  AppliedCorrection,
  CorrectionCandidate,
  TextInputChange,
  TextInputSnapshot,
  TextMutation,
} from './types'
import type { TextAssistStateRepositoryLike } from './persistence'
import { isCompletionDelimiter, normalizeDictionaryWord, normalizeKey, wordImmediatelyBefore } from './text'

const preserveInitialCapitalization = (original: string, replacement: string): string => {
  if (!/^\p{Lu}/u.test(original) || !/^\p{Ll}/u.test(replacement)) return replacement
  return replacement[0].toLocaleUpperCase('de-DE') + replacement.slice(1)
}

export class AutocorrectService {
  private initialization?: Promise<void>
  private readonly lastCorrections = new Map<string, AppliedCorrection>()
  private readonly medicalKeys = new Set(medicalWords.map(normalizeKey))

  constructor(
    private readonly repository: TextAssistStateRepositoryLike,
    private readonly policy: CorrectionPolicy = new ConservativeCorrectionPolicy(),
    private readonly spell: GermanSpellChecker = new DefaultGermanSpellChecker(),
  ) {}

  initialize(): Promise<void> {
    if (!this.initialization) {
      this.initialization = this.repository.initialize().then(state => {
        const additionalWords = [
          ...medicalWords,
          ...state.userDictionary.map(entry => entry.word),
        ]
        return this.spell.initialize(additionalWords)
      })
    }
    return this.initialization
  }

  getMedicalWords(): string[] {
    return [...medicalWords]
  }

  isMedicalWord(word: string): boolean {
    return this.medicalKeys.has(normalizeKey(word))
  }

  async isCorrect(word: string): Promise<boolean> {
    await this.initialize()
    return this.spell.correct(word)
  }

  async getSpellingCandidates(word: string, limit = 5): Promise<CorrectionCandidate[]> {
    await this.initialize()
    if (!word || await this.spell.correct(word)) return []
    const suggestions = await this.spell.suggest(word)
    return suggestions.slice(0, limit).map(replacement => ({
      original: word,
      replacement: preserveInitialCapitalization(word, replacement),
      confidence: 1 - Math.min(1, Math.max(0, Math.abs(word.length - replacement.length)) / Math.max(1, word.length)),
    }))
  }

  async addUserWord(word: string): Promise<void> {
    await this.initialize()
    await this.spell.addWord(word)
  }

  async rebuildUserWords(): Promise<void> {
    await this.initialize()
    const state = this.repository.getState()
    await this.spell.rebuild([
      ...medicalWords,
      ...state.userDictionary.map(entry => entry.word),
    ])
  }

  async correctAfterDelimiter(
    change: TextInputChange,
    additionalWords: readonly string[] = [],
  ): Promise<{ mutation: TextMutation; correction: AppliedCorrection } | null> {
    await this.initialize()
    if (change.before.isComposing || change.after.isComposing) return null
    if (change.before.selectionStart !== change.before.selectionEnd) return null
    if (!change.inputType.startsWith('insert')) return null

    const cursor = change.after.selectionStart
    if (cursor !== change.after.selectionEnd || cursor === 0) return null
    const delimiter = Array.from(change.after.text.slice(0, cursor)).at(-1) ?? ''
    if (!isCompletionDelimiter(delimiter)) return null

    const range = wordImmediatelyBefore(change.after.text, cursor - delimiter.length)
    if (!range
      || additionalWords.includes(normalizeDictionaryWord(range.word))
      || await this.spell.correct(range.word)) return null
    const spellSuggestions = await this.spell.suggest(range.word)
    const suggestions = [
      ...spellSuggestions,
      ...additionalWords.filter(word => !spellSuggestions.includes(word)),
    ]
    const preferredWords = new Set([
      ...this.medicalKeys,
      ...additionalWords.map(normalizeKey),
    ])
    const candidate = this.policy.choose(range.word, suggestions, preferredWords)
    if (!candidate) return null

    const replacement = preserveInitialCapitalization(range.word, candidate.replacement)
    const correctedEnd = range.start + replacement.length
    const mutation: TextMutation = {
      start: range.start,
      end: range.end,
      replacement,
      cursor: correctedEnd + delimiter.length,
    }
    const correction: AppliedCorrection = {
      original: range.word,
      replacement,
      start: range.start,
      end: correctedEnd,
      delimiter,
      cursorAfterCorrection: mutation.cursor,
      timestamp: Date.now(),
      contextId: change.contextId,
    }
    this.lastCorrections.set(change.sessionId, correction)
    return { mutation, correction }
  }

  tryUndo(sessionId: string, snapshot: TextInputSnapshot): { mutation: TextMutation; correction: AppliedCorrection } | null {
    const correction = this.lastCorrections.get(sessionId)
    if (!correction) return null
    if (snapshot.selectionStart !== snapshot.selectionEnd || snapshot.selectionStart !== correction.cursorAfterCorrection) return null

    const expected = correction.replacement + correction.delimiter
    if (snapshot.text.slice(correction.start, correction.cursorAfterCorrection) !== expected) return null
    this.lastCorrections.delete(sessionId)
    return {
      correction,
      mutation: {
        start: correction.start,
        end: correction.cursorAfterCorrection,
        replacement: correction.original,
        cursor: correction.start + correction.original.length,
      },
    }
  }

  invalidate(sessionId: string): AppliedCorrection | null {
    const correction = this.lastCorrections.get(sessionId) ?? null
    this.lastCorrections.delete(sessionId)
    return correction
  }

  hasCorrection(sessionId: string): boolean {
    return this.lastCorrections.has(sessionId)
  }
}
