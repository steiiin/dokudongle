import type { OptionalValue } from '@/types/protocol/input'
import type { TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export type BowelBloodFinding = 'paper' | 'on_stool' | 'mixed' | 'without_stool' | 'clots'

export interface ExcretionsBowelsDetails {
  pattern: '' | 'Obstipation' | 'Durchfall'
  consistency: '' | 'kügelchenförmig' | 'hartlaibig' | 'geformt' | 'breiig' | 'wässrig'
  lastBowel: OptionalValue<string>
  bowelSounds: '' | 'normal' | 'vermehrt' | 'vermindert' | 'fehlend' | 'hochgestellt'
  blood: BowelBloodFinding[]
  bloodAmount: string
  bloodColor: '' | 'hellrot' | 'dunkelrot' | 'schwarz'
  mucus: boolean
  bowelPain: boolean
}

export interface ExcretionsUrinaryDetails {
  catheterIssues: '' | 'disloziert' | 'gezogen' | 'verstopft'
  output: string[]
  pain: string[]
  hematuria: '' | 'minimal Blut im Urin' | 'etwas Blut im Urin' | 'viel Blut im Urin'
  anomalies: string[]
}

export interface ExcretionsBowelsBlockSourceState extends TextAreaBlockSourceState {
  details: ExcretionsBowelsDetails
}

export interface ExcretionsUrinaryBlockSourceState extends TextAreaBlockSourceState {
  details: ExcretionsUrinaryDetails
}
