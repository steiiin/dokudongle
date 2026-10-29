import type { AssessedValue } from '@/types/protocol/input'
import type { TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export interface SchwangerschaftTerm {
  approx: string
  date: string
}

export interface SchwangerschaftDetails {
  gravida: AssessedValue<number>
  para: AssessedValue<number>
  presentation: '' | 'SL' | 'BEL' | 'QL'
  amnioticFluid: string
  childCount: string
  calculatedTerm: SchwangerschaftTerm
}

export interface SchwangerschaftBlockSourceState extends TextAreaBlockSourceState {
  details: SchwangerschaftDetails
}
