<template>
  <IonItemDivider><IonLabel>Sgarbossa-Kriterien</IonLabel></IonItemDivider>
  <section class="sgarbossa" aria-label="Modifizierte Sgarbossa-Kriterien">
    <DodoInputToggle v-for="(criterion, index) in criteria" :key="criterion.title"
      class="sgarbossa-criterion ion-text-wrap" lines="full" :model-value="modelValue[index] === 'yes'"
      @update:model-value="$emit('answer', index as 0 | 1 | 2, $event ? 'yes' : 'no')">
      <span class="criterion-title">{{ criterion.title }}</span>
      <span class="criterion-description">{{ criterion.description }}</span>
    </DodoInputToggle>
  </section>
</template>

<script setup lang="ts">
import DodoInputToggle from '../DodoInputToggle.vue'
import type { CriterionAnswer, SgarbossaAnswers } from '@/types/protocol/abcde/ecg'
defineProps<{ modelValue: SgarbossaAnswers }>()
defineEmits<{ answer: [index: 0 | 1 | 2, value: CriterionAnswer] }>()
// Smith-modified criteria: ACC 2022 Expert Consensus, Table 1; doi:10.1016/j.jacc.2022.08.750.
// Any positive criterion suffices.
const criteria = [
  {
    title: 'Konkordante ST-Hebung',
    description: 'ST-Hebung in dieselbe Richtung wie der QRS-Hauptausschlag',
  },
  {
    title: 'Konkordante ST-Senkung',
    description: 'in V1–V3',
  },
  {
    title: 'Diskordante ST-Hebung',
    description: 'mit > 25 % der vorausgehenden S-Zacke',
  },
]
</script>

<style scoped>
.sgarbossa-criterion {
  --padding-top: .75rem;
  --padding-bottom: .75rem;
}

.criterion-title,
.criterion-description {
  display: block;
  white-space: normal;
  line-height: 1.4;
}

.criterion-title {
  font-weight: 500;
}

.criterion-description {
  margin-top: .25rem;
  color: var(--ion-color-medium);
  font-size: .8em;
}
</style>
