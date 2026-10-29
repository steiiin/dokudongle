<template>
  <IonCard>
    <IonCardHeader v-if="title">
      <IonCardTitle>{{ title }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <DodoInputSaatreats :model-value="store.doku.saatreats.selectedIds" @update:model-value="saveSelection" />
      <DodoInputSaamed v-model="store.doku.saamed.medTasks" />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()

const title = computed(() => {
  const hasProcedures = store.doku.saatreats.selectedIds.length > 0
  const hasMedications = store.doku.saamed.medTasks.length > 0
  if (hasProcedures && hasMedications) return 'Invasiv+Medikamente'
  if (hasProcedures) return 'Invasive'
  if (hasMedications) return 'Medikamente'
  return ''
})

const saveSelection = (ids: string[]) => {
  store.doku.saatreats.selectedIds = ids
  if (ids.length > 0 && store.doku.redflags.consent === '') {
    store.doku.redflags.consent = 'Fähig'
  }
}

watch(() => store.doku.saamed.medTasks.length, (length) => {
  if (length > 0 && store.doku.redflags.consent === '') {
    store.doku.redflags.consent = 'Fähig'
  }
})
</script>
