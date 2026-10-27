import { TextAreaBlock } from '@/types/text-area-block'
import { OptionalValue } from '@/types/protocol/input'
import type {
  ExcretionsBowelsBlockSourceState, ExcretionsBowelsDetails,
  ExcretionsUrinaryBlockSourceState, ExcretionsUrinaryDetails,
} from '@/types/excretions'
import { concatDoku, prefix } from '@/utils/text'
import { prefixVor } from '@/utils/prefix/general'

interface ExcretionsOption {
  label: string
  color: string
  value?: string
}

export const bowelPatternOptions = [
  { value: '', label: 'Nicht erfasst' },
  { value: 'Obstipation', label: 'Obstipation' },
  { value: 'Durchfall', label: 'Durchfall' },
]

export const bowelConsistencyOptions = [
  { value: '', label: 'Nicht erfasst' },
  { value: 'kügelchenförmig', label: 'Kügelchen' },
  { value: 'hartlaibig', label: 'Hart' },
  { value: 'geformt', label: 'Geformt' },
  { value: 'breiig', label: 'Breiig' },
  { value: 'wässrig', label: 'Wässrig' },
]

export const bowelBloodOptions = [
  { value: '', label: 'kein Blut' },
  { value: 'Blut am Klopapier', label: 'Am Klopapier' },
  { value: 'Blut im Stuhl', label: 'Im Stuhl' },
  { value: 'Teerstuhl', label: 'Teerstuhl' },
]

export const bowelSoundsOptions = [
  { value: '', label: 'Nicht erfasst' },
  { value: 'normal', label: 'Normal' },
  { value: 'vermehrt', label: 'Vermehrt' },
  { value: 'vermindert', label: 'Vermindert' },
  { value: 'fehlend', label: 'Fehlend' },
  { value: 'hochgestellt', label: 'Hochgestellt' },
]

export const catheterIssuesOptions = [
  { value: '', label: 'Keine' },
  { value: 'disloziert', label: 'Disloziert' },
  { value: 'gezogen', label: 'Gezogen' },
  { value: 'verstopft', label: 'Verstopft' },
]

export const hematuriaOptions = [
  { value: '', label: 'Kein' },
  { value: 'minimal Blut im Urin', label: 'Minimal' },
  { value: 'etwas Blut im Urin', label: 'Etwas' },
  { value: 'viel Blut im Urin', label: 'Viel' },
]

export const urinaryOutputOptions: readonly ExcretionsOption[] = [
  { label: 'Verringert',   color: 'warning', value: 'verringerte Ausfuhr' },
  { label: 'Harnverhalt',  color: 'warning' },
  { label: 'Harndrang',    color: 'success', value: 'ständinger Harndrang' },
  { label: 'Erschwert',    color: 'success', value: 'erschwert' },
]

export const urinaryPainOptions: readonly ExcretionsOption[] = [
  { label: 'Brennen',                   value: 'Brennen beim Wasserlassen', color: 'primary' },
  { label: 'Flankenschmerz',            color: 'primary' },
  { label: 'Nierenklopfschmerz',        color: 'success' },
  { label: 'Nierenlager Frei',          value: 'Nierenlager frei', color: 'success' },
]

export const urinaryAnomaliesOptions: readonly ExcretionsOption[] = [
  { label: 'Dunkel', value: 'dunkler', color: 'warning' },
  { label: 'Trübe', value: 'trüber', color: 'warning' },
  { label: 'Flockig', value: 'flockiger', color: 'warning' },
  { label: 'Überriechend', value: 'übel riechender', color: 'warning' },
]

export function createExcretionsBowelsBlockState(): ExcretionsBowelsBlockSourceState {
  return {
    values: {},
    active: { 'excretions_bowel.symptoms': true },
    details: {
      pattern: '', consistency: '', lastBowel: OptionalValue.inactive(''),
      bowelSounds: '', blood: '', bowelPain: false,
    },
  }
}

export function createExcretionsUrinaryBlockState(): ExcretionsUrinaryBlockSourceState {
  return {
    values: {},
    active: { 'excretions_urinary.symptoms': true },
    details: { catheterIssues: '', output: [], pain: [], hematuria: '', anomalies: [] },
  }
}

export function renderExcretionsBowelsText(details: ExcretionsBowelsDetails): string {
  return prefix('Stuhlgang:', concatDoku([
    [
      details.pattern,
      details.consistency,
      details.lastBowel.isActive ? prefix('zuletzt', prefixVor(details.lastBowel.value)) : '',
    ],
    [details.blood, details.bowelPain ? 'schmerzhafter Stuhlgang' : ''],
    prefix('DG', details.bowelSounds),
  ]))
}

export function renderExcretionsUrinaryText(details: ExcretionsUrinaryDetails): string {
  const selected = (options: readonly ExcretionsOption[], values: string[]) =>
    options.filter(entry => values.includes(entry.label)).map(entry => entry.value ?? entry.label).join(', ')
  const anomalies = selected(urinaryAnomaliesOptions, details.anomalies)
  return prefix('Wasserlassen:', concatDoku([
    details.catheterIssues,
    selected(urinaryOutputOptions, details.output),
    selected(urinaryPainOptions, details.pain),
    anomalies ? `${anomalies} Urin` : '',
    details.hematuria,
  ]))
}

export class ExcretionsBowelsTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('excretions_bowel.symptoms', 'excretions_bowel', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: ExcretionsBowelsBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderExcretionsBowelsText(state.details) } })
  }
}

export class ExcretionsUrinaryTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('excretions_urinary.symptoms', 'excretions_urinary', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: ExcretionsUrinaryBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderExcretionsUrinaryText(state.details) } })
  }
}
