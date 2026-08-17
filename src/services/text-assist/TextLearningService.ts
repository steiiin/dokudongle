import type { TextAssistStateRepositoryLike } from './persistence'
import { emptyLearningScope } from './persistence'
import type { LearningScopeState } from './types'
import { normalizeKey } from './text'

const GLOBAL_LIMITS = { words: 2500, bigrams: 5000, phrases: 1500 }
const CONTEXT_LIMITS = { words: 1000, bigrams: 2000, phrases: 500 }

export interface LearnedWordCandidate {
  word: string
  globalCount: number
  contextCount: number
  lastUsedAt: number
}

export interface LearnedPhraseCandidate {
  replacement: string
  globalCount: number
  contextCount: number
  lastUsedAt: number
}

export class TextLearningService {
  constructor(private readonly repository: TextAssistStateRepositoryLike) {}

  async initialize(): Promise<void> {
    await this.repository.initialize()
  }

  recordCompletedWord(word: string, contextId: string, previousWords: string[] = []): void {
    const normalizedWord = normalizeKey(word)
    if (!normalizedWord) return
    const now = Date.now()
    const context = this.getContext(contextId)
    const global = this.repository.getState().learning.global
    this.incrementWord(global, normalizedWord, word, now)
    this.incrementWord(context, normalizedWord, word, now)

    const previous = previousWords.at(-1)
    if (previous) {
      this.incrementBigram(global, previous, word, now)
      this.incrementBigram(context, previous, word, now)
    }

    const sequence = [...previousWords.slice(-4), word]
    for (let size = 3; size <= Math.min(5, sequence.length); size += 1) {
      const phrase = sequence.slice(-size).join(' ')
      this.incrementPhrase(global, phrase, now)
      this.incrementPhrase(context, phrase, now)
    }

    this.prune(global, GLOBAL_LIMITS)
    this.prune(context, CONTEXT_LIMITS)
    this.repository.scheduleSave()
  }

  recordSequence(words: string[], contextId: string, history: string[] = []): void {
    const runningHistory = [...history.slice(-4)]
    for (const word of words) {
      this.recordCompletedWord(word, contextId, runningHistory)
      runningHistory.push(word)
      if (runningHistory.length > 4) runningHistory.shift()
    }
  }

  getWordCandidates(prefix: string, contextId: string): LearnedWordCandidate[] {
    const normalizedPrefix = normalizeKey(prefix)
    if (!normalizedPrefix) return []
    const merged = new Map<string, LearnedWordCandidate>()
    this.mergeWords(merged, this.repository.getState().learning.global, normalizedPrefix, false)
    this.mergeWords(merged, this.getContext(contextId), normalizedPrefix, true)
    return [...merged.values()].filter(candidate => Math.max(candidate.globalCount, candidate.contextCount) >= 2)
  }

  getNextWordCandidates(previousWord: string, contextId: string): LearnedWordCandidate[] {
    const previous = normalizeKey(previousWord)
    if (!previous) return []
    const merged = new Map<string, LearnedWordCandidate>()
    this.mergeBigrams(merged, this.repository.getState().learning.global, previous, false)
    this.mergeBigrams(merged, this.getContext(contextId), previous, true)
    return [...merged.values()].filter(candidate => Math.max(candidate.globalCount, candidate.contextCount) >= 2)
  }

  getPhraseCompletions(contextWords: string[], contextId: string): LearnedPhraseCandidate[] {
    const normalizedContext = contextWords.map(normalizeKey)
    const merged = new Map<string, LearnedPhraseCandidate>()
    this.mergePhrases(merged, this.repository.getState().learning.global, normalizedContext, false)
    this.mergePhrases(merged, this.getContext(contextId), normalizedContext, true)
    return [...merged.values()].filter(candidate => Math.max(candidate.globalCount, candidate.contextCount) >= 2)
  }

  private getContext(contextId: string): LearningScopeState {
    const contexts = this.repository.getState().learning.contexts
    return contexts[contextId] ?? (contexts[contextId] = emptyLearningScope())
  }

