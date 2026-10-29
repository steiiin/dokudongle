import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type { SchwindelBlockSourceState, SchwindelDetails } from '@/types/blocks/schwindel'
import { concatDoku, prefix } from '@/utils/text'
import { prefixSeit } from '@/utils/prefix/general'

interface SchwindelOption {
  label: string
  color: string
  value?: string
  prep?: string
}

export const provocationOptions: readonly SchwindelOption[] = [
  { label: 'Kopfbewegung',  color: 'primary', prep: 'bei' },
  { label: 'Lagewechsel',   color: 'primary', prep: 'bei' },
  { label: 'Aufstehen',     color: 'primary', prep: 'beim' },
  { label: 'Gehen',         color: 'success', prep: 'beim' },
  { label: 'Belastung',     value: 'körperl. Belastung', prep: 'bei', color: 'success' },
]

export const palliationOptions: readonly SchwindelOption[] = [
  { label: 'Ruhe',           value: 'ruhig liegen', color: 'primary', prep: 'beim' },
  { label: 'Augen zu',       value: 'Augen schließen', color: 'primary', prep: 'beim' },
  { label: 'Punkt fixieren', value: 'Fixieren eines Punkts', color: 'primary', prep: 'bei' },
]

export const qualityOptions: readonly SchwindelOption[] = [
  { label: 'Drehschwindel',    color: 'primary' },
  { label: 'Schwankschwindel', color: 'primary' },
  { label: 'Liftgefühl',       color: 'warning' },
]

export const radiationOptions: readonly SchwindelOption[] = [
  { label: 'Ohrgeräusche',      color: 'primary' },
  { label: 'Hörminderung',      color: 'primary' },
  { label: 'Druck im Ohr',      color: 'primary' },
  { label: 'Nystagmus',         color: 'warning' },
]

export const timeOptions: readonly SchwindelOption[] = [
  { label: 'Erstmalig',       value: 'erstmalig',                     color: 'primary' },
  { label: 'Früher Ähnlich',  value: 'bereits ähnlich aufgetreten',   color: 'warning' },
  { label: 'Wiederholt',      value: 'bereits mehrfach aufgetreten',  color: 'warning' },
  { label: 'Zunehmend',       value: 'stetig zunehmend',              color: 'success' },
  { label: 'Gleichbleibend',  value: 'gleichbleibend',                color: 'success' },
]

export const severityOptions = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'leicht', label: 'Leicht' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'stark', label: 'Stark' },
  { value: 'maximal', label: 'Maximal' },
]

const severityDescriptions = {
  minimal: 'minimal, kaum beeinträchtigt',
  leicht: 'leicht, gehfähig',
  mittel: 'mittel, unsicher beim Gehen',
  stark: 'stark, nur mit Hilfe gehfähig',
  maximal: 'maximal, nicht steh-/gehfähig',
}

export function createSchwindelBlockState(): SchwindelBlockSourceState {
  return {
    values: {},
    active: { 'schwindel.symptoms': true },
    details: {
      onset: '', onspan: '', provocation: [], palliation: [], quality: [],
      radiation: [], severity: '', time: [],
    },
  }
}

function joinWithAnd(values: string[]): string {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} & ${values[values.length - 1]}`
}

function modifiersText(selected: string[], options: readonly SchwindelOption[], suffix: string): string {
  const groups: Record<string, string[]> = {}
  for (const entry of options.filter(entry => selected.includes(entry.label))) {
    if (!entry.prep) continue
    ;(groups[entry.prep] ??= []).push(entry.value ?? entry.label)
  }
  const singlePrep = Object.keys(groups).length <= 1
  const segments = Object.entries(groups).map(([prep, values]) =>
    `${prep} ${singlePrep ? joinWithAnd(values) : values.join(', ')}`)
  return segments.length ? `${segments.join(' & ')} ${suffix}` : ''
}

export function renderSchwindelText(details: SchwindelDetails): string {
  const selected = (options: readonly SchwindelOption[], values: string[]) =>
    options.filter(entry => values.includes(entry.label)).map(entry => entry.value ?? entry.label)
  const severity = details.severity ? severityDescriptions[details.severity] : ''
  return prefix('Schwindel:', concatDoku([
    selected(qualityOptions, details.quality),
    severity ? `Intensität ${severity}` : '',
    [prefixSeit(details.onspan), details.onset],
    modifiersText(details.provocation, provocationOptions, 'schlimmer'),
    modifiersText(details.palliation, palliationOptions, 'besser'),
    prefix('zusätzlich', joinWithAnd(selected(radiationOptions, details.radiation))),
    selected(timeOptions, details.time).join(', '),
  ]))
}

/** Computes its template value at render time; only the structured details are persisted. */
export class SchwindelTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('schwindel.symptoms', 'schwindel', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: SchwindelBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderSchwindelText(state.details) } })
  }
}
