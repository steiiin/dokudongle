import {
  computed,
  inject,
  provide,
  shallowRef,
  type ComputedRef,
  type InjectionKey,
} from 'vue'

import type { TextSuggestion } from '@/services/text-assist'

export type TextSuggestionOwner = symbol

export interface TextSuggestionScope {
  suggestions: ComputedRef<TextSuggestion[]>
  activate(owner: TextSuggestionOwner, select: (suggestion: TextSuggestion) => void): void
  update(owner: TextSuggestionOwner, suggestions: TextSuggestion[]): void
  clear(owner: TextSuggestionOwner): void
  reset(): void
  select(suggestion: TextSuggestion): void
}

interface ActiveTextSuggestions {
  owner: TextSuggestionOwner
  suggestions: TextSuggestion[]
  select: (suggestion: TextSuggestion) => void
}

const textSuggestionScopeKey: InjectionKey<TextSuggestionScope> = Symbol('text-suggestion-scope')

export const provideTextSuggestionScope = (): TextSuggestionScope => {
  const active = shallowRef<ActiveTextSuggestions | null>(null)

  const scope: TextSuggestionScope = {
    suggestions: computed(() => active.value?.suggestions ?? []),
    activate(owner, select) {
      active.value = { owner, suggestions: [], select }
    },
    update(owner, suggestions) {
      if (active.value?.owner !== owner) return
      active.value = { ...active.value, suggestions }
    },
    clear(owner) {
      if (active.value?.owner === owner) active.value = null
    },
    reset() {
      active.value = null
    },
    select(suggestion) {
      active.value?.select(suggestion)
    },
  }

  provide(textSuggestionScopeKey, scope)
  return scope
}

export const useTextSuggestionScope = (): TextSuggestionScope | null =>
  inject(textSuggestionScopeKey, null)
