import type { GermanSpellChecker } from './GermanSpellChecker'
import type {
  SpellCheckerWorkerCommand,
  SpellCheckerWorkerRequest,
  SpellCheckerWorkerResponse,
} from './spell-checker-worker-protocol'

interface SpellCheckerWorkerTransport {
  onmessage: ((event: MessageEvent<SpellCheckerWorkerResponse>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
  postMessage(message: SpellCheckerWorkerRequest): void
  terminate(): void
}

export type SpellCheckerWorkerFactory = () => SpellCheckerWorkerTransport

interface PendingRequest {
  resolve: (value: boolean | string[] | undefined) => void
  reject: (reason: Error) => void
}

const createWorker = (): SpellCheckerWorkerTransport =>
  new Worker(new URL('./hunspell.worker.ts', import.meta.url), { type: 'module' })

export class WorkerGermanSpellChecker implements GermanSpellChecker {
  private worker?: SpellCheckerWorkerTransport
  private nextRequestId = 1
  private readonly pending = new Map<number, PendingRequest>()
  private failure?: Error
  private disposed = false

  constructor(private readonly workerFactory: SpellCheckerWorkerFactory = createWorker) {}

  initialize(additionalWords: readonly string[]): Promise<void> {
    return this.request<undefined>({ operation: 'initialize', additionalWords: [...additionalWords] })
  }

  correct(word: string): Promise<boolean> {
    return this.request<boolean>({ operation: 'correct', word })
  }

  suggest(word: string): Promise<string[]> {
    return this.request<string[]>({ operation: 'suggest', word })
  }

  addWord(word: string): Promise<void> {
    return this.request<undefined>({ operation: 'addWord', word })
  }

  rebuild(additionalWords: readonly string[]): Promise<void> {
    return this.request<undefined>({ operation: 'rebuild', additionalWords: [...additionalWords] })
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    if (!this.worker) {
      this.disposed = true
      return
    }

    try {
      await this.request<undefined>({ operation: 'dispose' })
    }
    finally {
      this.disposed = true
      this.worker.terminate()
      this.worker = undefined
      this.rejectPending(new Error('German spell checker has been disposed'))
    }
  }

  private request<T extends boolean | string[] | undefined>(
    request: SpellCheckerWorkerCommand,
  ): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('German spell checker has been disposed'))
    if (this.failure) return Promise.reject(this.failure)

    const worker = this.getWorker()
    const id = this.nextRequestId++
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: value => resolve(value as T),
        reject,
      })
      worker.postMessage({ ...request, id } as SpellCheckerWorkerRequest)
    })
  }

  private getWorker(): SpellCheckerWorkerTransport {
    if (this.worker) return this.worker
    const worker = this.workerFactory()
    worker.onmessage = event => this.handleResponse(event.data)
    worker.onerror = event => this.handleWorkerFailure(event.error ?? new Error(event.message || 'Spell checker worker failed'))
    worker.onmessageerror = () => this.handleWorkerFailure(new Error('Spell checker worker returned an unreadable response'))
    this.worker = worker
    return worker
  }

  private handleResponse(response: SpellCheckerWorkerResponse): void {
    const pending = this.pending.get(response.id)
    if (!pending) return
    this.pending.delete(response.id)
    if (response.ok) pending.resolve(response.result)
    else pending.reject(new Error(response.error))
  }

  private handleWorkerFailure(error: Error): void {
    this.failure = error
    this.worker?.terminate()
    this.worker = undefined
    this.rejectPending(error)
  }

  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) request.reject(error)
    this.pending.clear()
  }
}
