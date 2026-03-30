<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>SAA Medikamente</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSaamed v-model="store.doku.saamed.medTasks" />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

watch(() => store.doku.saamed.medTasks.length, (length) => {
  if (length > 0 && store.doku.redflags.consent === '') {
    store.doku.redflags.consent = 'Fähig'
  }
})

</script>
