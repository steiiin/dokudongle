import { conditionalPrefix } from "../filter"

/**
 * Stellt „Parese“ voran, wenn der Entwurf noch kein passendes Schlüsselwort enthält.
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
 * Stellt Angaben zu Parästhesien „Parästhesie“ voran, wenn noch kein Schlüsselwort vorhanden ist.
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
 * Stellt Angaben zur Sensibilität „Sensibilität“ voran, wenn noch kein Schlüsselwort vorhanden ist.
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
 * Stellt Angaben zu Intoxikationen „Intox“ voran, wenn noch kein passendes Schlüsselwort vorhanden ist.
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