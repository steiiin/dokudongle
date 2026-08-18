import { WorkerGermanSpellChecker } from './WorkerGermanSpellChecker'

export interface GermanSpellChecker {
  initialize(additionalWords: readonly string[]): Promise<void>
  correct(word: string): Promise<boolean>
  suggest(word: string): Promise<string[]>
  addWord(word: string): Promise<void>
  rebuild(additionalWords: readonly string[]): Promise<void>
  dispose(): Promise<void>
}

export class DefaultGermanSpellChecker implements GermanSpellChecker {
  private delegate?: Promise<GermanSpellChecker>

  initialize(additionalWords: readonly string[]): Promise<void> {
    return this.withDelegate(spellChecker => spellChecker.initialize(additionalWords))
  }

  correct(word: string): Promise<boolean> {
    return this.withDelegate(spellChecker => spellChecker.correct(word))
  }

  suggest(word: string): Promise<string[]> {
    return this.withDelegate(spellChecker => spellChecker.suggest(word))
  }

  addWord(word: string): Promise<void> {
    return this.withDelegate(spellChecker => spellChecker.addWord(word))
  }

  rebuild(additionalWords: readonly string[]): Promise<void> {
    return this.withDelegate(spellChecker => spellChecker.rebuild(additionalWords))
  }

  dispose(): Promise<void> {
    return this.withDelegate(spellChecker => spellChecker.dispose())
  }

  private withDelegate<T>(operation: (spellChecker: GermanSpellChecker) => Promise<T>): Promise<T> {
    if (!this.delegate) {
      this.delegate = import.meta.env.MODE === 'test'
        ? import('./InProcessGermanSpellChecker').then(module => new module.InProcessGermanSpellChecker())
        : Promise.resolve(new WorkerGermanSpellChecker())
    }
    return this.delegate.then(operation)
  }
}
