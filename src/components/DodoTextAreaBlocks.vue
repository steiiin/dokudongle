<template>
  <div class="dd-textarea-blocks">
    <button v-for="block in blocks" :key="block.id" type="button" class="dd-textarea-block"
      :class="{ 'is-inactive': !block.active }" :style="{ '--block-color': resolveColor(block.color) }"
      :aria-pressed="block.active"
      :aria-label="`${block.active ? 'Deaktivieren' : 'Aktivieren'}: ${block.text}`"
      @click="$emit('activation-change', block.id, !block.active)">
      <span class="dd-textarea-block-text">{{ block.text }}</span>
      <IonIcon class="dd-textarea-block-toggle" :icon="block.active ? eyeOutline : eyeOffOutline" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import type { RenderedTextAreaBlock } from '@/types/text-area-block'

defineProps<{ blocks: readonly RenderedTextAreaBlock[] }>()
defineEmits<{ (e: 'activation-change', id: string, active: boolean): void }>()

const resolveColor = (color: string) => /^(#|rgb|hsl|var\()/.test(color)
  ? color : `var(--ion-color-${color})`
</script>

<style scoped>
.dd-textarea-blocks { display: grid; gap: 0.5rem; }
.dd-textarea-block {
  display: flex;
  align-items: center;
  gap: .5rem;
  width: 100%;
  padding: .5rem .5rem .5rem .75rem;
  border: 0;
  border-radius: 0 .5rem .5rem 0;
  border-inline-start: 2px solid var(--block-color);
  background: color-mix(in srgb, var(--block-color) 18%, var(--ion-background-color, white));
  color: var(--ion-text-color, #222);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.dd-textarea-block-text { flex: 1; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.dd-textarea-block.is-inactive {
  background: color-mix(in srgb, var(--ion-color-medium) 12%, var(--ion-background-color, white));
  border-color: var(--ion-color-medium);
}
.is-inactive .dd-textarea-block-text { opacity: 0.55; }
.dd-textarea-block-toggle {
  flex: none;
  font-size: 1.5rem;
}
.dd-textarea-block:focus-visible { outline: 2px solid var(--block-color); outline-offset: 2px; }
</style>
