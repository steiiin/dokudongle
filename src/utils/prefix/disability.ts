import { conditionalPrefix } from "../filter"

/**
 * Adds a "Parese" prefix when the draft does not already include a matching keyword.
 */
export function prefixParesis(draft: string): string {
  return conditionalPrefix(draft, 'Parese:', [
      'parese',
      'paretisch',
      'lähm',
      'laehm',
      'plegie',
      'plegisch',
  ])
}

/**
 * Ensures paraesthesia notes are prefixed with "Parästhesie" if no keyword is present.
 */
export function prefixParaesthesis(draft: string): string {
  return conditionalPrefix(draft, 'Parästhesie:', [
      'parästhes',
      'kribbel',
      'missempfind',
      'ameisenlauf',
      'ameisenkribbel',
      'pelzig',
  ])
}

/**
 * Ensures sensibility notes are prefixed with "Sensibilität" if no keyword is present.
 */
export function prefixSensibility(draft: string): string {
  return conditionalPrefix(draft, 'Sensibilitätsstörung:', [
      'taub',
      'sensibilität',
      'hypästhes',
      'hyperästhes',
      'gefühllos',
      'gefühlsstör',
      'empfindungsstör',
  ])
}


/**
 * Adds an "Intox" prefix to intoxication notes if no matching keyword is present.
 */
export function prefixIntox(draft: string): string {
  return conditionalPrefix(draft, 'Intox:',
    [
      'intox',
      'vergift',
      'überdos',
    ]
  )
}