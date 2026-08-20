<template>
  <div v-if="suggestions.length" class="dd-suggestion-panel" role="listbox" aria-label="Textvorschläge">
    <button
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      type="button"
      class="dd-suggestion"
      role="option"
      @pointerdown.prevent
      @click="selectSuggestion(suggestion)"
    >
      {{ suggestion.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TextSuggestion } from '@/services/text-assist'

defineProps<{ suggestions: TextSuggestion[] }>()

const emit = defineEmits<{
  (event: 'select', suggestion: TextSuggestion): void
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
</style>
