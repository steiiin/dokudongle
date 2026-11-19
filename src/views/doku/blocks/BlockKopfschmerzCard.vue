<template>
  <DodoItemModal label="Kopfschmerzen" modal-label="Kopfschmerzen" :state="hasDetails ? '' : 'Keine Angabe'">
    <template v-if="$slots.trigger" #trigger="{ open }">
      <slot name="trigger" :open="open" />
    </template>

    <IonItemDivider><IonLabel>Beginn</IonLabel></IonItemDivider>
    <DodoInputSelect label="Seit wann?" v-model="details.onspan" empty-label="Keine Angabe"
      :options="['seit Stunden', 'seit Tagen', 'seit Wochen', 'seit Gestern']"
      allow-custom custom-label="" custom-placeholder="z.B. heute früh" />
    <DodoInputSelect label="Beginn" v-model="onset" empty-label="Keine Angabe"
      :options="[{ value: 'schlagartig', label: 'Schlagartig' }, { value: 'allmählich', label: 'Allmählich' }]" />
    <DodoInputSelect v-if="details.onset === 'schlagartig'" label="Schmerzmaximum erreicht"
      v-model="details.peak" empty-label="Keine Angabe"
      :options="[
        { value: 'sofort', label: 'Sofort' },
        { value: 'innerhalb von 5 Minuten', label: 'Innerhalb von 5 Minuten' },
        { value: 'später', label: 'Später' },
      ]" />

    <IonItemDivider><IonLabel>Lokalisation</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in locationOptions" :key="entry" color="primary"
          :model-value="details.location.includes(entry)"
          @update:model-value="toggleLocation(entry, $event)">{{ entry }}</DodoToggleChip>
        <DodoToggleChip v-if="store.context.isTrauma" color="warning"
          :model-value="details.location.includes(WOUND_LOCATION)"
          @update:model-value="toggleLocation(WOUND_LOCATION, $event)">{{ WOUND_LOCATION }}</DodoToggleChip>
      </div>
    </IonItem>
    <DodoInputSelect label="Seite" v-model="details.side" empty-label="Keine Angabe"
      :options="[{ value: 'links', label: 'Links' }, { value: 'rechts', label: 'Rechts' }, { value: 'beidseits', label: 'Beidseits' }]" />

    <IonItemDivider><IonLabel>Charakter</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in qualityOptions" :key="entry" color="primary"
          :model-value="details.quality.includes(entry)"
          @update:model-value="toggleSelection('quality', entry, $event)">{{ entry }}</DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider><IonLabel>Stärke</IonLabel></IonItemDivider>
    <IonItem><DodoInputNumber label="NRS 0–10" v-model="details.severity" :min="0" :max="10" /></IonItem>

    <IonItemDivider><IonLabel>Verlauf</IonLabel></IonItemDivider>
    <DodoInputSelect label="Entwicklung" v-model="details.progression" empty-label="Keine Angabe"
      :options="[
        { value: 'zunehmend', label: 'Zunehmend' }, { value: 'gleichbleibend', label: 'Gleichbleibend' },
        { value: 'abnehmend', label: 'Abnehmend' },
      ]" />
    <DodoInputSelect label="Zeitmuster" v-model="details.pattern" empty-label="Keine Angabe"
      :options="[{ value: 'anhaltend', label: 'Anhaltend' }, { value: 'attackenartig', label: 'Attackenartig' }]" />

    <IonItemDivider><IonLabel>Verstärkung / Auslösung</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in provocationOptions" :key="entry" color="primary"
          :model-value="details.provocation.includes(entry)"
          @update:model-value="toggleSelection('provocation', entry, $event)">{{ entry }}</DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider><IonLabel>Begleitsymptome</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in accompanyingOptions" :key="entry" color="primary"
          :model-value="details.accompanying.includes(entry)"
          @update:model-value="toggleSelection('accompanying', entry, $event)">{{ entry }}</DodoToggleChip>
      </div>
    </IonItem>
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDokuStore } from '@/store/doku'
import type { KopfschmerzDetails } from '@/types/blocks/kopfschmerz'
import {
  locationOptions, WOUND_LOCATION, qualityOptions, provocationOptions, accompanyingOptions, renderKopfschmerzText,
} from '@/data/blocks/kopfschmerz'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.kopfschmerz.details)
const hasDetails = computed(() => Boolean(renderKopfschmerzText(details.value).trim()))
const onset = computed({
  get: () => details.value.onset,
  set: (value: KopfschmerzDetails['onset']) => {
    details.value.onset = value
    if (value !== 'schlagartig') details.value.peak = ''
  },
})

function toggleSelection(field: 'location' | 'quality' | 'provocation' | 'accompanying', label: string, enabled: boolean) {
  const values = details.value[field].filter(value => value !== label)
  details.value[field] = enabled ? [...values, label] : values
}

function toggleLocation(label: string, enabled: boolean) {
  if (enabled) {
    details.value.location = label === 'gesamter Kopf' || label === WOUND_LOCATION
      ? [] : details.value.location.filter(value => value !== 'gesamter Kopf' && value !== WOUND_LOCATION)
  }
  toggleSelection('location', label, enabled)
}
</script>

<style scoped>
.chip-container {
  padding-top: .5rem;
  padding-bottom: .5rem;
}
</style>
