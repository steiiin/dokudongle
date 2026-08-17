import type { CorrectionCandidate } from './types'
import { damerauLevenshtein, normalizeKey } from './text'

export interface CorrectionPolicy {
  choose(original: string, suggestions: string[], preferredWords?: ReadonlySet<string>): CorrectionCandidate | null
}

export class ConservativeCorrectionPolicy implements CorrectionPolicy {
  choose(original: string, suggestions: string[], preferredWords: ReadonlySet<string> = new Set()): CorrectionCandidate | null {
    const normalizedOriginal = normalizeKey(original)
    const ranked = suggestions
      .filter(candidate => normalizeKey(candidate) !== normalizedOriginal)
      .map(replacement => ({
        replacement,
        distance: damerauLevenshtein(original, replacement),
      }))
      .sort((left, right) => left.distance - right.distance)

    const best = ranked[0]
    if (!best || best.distance !== 1) return null
    const equallyClose = ranked.filter(candidate => candidate.distance === best.distance)
    const preferred = equallyClose.filter(candidate => preferredWords.has(normalizeKey(candidate.replacement)))
    if (equallyClose.length > 1 && preferred.length !== 1) return null
    const selected = preferred[0] ?? best

    const length = Math.max(Array.from(original).length, Array.from(selected.replacement).length)
    const confidence = length === 0 ? 0 : 1 - selected.distance / length
    if (confidence < 0.85) return null

    return { original, replacement: selected.replacement, confidence }
  }
}
