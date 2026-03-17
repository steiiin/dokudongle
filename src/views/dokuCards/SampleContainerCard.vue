<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>SAMPLE(R)</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <SampleAllergiesCard />
      <SampleMedicationsCard />
      <SamplePlerCard />
      <SampleContactsCard />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import SampleAllergiesCard from './sampleCards/SampleAllergiesCard.vue'
import SampleMedicationsCard from './sampleCards/SampleMedicationsCard.vue'
import SamplePlerCard from './sampleCards/SamplePlerCard.vue'
import SampleContactsCard from './sampleCards/SampleContactsCard.vue'

</script>
<style>

</style>
