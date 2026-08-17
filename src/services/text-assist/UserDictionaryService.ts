import type { TextAssistStateRepositoryLike } from './persistence'
import type { UserDictionaryEntry, UserDictionaryWordSource } from './types'
import { isDictionaryWord, normalizeDictionaryWord, normalizeKey } from './text'

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

  async addWord(word: string, source: UserDictionaryWordSource = 'manual'): Promise<void> {
    await this.repository.initialize()
    const normalizedWord = normalizeDictionaryWord(word)
    if (!isDictionaryWord(normalizedWord)) throw new Error('Bitte genau ein gültiges Wort eingeben.')
    const normalized = normalizeKey(normalizedWord)
    const state = this.repository.getState()
    if (state.userDictionary.some(entry => entry.normalized === normalized)) return

    state.userDictionary.push({ word: normalizedWord, normalized, source, addedAt: Date.now() })
    await this.registry.addUserWord(normalizedWord)
    await this.repository.saveNow()
  }

  async removeWord(word: string): Promise<void> {
    await this.repository.initialize()
    const normalized = normalizeKey(normalizeDictionaryWord(word))
    const state = this.repository.getState()
    state.userDictionary = state.userDictionary.filter(entry => entry.normalized !== normalized)
    state.rejectedCorrections = state.rejectedCorrections.filter(entry => normalizeKey(entry.original) !== normalized)
    await this.repository.saveNow()
    await this.registry.rebuildUserWords()
  }
}
