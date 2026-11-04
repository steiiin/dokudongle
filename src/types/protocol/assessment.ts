export type AssessmentIntent = 'auto' | 'active' | 'inactive'

export interface NonVerbalProtocol {
  flavors: { non_verbal: boolean }
  xAbcde: { isBreathing: boolean }
  xabcDe: { avpu: string; gcs: { v: number } }
}

// Rohwerte lesen, niemals den context-Getter: Die Beurteilung fließt ebenfalls in diesen Getter ein.
export function isNonVerbalProtocol(protocol: NonVerbalProtocol): boolean {
  return protocol.flavors.non_verbal
    || !protocol.xAbcde.isBreathing
    || protocol.xabcDe.avpu === 'bewusstlos'
    || protocol.xabcDe.avpu === 'soporös'
    || protocol.xabcDe.gcs.v < 4
}

export function assessmentActive(intent: AssessmentIntent, protocol: NonVerbalProtocol): boolean {
  return intent === 'active' || (intent === 'auto' && !isNonVerbalProtocol(protocol))
}

export function assessmentDefaults<K extends string>(...keys: K[]): Record<K, AssessmentIntent> {
  return Object.fromEntries(keys.map(key => [key, 'auto'])) as Record<K, AssessmentIntent>
}
