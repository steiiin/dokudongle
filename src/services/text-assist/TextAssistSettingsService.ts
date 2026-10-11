import defaultShortcuts from '@/assets/text-assist/shortcut-replacements.json'
import defaultLocations from '@/assets/snippets/locations.json'
import type { TextAssistStateRepositoryLike } from './persistence'
import type { NewLocationSnippet, TextAssistPersistedState, TextSnippet } from './types'
import { isDictionaryWord, normalizeDictionaryWord } from './text'

type CollectionKey = 'shortcutReplacements' | 'locationSnippets'

export class TextAssistSettingsService {
  private mutations: Promise<void> = Promise.resolve()

  constructor(private readonly repository: TextAssistStateRepositoryLike) {}

  async getShortcuts(): Promise<Record<string, string>> {
    await this.repository.initialize()
    return { ...this.repository.getState().shortcutReplacements }
  }

  async getLocations(): Promise<TextSnippet[]> {
    await this.repository.initialize()
    return structuredClone(this.repository.getState().locationSnippets)
  }

  addShortcut(rawShortcut: string, rawReplacement: string): Promise<void> {
    return this.update('shortcutReplacements', entries => {
      const shortcut = normalizeDictionaryWord(rawShortcut)
      const replacement = normalizeDictionaryWord(rawReplacement)
      if (!isDictionaryWord(shortcut)) throw new Error('Bitte einen Shortcut aus einem einzelnen Wort eingeben.')
      if (!replacement) throw new Error('Bitte eine Ersetzung eingeben.')
      if (Object.prototype.hasOwnProperty.call(entries, shortcut)) throw new Error('Dieser Shortcut ist bereits vorhanden.')
      return { ...entries, [shortcut]: replacement }
    })
  }

  removeShortcut(shortcut: string): Promise<void> {
    return this.update('shortcutReplacements', entries => Object.fromEntries(Object.entries(entries).filter(([key]) => key !== shortcut)))
  }

  updateShortcut(original: string, rawShortcut: string, rawReplacement: string): Promise<void> {
    return this.update('shortcutReplacements', entries => {
      const shortcut = normalizeDictionaryWord(rawShortcut)
      const replacement = normalizeDictionaryWord(rawReplacement)
      if (!Object.prototype.hasOwnProperty.call(entries, original)) throw new Error('Dieser Shortcut ist nicht mehr vorhanden.')
      if (!isDictionaryWord(shortcut)) throw new Error('Bitte einen Shortcut aus einem einzelnen Wort eingeben.')
      if (!replacement) throw new Error('Bitte eine Ersetzung eingeben.')
      if (shortcut !== original && Object.prototype.hasOwnProperty.call(entries, shortcut)) throw new Error('Dieser Shortcut ist bereits vorhanden.')
      return Object.fromEntries(Object.entries(entries).map(([key, value]) => key === original ? [shortcut, replacement] : [key, value]))
    })
  }

  resetShortcuts(): Promise<void> {
    return this.update('shortcutReplacements', () => ({ ...defaultShortcuts }))
  }

  addLocation(input: NewLocationSnippet): Promise<void> {
    return this.update('locationSnippets', entries => [...entries, { ...this.normalizeLocation(input), id: crypto.randomUUID() }])
  }

  updateLocation(id: string, input: NewLocationSnippet): Promise<void> {
    return this.update('locationSnippets', entries => {
      if (!entries.some(entry => entry.id === id)) throw new Error('Dieses Snippet ist nicht mehr vorhanden.')
      const snippet = this.normalizeLocation(input)
      return entries.map(entry => entry.id === id ? { ...snippet, id } : entry)
    })
  }

  private normalizeLocation(input: NewLocationSnippet): NewLocationSnippet {
    const trigger = normalizeDictionaryWord(input.trigger)
    const label = normalizeDictionaryWord(input.label)
    const replacement = normalizeDictionaryWord(input.replacement)
    if (!trigger || /\s/u.test(trigger)) throw new Error('Bitte einen Auslöser ohne Leerzeichen eingeben.')
    if (!label || !replacement) throw new Error('Bitte Bezeichnung und Ersetzung eingeben.')
    const keywords = [...new Set((input.keywords ?? []).map(normalizeDictionaryWord).filter(Boolean))]
    const category = normalizeDictionaryWord(input.category ?? '')
    return { trigger, label, replacement, keywords, category }
  }

  removeLocation(id: string): Promise<void> {
    return this.update('locationSnippets', entries => entries.filter(entry => entry.id !== id))
  }

  resetLocations(): Promise<void> {
    return this.update('locationSnippets', () => structuredClone(defaultLocations))
  }

  private update<K extends CollectionKey>(key: K, change: (entries: TextAssistPersistedState[K]) => TextAssistPersistedState[K]): Promise<void> {
    const operation = this.mutations.catch(() => undefined).then(async () => {
      await this.repository.initialize()
      const state = this.repository.getState()
      const previous = state[key]
      state[key] = change(previous)
      try {
        await this.repository.saveNow()
      }
      catch (error) {
        state[key] = previous
        throw error
      }
    })
    this.mutations = operation
    return operation
  }
}
