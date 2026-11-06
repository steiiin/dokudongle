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

export interface SnippetStartAction {
  enabled: ComputedRef<boolean>
  start(): void
}

export interface TextSuggestionScope {
  suggestions: ComputedRef<TextSuggestion[]>
  hasSnippetStart: ComputedRef<boolean>
  canStartSnippet: ComputedRef<boolean>
  activate(owner: TextSuggestionOwner, select: (suggestion: TextSuggestion) => void, snippetStart?: SnippetStartAction): void
  update(owner: TextSuggestionOwner, suggestions: TextSuggestion[]): void
  clear(owner: TextSuggestionOwner): void
  reset(): void
  select(suggestion: TextSuggestion): void
  startSnippet(): void
}

interface ActiveTextSuggestions {
  owner: TextSuggestionOwner
  suggestions: TextSuggestion[]
  select: (suggestion: TextSuggestion) => void
  snippetStart?: SnippetStartAction
}

const textSuggestionScopeKey: InjectionKey<TextSuggestionScope> = Symbol('text-suggestion-scope')

export const provideTextSuggestionScope = (): TextSuggestionScope => {
  const active = shallowRef<ActiveTextSuggestions | null>(null)

  const scope: TextSuggestionScope = {
    suggestions: computed(() => active.value?.suggestions ?? []),
    hasSnippetStart: computed(() => !!active.value?.snippetStart),
    canStartSnippet: computed(() => active.value?.snippetStart?.enabled.value ?? false),
    activate(owner, select, snippetStart) {
      active.value = { owner, suggestions: [], select, snippetStart }
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
    startSnippet() {
      if (scope.canStartSnippet.value && !scope.suggestions.value.length) {
        active.value?.snippetStart?.start()
      }
    },
  }

  provide(textSuggestionScopeKey, scope)
  return scope
}

export const useTextSuggestionScope = (): TextSuggestionScope | null =>
  inject(textSuggestionScopeKey, null)
