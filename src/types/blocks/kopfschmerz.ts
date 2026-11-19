import type { TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export interface KopfschmerzDetails {
  onset: '' | 'schlagartig' | 'allmählich'
  peak: '' | 'sofort' | 'innerhalb von 5 Minuten' | 'später'
  location: string[]
  side: '' | 'links' | 'rechts' | 'beidseits'
  quality: string[]
  severity: '' | 'minimal' | 'leicht' | 'mittel' | 'stark' | 'maximal'
  progression: '' | 'zunehmend' | 'gleichbleibend' | 'abnehmend'
  pattern: '' | 'anhaltend' | 'attackenartig'
  provocation: string[]
}

export interface KopfschmerzBlockSourceState extends TextAreaBlockSourceState {
  details: KopfschmerzDetails
}
