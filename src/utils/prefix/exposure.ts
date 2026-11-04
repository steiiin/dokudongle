import { conditionalPrefix } from "../filter";

/**
 * Stellt Stuhlbefunden „Stuhl“ voran, wenn noch kein Schlüsselwort vorhanden ist.
 */
export function prefixDefecation(draft: string): string {
  return conditionalPrefix(draft, 'Stuhl:',
    [
      'Stuhl',
      'Kot',
      'Durchfall',
      'Diarrhoe',
      'Obstipation'
    ]
  )
}

/**
 * Stellt Beschreibungen von Bauchschmerzen „Schmerzen“ voran, wenn noch kein Schlüsselwort vorhanden ist.
 */
export function prefixAbdominalPain(draft: string): string {
  return conditionalPrefix(draft, 'Schmerz:',
    [
      'Schmerz',
      'DS',
      'Stech',
      'Brenn',
    ]
  )
}

/**
 * Stellt sicher, dass Angaben zur Peristaltik mit „DG“ beginnen, sofern das Präfix noch nicht enthalten ist.
 */
export function prefixAbdominalPeristalsis(draft: string): string {
  return conditionalPrefix(draft, 'DG:',
    [
      'Peristaltik',
      'Darmgeräusch',
      'DG',
    ]
  )
}