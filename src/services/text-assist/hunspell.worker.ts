import { InProcessGermanSpellChecker } from './InProcessGermanSpellChecker'
import { SpellCheckerWorkerRuntime } from './SpellCheckerWorkerRuntime'
import type { SpellCheckerWorkerRequest, SpellCheckerWorkerResponse } from './spell-checker-worker-protocol'

interface SpellCheckerWorkerScope {
  onmessage: ((event: MessageEvent<SpellCheckerWorkerRequest>) => void) | null
  postMessage(message: SpellCheckerWorkerResponse): void
}

const workerScope = self as unknown as SpellCheckerWorkerScope
const runtime = new SpellCheckerWorkerRuntime(
  new InProcessGermanSpellChecker(),
  response => workerScope.postMessage(response),
)

workerScope.onmessage = event => runtime.handle(event.data)

