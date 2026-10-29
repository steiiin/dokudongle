import type { TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export type BauchschmerzRegion = Record<
  'obli' | 'obmi' | 'obre' | 'mbli' | 'mbmi' | 'mbre' | 'ubli' | 'ubmi' | 'ubre', boolean
>

export interface BauchschmerzDetails {
  region: BauchschmerzRegion
  onset: '' | 'plötzlicher Beginn' | 'schleichender Beginn'
  onspan: string
  provocation: string[]
  palliation: string[]
  quality: string[]
  radiation: string[]
  severity: '' | 'minimal' | 'leicht' | 'mittel' | 'stark' | 'maximal'
  time: string[]
}

export interface BauchschmerzBlockSourceState extends TextAreaBlockSourceState {
  details: BauchschmerzDetails
}
