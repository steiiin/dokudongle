import { AssessedValue } from '@/types/protocol/input'
import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type { KopfschmerzBlockSourceState, KopfschmerzDetails } from '@/types/blocks/kopfschmerz'
import { concatDoku, prefix } from '@/utils/text'
import { prefixSeit } from '@/utils/prefix/general'

export const locationOptions = ['Stirn', 'Schläfe', 'Hinterkopf', 'hinter dem Auge', 'gesamter Kopf'] as const
export const WOUND_LOCATION = 'Im Wundbereich'
export const qualityOptions = ['drückend', 'pulsierend–pochend', 'stechend'] as const
export const provocationOptions = ['körperliche Belastung', 'Husten–Pressen', 'Lagewechsel'] as const
export const accompanyingOptions = ['Übelkeit', 'Erbrechen', 'Lichtempfindlichkeit', 'Geräuschempfindlichkeit', 'Nackenschmerz'] as const

export function createKopfschmerzBlockState(): KopfschmerzBlockSourceState {
  return {
    values: {},
    active: { 'kopfschmerz.symptoms': true },
    details: {
      onspan: '', onset: '', peak: '', location: [], side: '', quality: [],
      severity: AssessedValue.unassessed(0), progression: '', pattern: '',
      provocation: [], accompanying: [],
    },
  }
}

export function renderKopfschmerzText(details: KopfschmerzDetails): string {
  const selected = (options: readonly string[], values: string[]) =>
    options.filter(option => values.includes(option)).join(', ')
  const severity = details.severity
  return prefix('Kopfschmerzen:', concatDoku([
    [prefixSeit(details.onspan), details.onset === 'schlagartig' ? 'schlagartiger Beginn'
      : details.onset === 'allmählich' ? 'allmählicher Beginn' : ''],
    details.onset === 'schlagartig' && details.peak ? `Schmerzmaximum ${details.peak} erreicht` : '',
    prefix('Lokalisation:', selected([...locationOptions, WOUND_LOCATION], details.location)),
    details.side,
    selected(qualityOptions, details.quality),
    severity.isAssessed && Number.isInteger(severity.value) && severity.value >= 0 && severity.value <= 10
      ? `NRS ${severity.value}/10` : '',
    [details.progression, details.pattern],
    prefix('Verstärkung/Auslösung:', selected(provocationOptions, details.provocation)),
    prefix('Begleitsymptome:', selected(accompanyingOptions, details.accompanying)),
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
