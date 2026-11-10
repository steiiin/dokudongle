<template>
  <component :is="form.component" v-if="available">
    <template #trigger="{ open }">
      <button type="button" class="dd-block-source-shortcut" :data-block-source="source"
        :aria-label="`${form.label} bearbeiten`" :title="`${form.label} bearbeiten`"
        @click.stop.prevent="open($event.currentTarget as HTMLElement)"
        @pointerdown.stop @pointerup.stop @keydown.stop @keyup.stop>
        <IonIcon :icon="openOutline" color="medium" aria-hidden="true" />
      </button>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { openOutline } from 'ionicons/icons'
import { TEXT_AREA_BLOCK_SOURCES } from '@/data/blocks/text-area-blocks'
import { useDokuStore } from '@/store/doku'
import BlockSchwangerschaftCard from '@/views/doku/blocks/BlockSchwangerschaftCard.vue'
import BlockSchwindelCard from '@/views/doku/blocks/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '@/views/doku/blocks/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '@/views/doku/blocks/BlockExcretionsUrinaryCard.vue'
import BlockBauchschmerzCard from '@/views/doku/blocks/BlockBauchschmerzCard.vue'

const forms = {
  schwangerschaft: { component: BlockSchwangerschaftCard, label: 'Schwangerschaft' },
  schwindel: { component: BlockSchwindelCard, label: 'Schwindel' },
  excretions_bowel: { component: BlockExcretionsBowelsCard, label: 'Stuhlgang' },
  excretions_urinary: { component: BlockExcretionsUrinaryCard, label: 'Wasserlassen' },
  bauchschmerz: { component: BlockBauchschmerzCard, label: 'Bauchschmerzen' },
} as const

const props = defineProps<{ source: keyof typeof forms }>()
const store = useDokuStore()
const form = computed(() => forms[props.source])
const available = computed(() =>
  (props.source === 'schwangerschaft' || store.context.requireSampleSymptoms)
  && TEXT_AREA_BLOCK_SOURCES.find(source => source.id === props.source)!.isAvailable(store.doku))
</script>

<style scoped>
.dd-block-source-shortcut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-inline-start: .25rem;
  padding: .25rem;
  min-width: 1.75rem;
  min-height: 1.75rem;
  border: 0;
  border-radius: .25rem;
  background: transparent;
  /* Ionic select labels disable pointer events; their action must remain clickable. */
  pointer-events: auto;
  cursor: pointer;
}
.dd-block-source-shortcut ion-icon { font-size: 1.1rem; }
.dd-block-source-shortcut:focus-visible {
  outline: 2px solid var(--ion-color-medium);
  outline-offset: 1px;
}
</style>
