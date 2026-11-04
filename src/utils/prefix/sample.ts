import { conditionalPrefix } from "../filter";

/**
 * Stellt „Allergie“ voran, wenn noch kein Schlüsselwort vorhanden ist.
 */
export function prefixAllergie(draft: string): string {
  return conditionalPrefix(draft, 'Allergie:', [
      'Allergie',
    ]
  )
}
