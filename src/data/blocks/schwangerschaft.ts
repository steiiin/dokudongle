import { AssessedValue } from '@/types/protocol/input'
import { PregnancySpan } from '@/types/protocol/pregnancy'
import { TextAreaBlock } from '@/types/blocks/text-area-block'
import type { SchwangerschaftBlockSourceState, SchwangerschaftDetails, SchwangerschaftTerm } from '@/types/blocks/schwangerschaft'
import { concatDoku, prefix } from '@/utils/text'

export function createSchwangerschaftBlockState(): SchwangerschaftBlockSourceState {
  return {
    values: {},
    active: { 'schwangerschaft.pler': true },
    details: {
      gravida: AssessedValue.unassessed(1),
      para: AssessedValue.unassessed(0),
      presentation: '', amnioticFluid: '', childCount: '',
      calculatedTerm: { approx: '', date: '' },
    },
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

export function pregnancyTermFromSpan(span: PregnancySpan | null): SchwangerschaftTerm {
  if (!span) return { approx: '', date: '' }
  if (span.isApproximate) return { approx: span.approx, date: '' }
  const date = span.calculatedTerm
  return {
    approx: span.approx,
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  }
}

export function pregnancySpanFromTerm(term: SchwangerschaftTerm): PregnancySpan | null {
  if (!term.approx && !term.date) return null
  try {
    if (term.approx) return new PregnancySpan(term.approx)
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(term.date)
    if (!match) return null
    const [, year, month, day] = match.map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
    return new PregnancySpan(date)
  } catch {
    return null
  }
}

export function renderSchwangerschaftText(details: SchwangerschaftDetails): string {
  const span = pregnancySpanFromTerm(details.calculatedTerm)
  const date = span?.calculatedTerm
  const termText = span && date
    ? span.isApproximate
      ? `Termin unklar, ca. ${span.approx}`
      : `SSW ${span.week}, errechneter Termin ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
    : ''
  return prefix('Schwangerschaft:', concatDoku([
    details.gravida.isAssessed || details.para.isAssessed
      ? `${details.gravida.isAssessed ? `G${details.gravida.value}` : 'G?'} ${details.para.isAssessed ? `P${details.para.value}` : 'P?'}`
      : '',
    details.childCount,
    [
      details.presentation ? `Kindslage ${details.presentation}` : '',
      details.amnioticFluid,
      termText,
    ],
  ]))
}

export class SchwangerschaftTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('schwangerschaft.pler', 'schwangerschaft', 'sampler.pler.PLER',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: SchwangerschaftBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderSchwangerschaftText(state.details) } })
  }
}
