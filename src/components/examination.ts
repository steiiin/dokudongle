import type { FunctionalComponent, InjectionKey } from 'vue'

export interface ExaminationRegistration {
  readonly id: string
  readonly assessed: boolean
  readonly available: boolean
  picker: FunctionalComponent
  select: () => void
  activate: () => void
}

export interface ExaminationCardContext {
  register: (item: ExaminationRegistration) => () => void
  focusAddButton: () => Promise<void>
}

export const examinationCardKey: InjectionKey<ExaminationCardContext> = Symbol('examination-card')
