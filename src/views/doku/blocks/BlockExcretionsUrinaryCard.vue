<template>
  <DodoItemModal label="Wasserlassen" modal-label="Wasserlassen" :state="hasDetails ? '' : 'Keine Angabe'">
    <template v-if="$slots.trigger" #trigger="{ open }">
      <slot name="trigger" :open="open" />
    </template>
    <template v-if="store.doku.xabcdE.excretions.value.catheterType != ''">

      <IonItemDivider>
        <IonLabel>Katheter</IonLabel>
      </IonItemDivider>
      <DodoInputSelect
        v-model="details.catheterIssues"
        label="Komplikation" lines="none"
        :options="catheterIssuesOptions">
      </DodoInputSelect>

    </template>

    <IonItemDivider>
      <IonLabel>Ausfuhr</IonLabel>
    </IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in outputOptions" :key="entry.label"
          :model-value="details.output.includes(entry.label)"
          @update:model-value="toggleSelection('output', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider>
      <IonLabel>Beschwerden</IonLabel>
    </IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in painOptions" :key="entry.label"
          :model-value="details.pain.includes(entry.label)"
          @update:model-value="toggleSelection('pain', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <template v-if="!hasRetention">
      <IonItemDivider>
        <IonLabel>Anomalien</IonLabel>
      </IonItemDivider>
      <DodoInputSelect
        v-model="details.hematuria"
        label="Blut im Urin" lines="full"
        :options="hematuriaOptions">
      </DodoInputSelect>
      <IonItem>
        <div class="chip-container">
          <DodoToggleChip v-for="entry in urinaryAnomaliesOptions" :key="entry.label"
            :model-value="details.anomalies.includes(entry.label)"
            @update:model-value="toggleSelection('anomalies', entry.label, $event)" :color="entry.color">{{ entry.label }}
          </DodoToggleChip>
        </div>
      </IonItem>
    </template>
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDokuStore } from '@/store/doku'
import {
  catheterIssuesOptions, hematuriaOptions, urinaryOutputOptions, urinaryPainOptions, urinaryAnomaliesOptions,
  normalizeUrinaryDetails, renderExcretionsUrinaryText,
} from '@/data/blocks/excretions'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.excretions_urinary.details)
const hasDetails = computed(() => Boolean(renderExcretionsUrinaryText(details.value).trim()))
const hasRetention = computed(() => details.value.output.includes('Harnverhalt'))
const outputOptions = computed(() => urinaryOutputOptions.filter(entry => {
  if (entry.label === 'Harnverhalt') return !details.value.output.some(value => value === 'Verringert' || value === 'Erschwert')
  if (entry.label === 'Verringert' || entry.label === 'Erschwert') return !hasRetention.value
  return true
}))
const painOptions = computed(() => urinaryPainOptions.filter(entry => {
  if (entry.label === 'Nierenklopfschmerz') return !details.value.pain.includes('Nierenlager Frei')
  if (entry.label === 'Nierenlager Frei') return !details.value.pain.includes('Nierenklopfschmerz')
  return true
}))

watch(details, currentDetails => {
  Object.assign(currentDetails, normalizeUrinaryDetails(currentDetails))
}, { immediate: true, deep: true })

function toggleSelection(field: 'output' | 'pain' | 'anomalies', label: string, enabled: boolean) {
  let values = details.value[field].filter(value => value !== label)
  if (enabled && field === 'output' && (label === 'Verringert' || label === 'Erschwert')) {
    values = values.filter(value => value !== 'Harnverhalt')
  }
  Object.assign(details.value, normalizeUrinaryDetails({
    ...details.value, [field]: enabled ? [...values, label] : values,
  }))
}
</script>

<style scoped>
.chip-container {
  padding-top: .5rem;
  padding-bottom: .5rem;
}
</style>
