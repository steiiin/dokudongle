import { conditionalPrefix } from "../filter"

/**
 * Stellt Befunden zur Ausstrahlung von Thoraxschmerzen „strahlen aus“ voran, sofern der Entwurf noch keines der Schlüsselwörter enthält.
 */
export const prefixChestpainRadiation = (draft: string): string => {
  return conditionalPrefix(draft, 'strahlen aus:', [
    'strahl'
  ])
}

/**
 * Stellt EKG-Befunden „EKG“ voran, sofern der Entwurf noch keines der Schlüsselwörter enthält.
 */
export function prefixEcg(draft: string): string {
  return conditionalPrefix(draft, 'EKG:', [
      'Ekg',
  ])
}
