<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>SAA Medikamente</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSaamed v-model="store.doku.consent.medTasks" />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

watch(() => store.doku.consent.medTasks.length, (length) => {
  if (length > 0 && store.doku.redflags.Consent === '') {
    store.doku.redflags.Consent = 'Fähig'
  }
})

</script>
<style scoped>

</style>
