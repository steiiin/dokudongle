<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'x' : '' }}ABCDE</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <AbcdeBleedingCard v-if="ctx.isTrauma" />
      <AbcdeAirwayCard />
      <AbcdeBreathingCard />
      <AbcdeCirculationCard />
      <AbcdeDisabilityCard />
      <AbcdeExposureCard />
      <AbcdeStuCard v-if="ctx.isTrauma" />

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
import AbcdeStuCard from './abcdeCards/AbcdeStuCard.vue'

import { computed, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>

<style>

</style>
