<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Aufgaben</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <TreatmentTasksCard />
      <TreatmentMedicationsCard />
      <TreatmentInformedConsentCard />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import TreatmentInformedConsentCard from './treatmentCards/TreatmentInformedConsentCard.vue'
import TreatmentMedicationsCard from './treatmentCards/TreatmentMedicationsCard.vue'
import TreatmentTasksCard from './treatmentCards/TreatmentTasksCard.vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
<style>

</style>
