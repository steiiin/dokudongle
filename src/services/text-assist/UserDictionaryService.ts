import type { TextAssistStateRepositoryLike } from './persistence'
import type { AddUserWordResult, UserDictionaryEntry, UserDictionaryWordSource } from './types'
import { isDictionaryEntry, isDictionaryWord, normalizeDictionaryEntry, normalizeKey } from './text'

export interface UserWordRegistry {
  addUserWord(word: string): Promise<void>
  rebuildUserWords(): Promise<void>
}

export class UserDictionaryService {
  constructor(
    private readonly repository: TextAssistStateRepositoryLike,
    private readonly registry: UserWordRegistry,
  ) {}

  async getEntries(): Promise<UserDictionaryEntry[]> {
    await this.repository.initialize()
    return [...this.repository.getState().userDictionary].sort((a, b) => a.word.localeCompare(b.word, 'de'))
  }

  async getWords(): Promise<string[]> {
    return (await this.getEntries()).map(entry => entry.word)
  }

  // Called by text assistance after repository initialization.
  getCompletions(text: string, cursor: number): Array<{ entry: UserDictionaryEntry; start: number; end: number }> {
    const wordCharacter = /[\p{L}\p{M}\p{N}'’-]/u
    const nextCharacter = Array.from(text.slice(cursor))[0] ?? ''
    if (wordCharacter.test(nextCharacter)) return []

    const entries = this.repository.getState().userDictionary
    if (!entries.length) return []
    const maximumLength = Math.max(...entries.map(entry => entry.normalized.length))
    const prefix = text.slice(0, cursor)
    const candidates: Array<{ start: number; normalized: string }> = []
    const boundaries = Array.from(prefix.matchAll(/(?<![\p{L}\p{M}\p{N}'’-])(?=\S)/gu))
    // Only normalize suffixes short enough to match a saved entry.
    for (const boundary of boundaries.reverse()) {
      const start = boundary.index
      const normalized = normalizeKey(prefix.slice(start).replace(/\s+/gu, ' '))
      if (normalized.length > maximumLength) break
      if ((normalized.match(/\p{L}/gu)?.length ?? 0) >= 2) candidates.push({ start, normalized })
    }
    candidates.reverse()

    return entries.flatMap(entry => {
      // Candidates are ordered by start offset, so the first match is longest.
      const match = candidates.find(candidate => entry.normalized.startsWith(candidate.normalized))
      if (!match || match.normalized === entry.normalized) return []
      return [{ entry, start: match.start, end: cursor }]
    })
  }

  async addWord(word: string, source: UserDictionaryWordSource = 'manual'): Promise<AddUserWordResult> {
    await this.repository.initialize()
    const normalizedWord = normalizeDictionaryEntry(word)
    if (!isDictionaryEntry(normalizedWord)) throw new Error('Bitte ein Wort oder eine Wortgruppe mit Buchstaben eingeben.')
    const normalized = normalizeKey(normalizedWord)
    const state = this.repository.getState()
    if (state.userDictionary.some(entry => entry.normalized === normalized)) return 'already-present'

    const entry = { word: normalizedWord, normalized, source, addedAt: Date.now() }
    const registerWord = isDictionaryWord(normalizedWord)
    state.userDictionary.push(entry)
    try {
      if (registerWord) await this.registry.addUserWord(normalizedWord)
      await this.repository.saveNow()
    }
    catch (error) {
      state.userDictionary = state.userDictionary.filter(candidate => candidate !== entry)
      if (registerWord) await this.registry.rebuildUserWords()
      throw error
    }
    return 'added'
  }

  async removeWord(word: string): Promise<void> {
    await this.repository.initialize()
    const normalized = normalizeKey(normalizeDictionaryEntry(word))
    const state = this.repository.getState()
    state.userDictionary = state.userDictionary.filter(entry => entry.normalized !== normalized)
    state.rejectedCorrections = state.rejectedCorrections.filter(entry => normalizeKey(entry.original) !== normalized)
    await this.repository.saveNow()
    await this.registry.rebuildUserWords()
  }
}
