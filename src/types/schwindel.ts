import type { TextAreaBlockSourceState } from '@/types/text-area-block'

export interface SchwindelDetails {
  onset: '' | 'plötzlicher Beginn' | 'schleichender Beginn'
  onspan: string
  provocation: string[]
  palliation: string[]
  quality: string[]
  radiation: string[]
  severity: '' | 'minimal' | 'leicht' | 'mittel' | 'stark' | 'maximal'
  time: string[]
}

export interface SchwindelBlockSourceState extends TextAreaBlockSourceState {
  details: SchwindelDetails
}
