import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { InProcessGermanSpellChecker } from '@/services/text-assist/InProcessGermanSpellChecker'
import { SpellCheckerWorkerRuntime } from '@/services/text-assist/SpellCheckerWorkerRuntime'
import { WorkerGermanSpellChecker } from '@/services/text-assist/WorkerGermanSpellChecker'
import type { GermanSpellChecker } from '@/services/text-assist/GermanSpellChecker'
import type {
  SpellCheckerWorkerRequest,
  SpellCheckerWorkerResponse,
} from '@/services/text-assist/spell-checker-worker-protocol'

describe('Hunspell German engine', () => {
  const spellChecker = new InProcessGermanSpellChecker()

  beforeAll(async () => {
    await spellChecker.initialize([])
  })

  afterAll(async () => {
    await spellChecker.dispose()
  })

  test('recognizes German compounds and their inflections', async () => {
    await expect(spellChecker.correct('Krankenhaus')).resolves.toBe(true)
    await expect(spellChecker.correct('Krankenhäuser')).resolves.toBe(true)
    await expect(spellChecker.correct('Rettungsdienst')).resolves.toBe(true)
  })

  test('rejects lowercase nouns and suggests their dictionary casing', async () => {
    await expect(spellChecker.correct('krankenhaus')).resolves.toBe(false)
    await expect(spellChecker.suggest('krankenhaus')).resolves.toContain('Krankenhaus')
  })
})

class ControlledSpellChecker implements GermanSpellChecker {
  operations: string[] = []
  initializeGate?: Promise<void>
  initializationError?: Error

  async initialize(): Promise<void> {
    this.operations.push('initialize')
    if (this.initializationError) throw this.initializationError
    await this.initializeGate
  }

  async correct(word: string): Promise<boolean> {
    this.operations.push(`correct:${word}`)
    return word === 'Krankenhaus'
  }

  async suggest(word: string): Promise<string[]> {
    this.operations.push(`suggest:${word}`)
    return ['Krankenhaus']
  }

  async addWord(word: string): Promise<void> {
    this.operations.push(`add:${word}`)
  }

  async rebuild(additionalWords: readonly string[]): Promise<void> {
    this.operations.push(`rebuild:${additionalWords.join(',')}`)
  }

  async dispose(): Promise<void> {
    this.operations.push('dispose')
  }
}

describe('spell checker worker runtime', () => {
  test('serializes requests while initialization is still pending', async () => {
    let releaseInitialization!: () => void
    const spellChecker = new ControlledSpellChecker()
    spellChecker.initializeGate = new Promise(resolve => { releaseInitialization = resolve })
    const responses: SpellCheckerWorkerResponse[] = []
    const runtime = new SpellCheckerWorkerRuntime(spellChecker, response => responses.push(response))

    runtime.handle({ id: 1, operation: 'initialize', additionalWords: [] })
    runtime.handle({ id: 2, operation: 'correct', word: 'Krankenhaus' })
    await vi.waitFor(() => expect(spellChecker.operations).toEqual(['initialize']))

    releaseInitialization()
    await vi.waitFor(() => {
      expect(spellChecker.operations).toEqual(['initialize', 'correct:Krankenhaus'])
      expect(responses.map(response => response.id)).toEqual([1, 2])
    })
  })

  test('reports initialization failures and continues processing the queue', async () => {
    const spellChecker = new ControlledSpellChecker()
    spellChecker.initializationError = new Error('WASM failed')
    const responses: SpellCheckerWorkerResponse[] = []
    const runtime = new SpellCheckerWorkerRuntime(spellChecker, response => responses.push(response))

    runtime.handle({ id: 1, operation: 'initialize', additionalWords: [] })
    runtime.handle({ id: 2, operation: 'correct', word: 'Krankenhaus' })

    await vi.waitFor(() => expect(responses).toHaveLength(2))
    expect(responses[0]).toEqual({ id: 1, ok: false, error: 'WASM failed' })
    expect(responses[1]).toEqual({ id: 2, ok: true, result: true })
  })
})

class FakeWorker {
  onmessage: ((event: MessageEvent<SpellCheckerWorkerResponse>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  onmessageerror: ((event: MessageEvent) => void) | null = null
  requests: SpellCheckerWorkerRequest[] = []
  terminated = false

  postMessage(request: SpellCheckerWorkerRequest): void {
    this.requests.push(request)
  }

  terminate(): void {
    this.terminated = true
  }

  respond(response: SpellCheckerWorkerResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<SpellCheckerWorkerResponse>)
  }
}

describe('spell checker worker client', () => {
  test('correlates responses and disposes the worker', async () => {
    const worker = new FakeWorker()
    const spellChecker = new WorkerGermanSpellChecker(() => worker)
    const initialization = spellChecker.initialize(['Patient'])
    const correctness = spellChecker.correct('Krankenhaus')

    expect(worker.requests.map(request => request.operation)).toEqual(['initialize', 'correct'])
    worker.respond({ id: worker.requests[1].id, ok: true, result: true })
    await expect(correctness).resolves.toBe(true)
    worker.respond({ id: worker.requests[0].id, ok: true })
    await expect(initialization).resolves.toBeUndefined()

    const disposal = spellChecker.dispose()
    const disposeRequest = worker.requests.at(-1)!
    worker.respond({ id: disposeRequest.id, ok: true })
    await disposal
    expect(worker.terminated).toBe(true)
    await expect(spellChecker.correct('Patient')).rejects.toThrow('disposed')
  })

  test('propagates worker response errors', async () => {
    const worker = new FakeWorker()
    const spellChecker = new WorkerGermanSpellChecker(() => worker)
    const initialization = spellChecker.initialize([])

    worker.respond({ id: worker.requests[0].id, ok: false, error: 'Could not initialize Hunspell' })
    await expect(initialization).rejects.toThrow('Could not initialize Hunspell')
  })
})

