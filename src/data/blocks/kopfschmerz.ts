import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type { KopfschmerzBlockSourceState, KopfschmerzDetails } from '@/types/blocks/kopfschmerz'
import { concatDoku, prefix } from '@/utils/text'
import { severityOptions } from '@/data/blocks/bauchschmerz'

export const locationOptions = ['Stirn', 'Schläfe', 'Hinterkopf', 'hinter dem Auge', 'gesamter Kopf'] as const
export const WOUND_LOCATION = 'Im Wundbereich'
export const qualityOptions = ['drückend', 'pulsierend–pochend', 'stechend'] as const
export const provocationOptions = ['körperliche Belastung', 'Husten–Pressen', 'Lagewechsel'] as const
export const progressionOptions = [
  { value: 'zunehmend', label: 'Zunehmend' },
  { value: 'gleichbleibend', label: 'Gleichbleibend' },
  { value: 'abnehmend', label: 'Abnehmend' },
] as const
export const patternOptions = [
  { value: 'anhaltend', label: 'Anhaltend' },
  { value: 'attackenartig', label: 'Attackenartig' },
] as const

/** Übernimmt auch die früher gespeicherte numerische NRS in die gemeinsame Schmerzskala. */
export function normalizeKopfschmerzSeverity(input: unknown): KopfschmerzDetails['severity'] {
  if (typeof input === 'string') {
    return severityOptions.some(option => option.value === input) ? input as KopfschmerzDetails['severity'] : ''
  }
  if (!input || typeof input !== 'object' || !('assessed' in input) || input.assessed !== true
    || !('value' in input) || typeof input.value !== 'number'
    || !Number.isInteger(input.value) || input.value < 0 || input.value > 10) return ''
  const value = input.value
  return value <= 1 ? 'minimal' : value <= 3 ? 'leicht' : value <= 6 ? 'mittel' : value <= 8 ? 'stark' : 'maximal'
}

export function createKopfschmerzBlockState(): KopfschmerzBlockSourceState {
  return {
    values: {},
    active: { 'kopfschmerz.symptoms': true },
    details: {
      onset: '', peak: '', location: [], side: '', quality: [],
      severity: '', progression: '', pattern: '', provocation: [],
    },
  }
}

function joinWithAnd(values: string[]): string {
  return values.length < 2 ? values[0] ?? '' : `${values.slice(0, -1).join(', ')} und ${values[values.length - 1]}`
}

function renderLocation(details: KopfschmerzDetails): string {
  if (details.location.includes('gesamter Kopf')) return 'am gesamten Kopf'
  const bilateral = details.side === 'beidseits'
  const regions: [string, string, string][] = [
    ['Stirn', 'an der', 'Stirn'],
    ['Schläfe', bilateral ? 'an den' : 'an der', bilateral ? 'Schläfen' : 'Schläfe'],
    ['Hinterkopf', 'am', 'Hinterkopf'],
    ['hinter dem Auge', bilateral ? 'hinter den' : 'hinter dem', bilateral ? 'Augen' : 'Auge'],
    [WOUND_LOCATION, 'im', 'Wundbereich'],
  ]
  const groups = new Map<string, string[]>()
  for (const [location, prep, noun] of regions) {
    if (details.location.includes(location)) groups.set(prep, [...(groups.get(prep) ?? []), noun])
  }
  const location = joinWithAnd([...groups].map(([prep, nouns]) => `${prep} ${joinWithAnd(nouns)}`))
  return [details.side, location].filter(Boolean).join(' ')
}

export function renderKopfschmerzText(details: KopfschmerzDetails): string {
  const selected = (options: readonly string[], values: string[]) =>
    options.filter(option => values.includes(option)).join(', ')
  return prefix('Kopfschmerzen:', concatDoku([
    details.onset === 'schlagartig' ? 'schlagartiger Beginn' : '',
    details.onset === 'schlagartig' && details.peak ? `Schmerzmaximum ${details.peak} erreicht` : '',
    renderLocation(details),
    selected(qualityOptions, details.quality),
    normalizeKopfschmerzSeverity(details.severity),
    [details.progression, details.pattern],
    prefix('Verstärkung/Auslösung:', selected(provocationOptions, details.provocation)),
  ]))
}

/** Speichert strukturierte Angaben; die Ausgabe wird beim Rendern berechnet. */
export class KopfschmerzTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('kopfschmerz.symptoms', 'kopfschmerz', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: KopfschmerzBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderKopfschmerzText(state.details) } })
  }
}
