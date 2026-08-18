import type { GermanSpellChecker } from './GermanSpellChecker'
import type { SpellCheckerWorkerRequest, SpellCheckerWorkerResponse } from './spell-checker-worker-protocol'

export class SpellCheckerWorkerRuntime {
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private readonly spellChecker: GermanSpellChecker,
    private readonly respond: (response: SpellCheckerWorkerResponse) => void,
  ) {}

  handle(request: SpellCheckerWorkerRequest): void {
    this.queue = this.queue.then(async () => {
      try {
        const result = await this.dispatch(request)
        this.respond({ id: request.id, ok: true, result })
      }
      catch (error) {
        this.respond({
          id: request.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }

  private async dispatch(request: SpellCheckerWorkerRequest): Promise<boolean | string[] | undefined> {
    switch (request.operation) {
      case 'initialize':
        await this.spellChecker.initialize(request.additionalWords)
        return undefined
      case 'rebuild':
        await this.spellChecker.rebuild(request.additionalWords)
        return undefined
      case 'correct':
        return this.spellChecker.correct(request.word)
      case 'suggest':
        return this.spellChecker.suggest(request.word)
      case 'addWord':
        await this.spellChecker.addWord(request.word)
        return undefined
      case 'dispose':
        await this.spellChecker.dispose()
        return undefined
    }
  }
}

