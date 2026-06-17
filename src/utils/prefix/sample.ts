import { conditionalPrefix } from "../filter";

/**
 * Prepends with "Allergie" when no keyword is present yet.
 */
export function prefixAllergie(draft: string): string {
  return conditionalPrefix(draft, 'Allergie:', [
      'Allergie',
    ]
  )
}
