<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>SAMPLE(R)</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

          <IonCard class="sample-symptoms">
            <IonCardHeader>
              <IonCardTitle>Symptome</IonCardTitle>
            </IonCardHeader>
            <IonCardContent class="card-in-card">

              <SampleSymptomsTrauma v-if="ctx.isTrauma" />
              <SampleSymptomsCard />

            </IonCardContent>
          </IonCard>
          <SampleAllergiesCard />
          <SampleMedicationsCard />
          <SamplePlerCard />
          <SampleContactsCard />


    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import SampleSymptomsTrauma from './sampleCards/SampleSymptomsTrauma.vue'
import SampleSymptomsCard from './sampleCards/SampleSymptomsCard.vue'
import SampleAllergiesCard from './sampleCards/SampleAllergiesCard.vue'
import SampleMedicationsCard from './sampleCards/SampleMedicationsCard.vue'
import SamplePlerCard from './sampleCards/SamplePlerCard.vue'
import SampleContactsCard from './sampleCards/SampleContactsCard.vue'

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
import SampleSymptoms from './sampleCards/SampleSymptomsCard.vue'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
<style scoped>

.sample-symptoms {
  --card-bg: #214e83;
}

</style>
