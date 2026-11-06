<template>
  <div v-if="suggestions.length || hasSnippetStart" class="dd-suggestion-panel"
    :role="suggestions.length ? 'listbox' : undefined" aria-label="Textvorschläge">
    <button
      v-if="!suggestions.length && hasSnippetStart"
      type="button"
      class="dd-suggestion"
      :class="{ 'dd-ripple-surface': rippleEnabled, 'ion-activatable': rippleEnabled && canStartSnippet }"
      aria-label="Textbaustein einfügen"
      :disabled="!canStartSnippet"
      @pointerdown.prevent
      @click="emit('start-snippet')"
    >
      @
      <IonRippleEffect v-if="rippleEnabled && canStartSnippet" aria-hidden="true" />
    </button>
    <button
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      type="button"
      class="dd-suggestion"
      :class="{ 'dd-ripple-surface ion-activatable': rippleEnabled }"
      role="option"
      @pointerdown.prevent
      @click="selectSuggestion(suggestion)"
    >
      {{ suggestion.label }}
      <IonRippleEffect v-if="rippleEnabled" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonRippleEffect } from '@ionic/vue'
import { isMaterialMode } from '@/utils/ripple'
import type { TextSuggestion } from '@/services/text-assist'

const rippleEnabled = isMaterialMode()

defineProps<{
  suggestions: TextSuggestion[]
  hasSnippetStart?: boolean
  canStartSnippet?: boolean
}>()

const emit = defineEmits<{
  (event: 'select', suggestion: TextSuggestion): void
  (event: 'start-snippet'): void
}>()

const selectSuggestion = (suggestion: TextSuggestion) => emit('select', suggestion)
</script>

<style scoped>
.dd-suggestion-panel {
  display: flex;
  gap: 0.35rem;
  width: 100%;
  min-height: 48px;
  padding: 4px 8px;
  overflow-x: auto;
  border-top: 1px solid var(--ion-color-step-200, #333);
  background: var(--ion-toolbar-background, var(--ion-background-color));
  scrollbar-width: none;
  justify-content: center;
}

.dd-suggestion-panel::-webkit-scrollbar {
  display: none;
}

.dd-suggestion {
  flex: 0 0 auto;
  min-height: 40px;
  max-width: min(72vw, 320px);
  padding: 0.4rem 0.75rem;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: var(--ion-color-step-100, #262626);
  color: inherit;
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  touch-action: manipulation;
}

.dd-suggestion:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 1px;
}

.dd-suggestion:disabled {
  opacity: 0.5;
}
</style>
