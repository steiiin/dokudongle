<template>
  <DodoContainerCard :title="`${ctx.isTrauma ? 'x' : ''}ABCDE`" card-in-card>

    <AbcdeBleedingCard v-show="ctx.isTrauma" />
    <AbcdeAirwayCard />
    <AbcdeBreathingCard />
    <AbcdeCirculationCard />
    <AbcdeDisabilityCard />
    <AbcdeExposureCard />

  </DodoContainerCard>
</template>

<script setup lang="ts">

import AbcdeBleedingCard from './abcde/AbcdeBleedingCard.vue'
import AbcdeAirwayCard from './abcde/AbcdeAirwayCard.vue'
import AbcdeBreathingCard from './abcde/AbcdeBreathingCard.vue'
import AbcdeCirculationCard from './abcde/AbcdeCirculationCard.vue'
import AbcdeDisabilityCard from './abcde/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from './abcde/AbcdeExposureCard.vue'

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
