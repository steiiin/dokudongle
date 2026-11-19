import type { AssessedValue } from '@/types/protocol/input'
import type { TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export interface KopfschmerzDetails {
  onspan: string
  onset: '' | 'schlagartig' | 'allmählich'
  peak: '' | 'sofort' | 'innerhalb von 5 Minuten' | 'später'
  location: string[]
  side: '' | 'links' | 'rechts' | 'beidseits'
  quality: string[]
  severity: AssessedValue<number>
  progression: '' | 'zunehmend' | 'gleichbleibend' | 'abnehmend'
  pattern: '' | 'anhaltend' | 'attackenartig'
  provocation: string[]
  accompanying: string[]
}

export interface KopfschmerzBlockSourceState extends TextAreaBlockSourceState {
  details: KopfschmerzDetails
}
