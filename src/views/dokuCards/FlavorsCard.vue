<template>
  <ion-card>
    <ion-card-content>
      <ion-list style="padding: 0;">

        <ion-item lines="none" class="flavor-row" v-if="visibleFlavors.noEmergencyCall || visibleFlavors.verlegung || visibleFlavors.einweisung">

          <DodoToggleChip v-if="visibleFlavors.noEmergencyCall"
            :model-value="store.doku.flavors.no_emergency_call" color="primary"
            @update:modelValue="setFlavor('no_emergency_call', $event)">
            Fehlfahrt
          </DodoToggleChip>

          <DodoToggleChip v-if="visibleFlavors.verlegung"
            :model-value="store.doku.flavors.verlegung" color="primary"
            @update:modelValue="setFlavor('verlegung', $event)">
            Verlegung
          </DodoToggleChip>

          <DodoToggleChip v-if="visibleFlavors.einweisung"
            :model-value="store.doku.flavors.einweisung" color="primary"
            @update:modelValue="setFlavor('einweisung', $event)">
            Einweisung
          </DodoToggleChip>

        </ion-item>

        <ion-item lines="none" class="flavor-row" v-if="visibleFlavors.trauma || visibleFlavors.reanimation">

          <DodoToggleChip v-if="visibleFlavors.trauma"
            :model-value="store.doku.flavors.trauma" color="warning"
            @update:modelValue="setFlavor('trauma', $event)">
            Trauma
          </DodoToggleChip>

          <DodoToggleChip v-if="visibleFlavors.reanimation"
            :model-value="store.doku.flavors.reanimation" color="warning"
            @update:modelValue="setFlavor('reanimation', $event)">
            Reanimation
          </DodoToggleChip>

        </ion-item>
        <ion-item lines="none" class="flavor-row" v-if="visibleFlavors.nonVerbal">

          <DodoToggleChip
            :model-value="store.doku.flavors.non_verbal"color="success"
            @update:modelValue="setFlavor('non_verbal', $event)">
            Non-Verbal
          </DodoToggleChip>

        </ion-item>
      </ion-list>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

type FlavorKey = keyof typeof store.doku.flavors

const setFlavor = (key: FlavorKey, enabled: boolean) => {
  store.setFlavor(key, enabled)
}

// ############################################################################

const visibleFlavors = computed(() => {
  const isNoEmergencyCallSelected = store.doku.flavors.no_emergency_call
  const isVerlegungSelected = store.doku.flavors.verlegung
  const isEinweisungSelected = store.doku.flavors.einweisung
  const isReanimationSelected = store.doku.flavors.reanimation
  return {
    noEmergencyCall: !isVerlegungSelected && !isEinweisungSelected,
    verlegung: !isNoEmergencyCallSelected && !isEinweisungSelected,
    einweisung: !isNoEmergencyCallSelected && !isVerlegungSelected,
    trauma: !isNoEmergencyCallSelected && !isVerlegungSelected,
    reanimation: !isNoEmergencyCallSelected && !isVerlegungSelected,
    nonVerbal: !isNoEmergencyCallSelected && !isReanimationSelected,
  }
})

watch(() => store.doku.flavors.reanimation, (v) => {
  if (v) {
    store.doku.flavors.non_verbal = true
    store.doku.xAbcde.isBreathing = false
    store.doku.xabCde.skin.color = 'zyanotisch'
    store.doku.xabCde.skin.peripheralTemp = 'kühl'
    store.doku.xabCde.skin.centralTemp = 'kühl'
    store.doku.xabCde.pulse.peripheralStrength = 'nicht'
    store.doku.xabCde.pulse.centralStrength = 'nicht'
    store.doku.xabCde.pulse.rhythmic = false
    store.doku.xabcDe.avpu = 'bewusstlos'
    store.doku.xabcDe.gcs.a = 1
    store.doku.xabcDe.gcs.v = 1
    store.doku.xabcDe.gcs.m = 1
  } else {
    store.doku.flavors.non_verbal = false
  }
})

watch(() => store.doku.flavors.non_verbal, (v) => {
  if (v && store.doku.xabcDe.gcs.v == 5)
  {
    store.doku.xabcDe.gcs.v = 5
  }
})

</script>

<style scoped>

  .flavor-row {
    --min-height: unset;
    --inner-padding-end: 0;
    --padding-start: 0;
    --padding-end: 0;
    flex-wrap: wrap;
    gap: 8px;
  }

</style>
