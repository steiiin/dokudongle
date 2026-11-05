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

function selectedSubstances(details: IntoxicationDetails) {
  return intoxicationSubstances.flatMap(({ value, label }) => {
    const substance = details.substances[value]
    const name = value === 'other' ? details.otherName.trim() : label
    return substance.enabled && name ? [{ name, ...substance }] : []
  })
}

export function renderIntoxicationSummary(details: IntoxicationDetails): string {
  return selectedSubstances(details).map(substance =>
    `${substance.basis === 'suspected' ? 'Vd. ' : ''}${substance.name}`).join(' / ')
}

export function renderIntoxicationText(details: IntoxicationDetails): string {
  return selectedSubstances(details).map(substance => {
    const basis = intoxicationBasisOptions.find(option => option.value === substance.basis)!.label
    const reasons = substance.reasons.map(reason => reason.trim()).filter(Boolean).join(', ')
    const extra = substance.basis === 'suspected' && reasons ? `Hinweise: ${reasons}`
      : substance.basis === 'confirmed' && substance.amount.trim() ? `Menge: ${substance.amount.trim()}` : ''
    const text = `${substance.name}: ${basis}${extra ? `; ${extra}` : ''}`
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