  private incrementWord(scope: LearningScopeState, key: string, word: string, now: number): void {
    const stats = scope.words[key] ?? { word, count: 0, lastUsedAt: now }
    stats.word = word
    stats.count += 1
    stats.lastUsedAt = now
    scope.words[key] = stats
  }

  private incrementBigram(scope: LearningScopeState, previousWord: string, word: string, now: number): void {
    const key = `${normalizeKey(previousWord)}\u0000${normalizeKey(word)}`
    const stats = scope.bigrams[key] ?? { previousWord, word, count: 0, lastUsedAt: now }
    stats.previousWord = previousWord
    stats.word = word
    stats.count += 1
    stats.lastUsedAt = now
    scope.bigrams[key] = stats
  }

  private incrementPhrase(scope: LearningScopeState, phrase: string, now: number): void {
    const key = normalizeKey(phrase)
    const stats = scope.phrases[key] ?? { phrase, count: 0, lastUsedAt: now }
    stats.phrase = phrase
    stats.count += 1
    stats.lastUsedAt = now
    scope.phrases[key] = stats
  }

  private mergeWords(target: Map<string, LearnedWordCandidate>, scope: LearningScopeState, prefix: string, contextual: boolean): void {
    for (const [key, stats] of Object.entries(scope.words)) {
      if (!key.startsWith(prefix) || key === prefix) continue
      const candidate = target.get(key) ?? { word: stats.word, globalCount: 0, contextCount: 0, lastUsedAt: 0 }
      if (contextual) candidate.contextCount = stats.count
      else candidate.globalCount = stats.count
      candidate.lastUsedAt = Math.max(candidate.lastUsedAt, stats.lastUsedAt)
      target.set(key, candidate)
    }
  }

  private mergeBigrams(target: Map<string, LearnedWordCandidate>, scope: LearningScopeState, previous: string, contextual: boolean): void {
    for (const stats of Object.values(scope.bigrams)) {
      if (normalizeKey(stats.previousWord) !== previous) continue
      const key = normalizeKey(stats.word)
      const candidate = target.get(key) ?? { word: stats.word, globalCount: 0, contextCount: 0, lastUsedAt: 0 }
      if (contextual) candidate.contextCount = stats.count
      else candidate.globalCount = stats.count
      candidate.lastUsedAt = Math.max(candidate.lastUsedAt, stats.lastUsedAt)
      target.set(key, candidate)
    }
  }

  private mergePhrases(target: Map<string, LearnedPhraseCandidate>, scope: LearningScopeState, context: string[], contextual: boolean): void {
    for (const stats of Object.values(scope.phrases)) {
      const words = stats.phrase.split(/\s+/u)
      let matched = 0
      const max = Math.min(context.length, words.length - 1)
      for (let size = max; size >= 1; size -= 1) {
        const suffix = context.slice(-size)
        if (suffix.every((word, index) => word === normalizeKey(words[index]))) {
          matched = size
          break
        }
      }
      if (matched === 0) continue
      const replacement = words.slice(matched).join(' ')
      const key = normalizeKey(replacement)
      const candidate = target.get(key) ?? { replacement, globalCount: 0, contextCount: 0, lastUsedAt: 0 }
      if (contextual) candidate.contextCount = stats.count
      else candidate.globalCount = stats.count
      candidate.lastUsedAt = Math.max(candidate.lastUsedAt, stats.lastUsedAt)
      target.set(key, candidate)
    }
  }

  private prune(scope: LearningScopeState, limits: typeof GLOBAL_LIMITS): void {
    this.pruneRecord(scope.words, limits.words)
    this.pruneRecord(scope.bigrams, limits.bigrams)
    this.pruneRecord(scope.phrases, limits.phrases)
  }

  private pruneRecord<T extends { count: number; lastUsedAt: number }>(record: Record<string, T>, limit: number): void {
    const entries = Object.entries(record)
    if (entries.length <= limit) return
    entries.sort(([, a], [, b]) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    for (const [key] of entries.slice(limit)) delete record[key]
  }
}
