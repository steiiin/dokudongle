import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type {
  IntoxicationBasis, IntoxicationBlockSourceState, IntoxicationDetails,
  IntoxicationSubstance, IntoxicationSubstanceDetails,
} from '@/types/blocks/intoxikation'

export const intoxicationSubstances: readonly { value: IntoxicationSubstance; label: string }[] = [
  { value: 'alcohol', label: 'Alkohol' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'opioids', label: 'Opioide' },
  { value: 'amphetamine', label: 'Amphetamin' },
  { value: 'methamphetamine', label: 'Methamphetamin' },
  { value: 'ecstasy', label: 'Ecstasy' },
  { value: 'cocaine', label: 'Kokain' },
  { value: 'other', label: 'Sonstige' },
]

export const intoxicationBasisOptions: readonly { value: IntoxicationBasis; label: string }[] = [
  { value: 'suspected', label: 'Verdacht' },
  { value: 'positive', label: 'Test positiv' },
  { value: 'confirmed', label: 'Konsum bestätigt' },
]

const generalReasons = ['Fremdanamnestischer Hinweis', 'Substanz aufgefunden', 'Konsumutensilien aufgefunden']
const stimulantReasons = [
  ['Mydriasis', 'Tachykardie', 'Schwitzen'],
  ['Unruhe', 'Hyperthermie', 'Krampfanfälle'],
  generalReasons,
]

// Dokumentationsvorschläge, keine automatische Befund- oder Diagnoseableitung.
// https://pmc.ncbi.nlm.nih.gov/articles/PMC10096213/
// https://www.msdmanuals.com/professional/injuries-poisoning/poisoning/general-principles-of-poisoning
export const intoxicationReasonRows: Record<IntoxicationSubstance, readonly (readonly string[])[]> = {
  alcohol: [['Alkoholgeruch', 'Verwaschene Sprache', 'Gangunsicherheit'], ['Enthemmung', 'Vigilanzminderung'], generalReasons],
  cannabis: [['Gerötete Augen', 'Mundtrockenheit', 'Tachykardie'], ['Verlangsamte Reaktion', 'Angst', 'Unruhe'], generalReasons],
  opioids: [['Miosis', 'Atemdepression', 'Vigilanzminderung'], ['Verwaschene Sprache', 'Psychomotorische Verlangsamung'], generalReasons],
  amphetamine: stimulantReasons,
  methamphetamine: stimulantReasons,
  ecstasy: stimulantReasons,
  cocaine: stimulantReasons,
  other: [generalReasons],
}

export function createIntoxicationSubstanceDetails(): IntoxicationSubstanceDetails {
  return { enabled: false, basis: 'suspected', reasons: [], amount: '' }
}

export function createIntoxicationBlockState(): IntoxicationBlockSourceState {
  return {
    values: {},
    active: { 'intoxikation.pler': true },
    details: {
      substances: Object.fromEntries(intoxicationSubstances.map(({ value }) =>
        [value, createIntoxicationSubstanceDetails()])) as IntoxicationDetails['substances'],
      otherName: '',
    },
  }
}

function groupedSubstances(details: IntoxicationDetails) {
  const selected = intoxicationSubstances.flatMap(({ value, label }) => {
    const substance = details.substances[value]
    const name = value === 'other' ? details.otherName.trim() : label
    return substance.enabled && name ? [{ key: value, name, ...substance }] : []
  })
  const established = selected.filter(substance => substance.basis !== 'suspected')
  const suspected = selected.filter(substance => substance.basis === 'suspected')
  return {
    substances: [...established, ...suspected],
    summary: [
      established.map(substance => substance.name).join('+'),
      suspected.length ? `Vd. ${suspected.map(substance => substance.name).join('+')}` : '',
    ].filter(Boolean).join(' / '),
  }
}

export function renderIntoxicationSummary(details: IntoxicationDetails): string {
  return groupedSubstances(details).summary
}

const substanceAbbreviations: Record<Exclude<IntoxicationSubstance, 'other'>, string> = {
  alcohol: 'Alk.', cannabis: 'Cann.', opioids: 'Op.', amphetamine: 'Amph.',
  methamphetamine: 'Methamph.', ecstasy: 'Ecst.', cocaine: 'Kok.',
}

export function renderIntoxicationText(details: IntoxicationDetails): string {
  const { substances } = groupedSubstances(details)
  const groups: { basis: IntoxicationBasis; extra: string; names: string[]; abbreviations: string[] }[] = []
  for (const substance of substances) {
    const extra = substance.basis === 'suspected'
      ? substance.reasons.map(reason => reason.trim()).filter(Boolean).join(', ')
      : substance.basis === 'positive' ? 'Test positiv' : substance.amount.trim() || 'Konsum bestätigt'
    if (!extra) continue
    const abbreviation = substance.key === 'other' ? substance.name : substanceAbbreviations[substance.key]
    const group = groups.find(group => group.basis === substance.basis && group.extra === extra)
    if (group) {
      group.names.push(substance.name)
      group.abbreviations.push(abbreviation)
    } else {
      groups.push({ basis: substance.basis, extra, names: [substance.name], abbreviations: [abbreviation] })
    }
  }
  if (groups.length > 1) {
    const compact = `Intox: ${groups.map(group => `${group.extra} (${group.abbreviations.join('+')})`).join('; ')}.`
    if (compact.length <= 80 && !/[\r\n\u2028\u2029]/.test(compact)) return compact
  }
  return groups.map(group => {
    const text = `${group.names.join('+')}: ${group.extra}`
    return /[.!?]$/.test(text) ? text : `${text}.`
  }).join('\n')
}

export class IntoxicationTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('intoxikation.pler', 'intoxikation', 'sampler.pler.PLER', '<TEXT>', [{ key: 'TEXT' }], false, 'warning')
  }

  override render(state: IntoxicationBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderIntoxicationText(state.details) } })
  }
}
