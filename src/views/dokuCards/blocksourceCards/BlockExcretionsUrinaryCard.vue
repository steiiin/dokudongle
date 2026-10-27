<template>
  <DodoItemModal label="Wasserlassen" modal-label="Wasserlassen" :state="hasDetails ? '' : 'Keine Angabe'">
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
        <DodoToggleChip v-for="entry in urinaryOutputOptions" :key="entry.label"
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
        <DodoToggleChip v-for="entry in urinaryPainOptions" :key="entry.label"
          :model-value="details.pain.includes(entry.label)"
          @update:model-value="toggleSelection('pain', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider>
      <IonLabel>Anomalien</IonLabel>
    </IonItemDivider>
    <DodoInputSelect
      v-model="details.hematuria"
      label="Blut im Urin" lines="inset"
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
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDokuStore } from '@/store/doku'
import {
  catheterIssuesOptions, hematuriaOptions, urinaryOutputOptions, urinaryPainOptions, urinaryAnomaliesOptions,
  renderExcretionsUrinaryText,
} from '@/data/excretions'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.excretions_urinary.details)
const hasDetails = computed(() => Boolean(renderExcretionsUrinaryText(details.value).trim()))

function toggleSelection(field: 'output' | 'pain' | 'anomalies', label: string, enabled: boolean) {
  let values = details.value[field].filter(value => value !== label)
  if (enabled && field === 'pain') {
    if (label === 'Nierenklopfschmerz') values = values.filter(value => value !== 'Nierenlager Frei')
    if (label === 'Nierenlager Frei') values = values.filter(value => value !== 'Nierenklopfschmerz')
  }
  details.value[field] = enabled ? [...values, label] : values
}
</script>

<style scoped>
.chip-container {
  padding-top: .5rem;
  padding-bottom: .5rem;
}
</style>
