<template>
  <DodoItemModal label="Stuhlgang" modal-label="Stuhlgang" :state="hasDetails ? '' : 'Keine Angabe'">
    <template v-if="$slots.trigger" #trigger="{ open }">
      <slot name="trigger" :open="open" />
    </template>
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
    <DodoInputToggle lines="inset" v-model="details.mucus">
      Schleimbeimengungen
    </DodoInputToggle>
    <DodoInputTextOptional lines="none"
      toggle-label="Letzten Stuhlgang erfassen?" v-model:toggle="details.lastBowel.active"
      text-label="Wann?" text-placeholder="z.B. 2d" v-model:text="details.lastBowel.value">
    </DodoInputTextOptional>

    <IonItemDivider>
      <IonLabel>Anomalien</IonLabel>
    </IonItemDivider>
    <DodoInputSelectChips
      :model-value="details.blood"
      @update:model-value="updateBlood"
      label="Blut" lines="inset"
      empty-label="Kein Blut"
      :options="bloodOptions" />
    <template v-if="hasBloodGroup">
      <DodoInputSelect v-model="details.bloodAmount" label="Blutmenge" lines="inset"
        :options="bloodAmountOptions" empty-label="Nicht erfasst"
        allow-custom custom-option-label="Benutzerdefinierte Angabe"
        custom-label="Blutmenge" custom-placeholder="Menge angeben" />
      <DodoInputSelect v-model="details.bloodColor" label="Farbe" lines="inset"
        :options="bowelBloodColorOptions" empty-label="Nicht erfasst" />
    </template>
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
  bowelBloodAmountOptions, bowelBloodAmountWithoutStoolOptions,
  bowelBloodColorOptions, bowelBloodGroupOptions, hasBowelBloodGroup,
  normalizeBowelBleeding, renderExcretionsBowelsText,
} from '@/data/blocks/excretions'
import type { BowelBloodFinding } from '@/types/blocks/excretions'
import type { SelectValue } from '@/components/inputs/DodoInputSelect.vue'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.excretions_bowel.details)
const hasDetails = computed(() => Boolean(renderExcretionsBowelsText(details.value).trim()))
const hasBloodGroup = computed(() => hasBowelBloodGroup(details.value.blood))
const bloodAmountOptions = computed(() => details.value.blood.includes('without_stool')
  ? bowelBloodAmountWithoutStoolOptions : bowelBloodAmountOptions)
const bloodOptions = computed(() => hasBloodGroup.value
  ? [
    bowelBloodOptions[0],
    bowelBloodGroupOptions.filter(option => details.value.blood.includes(option.value)),
    [{ value: 'clots', label: 'Koagel' }],
  ] : bowelBloodOptions)

function updateBlood(values: SelectValue[]) {
  Object.assign(details.value, normalizeBowelBleeding({
    ...details.value, blood: values.map(String) as BowelBloodFinding[],
  }, details.value.blood))
}

watch([details, () => details.value.blood.slice()], ([currentDetails], [previousDetails, previousBlood]) => {
  // Beim Wechsel des Protokolls gelten dessen gespeicherte Angaben, keine Abwahl aus dem vorherigen Protokoll.
  Object.assign(currentDetails, normalizeBowelBleeding(currentDetails,
    currentDetails === previousDetails ? previousBlood : undefined))
}, { immediate: true })

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
