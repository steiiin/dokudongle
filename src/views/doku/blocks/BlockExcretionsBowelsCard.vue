<template>
  <DodoItemModal label="Stuhlgang" modal-label="Stuhlgang" :state="hasDetails ? '' : 'Keine Angabe'">
    <IonItemDivider>
      <IonLabel>Beschaffenheit</IonLabel>
    </IonItemDivider>
    <DodoInputSelect
      v-model="details.pattern"
      label="Frequenz" lines="inset"
      :options="bowelPatternOptions">
    </DodoInputSelect>
    <DodoInputSelect
      v-model="details.consistency"
      label="Konsistenz" lines="inset"
      :options="bowelConsistencyOptions">
    </DodoInputSelect>
    <DodoInputTextOptional lines="none"
      toggle-label="Letzten Stuhlgang erfassen?" v-model:toggle="details.lastBowel.active"
      text-label="Wann?" text-placeholder="z.B. 2d" v-model:text="details.lastBowel.value">
    </DodoInputTextOptional>

    <IonItemDivider>
      <IonLabel>Anomalien</IonLabel>
    </IonItemDivider>
    <DodoInputSelect
      v-model="details.blood"
      label="Blut" lines="inset"
      :options="bowelBloodOptions">
    </DodoInputSelect>
    <DodoInputToggle lines="inset" v-model="details.bowelPain">
      Schmerzhafter Stuhlgang?
    </DodoInputToggle>
    <DodoInputSelect
      v-model="details.bowelSounds"
      label="Darmgeräusche" lines="none"
      :options="bowelSoundsOptions">
    </DodoInputSelect>
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDokuStore } from '@/store/doku'
import {
  bowelPatternOptions, bowelConsistencyOptions, bowelBloodOptions, bowelSoundsOptions,
  renderExcretionsBowelsText,
} from '@/data/blocks/excretions'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.excretions_bowel.details)
const hasDetails = computed(() => Boolean(renderExcretionsBowelsText(details.value).trim()))

watch(() => details.value.pattern, value => {
  if (value === 'Durchfall' && !['breiig', 'wässrig'].includes(details.value.consistency)) {
    details.value.consistency = 'breiig'
  }
})

watch(() => details.value.consistency, value => {
  if (value === 'kügelchenförmig' || value === 'hartlaibig') {
    details.value.pattern = 'Obstipation'
  } else if (value === 'breiig' || value === 'wässrig') {
    details.value.pattern = 'Durchfall'
  }
})
</script>
