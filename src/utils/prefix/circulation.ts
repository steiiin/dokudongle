import { conditionalPrefix } from "../filter"

/**
 * Prefixes chestpain radiation findings with "strahlen aus" unless one of the keywords already exists in the draft.
 */
export const prefixChestpainRadiation = (draft: string): string => {
  return conditionalPrefix(draft, 'strahlen aus:', [
    'strahl'
  ])
}

/**
 * Prefixes EKG findings with "EKG" unless one of the keywords already exists in the draft.
 */
export function prefixEcg(draft: string): string {
  return conditionalPrefix(draft, 'EKG:', [
      'Ekg',
  ])
}
