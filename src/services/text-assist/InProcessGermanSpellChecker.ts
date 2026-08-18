import type { Hunspell } from 'hunspell-wasm'
import type { GermanSpellChecker } from './GermanSpellChecker'

export class InProcessGermanSpellChecker implements GermanSpellChecker {
  private spell?: Hunspell
  private initialization?: Promise<void>

  initialize(additionalWords: readonly string[]): Promise<void> {
    if (!this.initialization) this.initialization = this.create(additionalWords)
    return this.initialization
  }

  async correct(word: string): Promise<boolean> {
    await this.requireInitialized()
    return this.spell!.testSpelling(word)
  }

  async suggest(word: string): Promise<string[]> {
    await this.requireInitialized()
    return this.spell!.getSpellingSuggestions(word)
  }

  async addWord(word: string): Promise<void> {
    await this.requireInitialized()
    this.spell!.addWord(word)
  }

  async rebuild(additionalWords: readonly string[]): Promise<void> {
    if (this.initialization) await this.initialization.catch(() => undefined)
    this.initialization = this.create(additionalWords)
    await this.initialization
  }

  async dispose(): Promise<void> {
    if (this.initialization) await this.initialization.catch(() => undefined)
    this.spell?.dispose()
    this.spell = undefined
    this.initialization = undefined
  }

  private async create(additionalWords: readonly string[]): Promise<void> {
    this.spell?.dispose()
    this.spell = undefined

    const [{ createHunspellFromStrings }, dictionaryModule] = await Promise.all([
      import('hunspell-wasm'),
      import('virtual:dictionary-de'),
    ])
    const spell = await createHunspellFromStrings(dictionaryModule.default.aff, dictionaryModule.default.dic)
    for (const word of new Set(additionalWords)) spell.addWord(word)
    this.spell = spell
  }

  private async requireInitialized(): Promise<void> {
    if (!this.initialization) throw new Error('German spell checker has not been initialized')
    await this.initialization
    if (!this.spell) throw new Error('German spell checker is unavailable')
  }
}

