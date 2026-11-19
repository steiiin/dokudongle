import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type { SchwindelBlockSourceState, SchwindelDetails } from '@/types/blocks/schwindel'
import { capitalizeBegin, concatDoku, prefix } from '@/utils/text'
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
  { label: 'Belastung',     value: 'körperlicher Belastung', prep: 'bei', color: 'success' },
]

export const palliationOptions: readonly SchwindelOption[] = [
  { label: 'Ruhe',           value: 'ruhiger Liegeposition', color: 'primary', prep: 'in' },
  { label: 'Augen zu',       value: 'Schließen der Augen', color: 'primary', prep: 'beim' },
  { label: 'Punkt fixieren', value: 'Fixieren eines Punkts', color: 'primary', prep: 'beim' },
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
  minimal: { adjective: 'minimal', description: ', kaum beeinträchtigt' },
  leicht: { adjective: 'leicht', description: ', gehfähig' },
  mittel: { adjective: 'mittelstark', description: ' mit Gangunsicherheit' },
  stark: { adjective: 'stark', description: ', nur mit Hilfe gehfähig' },
  maximal: { adjective: 'maximal ausgeprägt', description: ', nicht steh- oder gehfähig' },
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
  return `${values.slice(0, -1).join(', ')} und ${values[values.length - 1]}`
}

function modifiersText(selected: string[], options: readonly SchwindelOption[], heading: string): string {
  const groups: { prep: string; values: string[] }[] = []
  for (const entry of options.filter(entry => selected.includes(entry.label))) {
    if (!entry.prep) continue
    const previous = groups[groups.length - 1]
    // Nur benachbarte Präpositionen bündeln, damit die Optionsreihenfolge erhalten bleibt.
    if (previous?.prep === entry.prep) previous.values.push(entry.value ?? entry.label)
    else groups.push({ prep: entry.prep, values: [entry.value ?? entry.label] })
  }
  return prefix(heading, joinWithAnd(groups.map(({ prep, values }) => `${prep} ${joinWithAnd(values)}`)))
}

function qualityText(qualities: string[], severity: SchwindelDetails['severity']): string {
  if (!severity) return joinWithAnd(qualities)
  const { adjective, description } = severityDescriptions[severity]
  const nouns = qualities.length ? qualities : ['Schwindel']
  return joinWithAnd(nouns.map(noun => `${adjective}${noun === 'Liftgefühl' ? 'es' : 'er'} ${noun}`)) + description
}

export function renderSchwindelText(details: SchwindelDetails): string {
  const selected = (options: readonly SchwindelOption[], values: string[]) =>
    options.filter(entry => values.includes(entry.label)).map(entry => entry.value ?? entry.label)
  const quality = qualityText(selected(qualityOptions, details.quality), details.severity)
  const text = concatDoku([
    quality,
    [prefixSeit(details.onspan), details.onset],
    modifiersText(details.provocation, provocationOptions, 'Verstärkung'),
    modifiersText(details.palliation, palliationOptions, 'Besserung'),
    prefix('zusätzlich', joinWithAnd(selected(radiationOptions, details.radiation))),
    selected(timeOptions, details.time).join(', '),
  ])
  // Nur die strukturierte Symptomangabe liefert verlässlich den Kontext.
  return /\b(?:Dreh|Schwank)?schwindel\b/i.test(quality)
    ? capitalizeBegin(text)
    : prefix('Schwindel:', text)
}

/** Berechnet den Vorlagenwert beim Rendern; nur die strukturierten Angaben werden gespeichert. */
export class SchwindelTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('schwindel.symptoms', 'schwindel', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: SchwindelBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderSchwindelText(state.details) } })
  }
}
