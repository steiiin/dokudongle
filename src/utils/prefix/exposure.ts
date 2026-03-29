import { conditionalPrefix } from "../filter";

/**
 * Prepends stool observations with "Stuhl" when no keyword is present yet.
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
 * Adds the "Schmerzen" prefix to abdominal pain descriptions when no keyword is present.
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
 * Ensures peristalsis notes start with the "DG" prefix unless already mentioned.
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