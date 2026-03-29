import { conditionalPrefix } from "../filter"

/**
 * Adds a "Parese" prefix when the draft does not already include a matching keyword.
 */
export function prefixParesis(draft: string): string {
  return conditionalPrefix(draft, 'Parese:', [
      'Parese',
      'Lähmung',
      'Plegie',
  ])
}

/**
 * Ensures paraesthesia notes are prefixed with "Parästhesie" if no keyword is present.
 */
export function prefixParaesthesis(draft: string): string {
  return conditionalPrefix(draft, 'Parästhesie:', [
      'Paraesthesie',
      'Parästhesie',
      'Kribbeln',
      'Missempfindung',
  ])
}


/**
 * Adds an "Intox" prefix to intoxication notes if no matching keyword is present.
 */
export function prefixIntox(draft: string): string {
  return conditionalPrefix(draft, 'Intox:',
    [
      'Intox',
      'Vergift',
      'Überdosis',
    ]
  )
}