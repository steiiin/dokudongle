import type { TextAreaBlockSourceState } from './text-area-block'

export type IntoxicationSubstance = 'alcohol' | 'cannabis' | 'opioids' | 'amphetamine'
  | 'methamphetamine' | 'ecstasy' | 'cocaine' | 'other'
export type IntoxicationBasis = 'suspected' | 'positive' | 'confirmed'

export interface IntoxicationSubstanceDetails {
  enabled: boolean
  basis: IntoxicationBasis
  reasons: string[]
  amount: string
}

export interface IntoxicationDetails {
  substances: Record<IntoxicationSubstance, IntoxicationSubstanceDetails>
  otherName: string
}

export interface IntoxicationBlockSourceState extends TextAreaBlockSourceState {
  details: IntoxicationDetails
}
