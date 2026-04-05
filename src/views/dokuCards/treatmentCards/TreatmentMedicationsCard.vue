<template>
  <IonCard v-if="lazy.treatment.medications">
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

import { useLazyStore } from '@/store/lazy'
import { laptop } from 'ionicons/icons'
const lazy = useLazyStore()

// ############################################################################

watch(() => store.doku.saamed.medTasks.length, (length) => {
  if (length > 0 && store.doku.redflags.consent === '') {
    store.doku.redflags.consent = 'Fähig'
  }
})

</script>
