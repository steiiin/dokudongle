import { AutocorrectService } from './AutocorrectService'
import { SnippetService } from './SnippetService'
import { SuggestionService } from './SuggestionService'
import { TextLearningService } from './TextLearningService'
import { TextAssistStateRepository, type TextAssistStateRepositoryLike } from './persistence'
import { UserDictionaryService } from './UserDictionaryService'
import type {
  AppliedCorrection,
  TextAssistUpdate,
  TextContext,
  TextInputChange,
  TextInputSnapshot,
  TextMutation,
  TextSuggestion,
  UserDictionaryEntry,
} from './types'
import { DELIMITERS, normalizeKey, wordImmediatelyBefore, wordsBefore } from './text'

export class TextAssistService {
  readonly repository: TextAssistStateRepositoryLike
  readonly autocorrect: AutocorrectService
  readonly userDictionary: UserDictionaryService
  readonly snippets: SnippetService
  readonly learning: TextLearningService
  readonly suggestions: SuggestionService
  private initialization?: Promise<void>

  constructor(repository: TextAssistStateRepositoryLike = new TextAssistStateRepository()) {
    this.repository = repository
    this.autocorrect = new AutocorrectService(repository)
    this.userDictionary = new UserDictionaryService(repository, this.autocorrect)
    this.snippets = new SnippetService()
    this.learning = new TextLearningService(repository)
    this.suggestions = new SuggestionService(this.autocorrect, this.snippets, this.learning)
  }

  initialize(): Promise<void> {
    if (!this.initialization) {
      this.initialization = Promise.all([
        this.repository.initialize(),
        this.autocorrect.initialize(),
        this.learning.initialize(),
      ]).then(() => undefined)
    }
    return this.initialization
  }

  async processInput(change: TextInputChange): Promise<TextAssistUpdate> {
    await this.initialize()
    if (change.before.isComposing || change.after.isComposing) return { suggestions: [] }

    this.acceptPendingCorrection(change.sessionId, change.before)
    const corrected = await this.autocorrect.correctAfterDelimiter(change)
    let snapshot = change.after
    if (corrected) snapshot = this.snapshotAfterMutation(change.after, corrected.mutation)
    else this.learnCompletedInput(change)

    return {
      mutation: corrected?.mutation,
      suggestions: await this.getSuggestions(change.sessionId, change.contextId, snapshot),
    }
  }

  handleBackspace(sessionId: string, snapshot: TextInputSnapshot): TextMutation | null {
    const undone = this.autocorrect.tryUndo(sessionId, snapshot)
    if (!undone) return null
    void this.recordRejection(undone.correction)
    return undone.mutation
  }

  async getSuggestions(sessionId: string, contextId: string, snapshot: TextInputSnapshot): Promise<TextSuggestion[]> {
    await this.initialize()
    if (snapshot.isComposing || snapshot.selectionStart !== snapshot.selectionEnd) return []
    const cursor = snapshot.selectionStart
    const words = wordsBefore(snapshot.text, cursor, 2)
    const current = wordImmediatelyBefore(snapshot.text, cursor)?.word ?? ''
    const context: TextContext = {
      text: snapshot.text,
      cursor,
      currentWord: current,
      previousWord: words.length > 1 ? words.at(-2) : words.at(-1),
      sessionId,
      contextId,
    }
    return this.suggestions.getSuggestions(context)
  }

  applySuggestion(sessionId: string, contextId: string, snapshot: TextInputSnapshot, suggestion: TextSuggestion): TextMutation {
    this.acceptPendingCorrection(sessionId, snapshot)
    const history = wordsBefore(snapshot.text, suggestion.start, 4)
    const insertedWords = wordsBefore(suggestion.replacement, suggestion.replacement.length, 20)
    if (insertedWords.length > 0) this.learning.recordSequence(insertedWords, contextId, history)
    return {
      start: suggestion.start,
      end: suggestion.end,
      replacement: suggestion.replacement,
      cursor: suggestion.start + suggestion.replacement.length,
    }
  }

  invalidateSession(sessionId: string, snapshot?: TextInputSnapshot): void {
    const correction = this.autocorrect.invalidate(sessionId)
    if (correction && snapshot) this.learnAcceptedCorrection(correction, snapshot.text)
  }

  async getUserDictionaryEntries(): Promise<UserDictionaryEntry[]> {
    return this.userDictionary.getEntries()
  }

  async addUserWord(word: string): Promise<void> {
    await this.userDictionary.addWord(word)
  }

  async removeUserWord(word: string): Promise<void> {
    await this.userDictionary.removeWord(word)
  }

  flush(): Promise<void> {
    return this.repository.saveNow()
  }

  private acceptPendingCorrection(sessionId: string, snapshot: TextInputSnapshot): void {
    const correction = this.autocorrect.invalidate(sessionId)
    if (correction) this.learnAcceptedCorrection(correction, snapshot.text)
  }

  private learnAcceptedCorrection(correction: AppliedCorrection, text: string): void {
    const previous = wordsBefore(text, correction.start, 4)
    this.learning.recordCompletedWord(correction.replacement, correction.contextId, previous)
  }

  private learnCompletedInput(change: TextInputChange): void {
    if (!change.inputType.startsWith('insert')) return
    const cursor = change.after.selectionStart
    if (cursor !== change.after.selectionEnd || cursor === 0) return
    const delimiter = change.after.text[cursor - 1]
    if (!DELIMITERS.has(delimiter)) return
    const word = wordImmediatelyBefore(change.after.text, cursor - 1)
    if (!word) return
    this.learning.recordCompletedWord(word.word, change.contextId, wordsBefore(change.after.text, word.start, 4))
  }

  private async recordRejection(correction: AppliedCorrection): Promise<void> {
    const state = this.repository.getState()
    const originalKey = normalizeKey(correction.original)
    const suggestedKey = normalizeKey(correction.replacement)
    let rejection = state.rejectedCorrections.find(entry =>
      normalizeKey(entry.original) === originalKey && normalizeKey(entry.suggested) === suggestedKey)
    if (!rejection) {
      rejection = { original: correction.original, suggested: correction.replacement, rejectionCount: 0 }
      state.rejectedCorrections.push(rejection)
    }
    rejection.rejectionCount += 1
    const total = state.rejectedCorrections
      .filter(entry => normalizeKey(entry.original) === originalKey)
      .reduce((sum, entry) => sum + entry.rejectionCount, 0)
    if (total >= 2) await this.userDictionary.addWord(correction.original, 'learned')
    else await this.repository.saveNow()
  }

  private snapshotAfterMutation(snapshot: TextInputSnapshot, mutation: TextMutation): TextInputSnapshot {
    return {
      text: snapshot.text.slice(0, mutation.start) + mutation.replacement + snapshot.text.slice(mutation.end),
      selectionStart: mutation.cursor,
      selectionEnd: mutation.cursor,
      isComposing: false,
    }
  }
}

export const textAssistService = new TextAssistService()
