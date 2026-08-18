export type SpellCheckerWorkerCommand =
  | { operation: 'initialize' | 'rebuild'; additionalWords: string[] }
  | { operation: 'correct' | 'suggest' | 'addWord'; word: string }
  | { operation: 'dispose' }

export type SpellCheckerWorkerRequest = SpellCheckerWorkerCommand & { id: number }

export type SpellCheckerWorkerResponse =
  | { id: number; ok: true; result?: boolean | string[] }
  | { id: number; ok: false; error: string }
