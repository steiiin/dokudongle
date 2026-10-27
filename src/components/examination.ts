import type { FunctionalComponent, InjectionKey } from 'vue'

export type ExaminationPreset = 'positive' | 'negative'

export interface ExaminationRegistration {
  readonly id: string
  readonly label: string
  readonly assessed: boolean
  readonly available: boolean
  readonly assessedPresets: boolean
  readonly pickerSeparatorAfter?: boolean
  picker: FunctionalComponent
  select: (preset?: ExaminationPreset) => void
  focus: () => void
  activate: () => void
}

export interface ExaminationCardContext {
  register: (item: ExaminationRegistration) => () => void
  focusAddButton: () => Promise<void>
}

export const examinationCardKey: InjectionKey<ExaminationCardContext> = Symbol('examination-card')
