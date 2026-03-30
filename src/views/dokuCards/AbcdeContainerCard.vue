<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'x' : '' }}ABCDE</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <AbcdeBleedingCard v-show="ctx.isTrauma" />
      <AbcdeAirwayCard />
      <AbcdeBreathingCard />
      <AbcdeCirculationCard />
      <AbcdeDisabilityCard />
      <AbcdeExposureCard />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import AbcdeBleedingCard from './abcdeCards/AbcdeBleedingCard.vue'
import AbcdeAirwayCard from './abcdeCards/AbcdeAirwayCard.vue'
import AbcdeBreathingCard from './abcdeCards/AbcdeBreathingCard.vue'
import AbcdeCirculationCard from './abcdeCards/AbcdeCirculationCard.vue'
import AbcdeDisabilityCard from './abcdeCards/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from './abcdeCards/AbcdeExposureCard.vue'

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
