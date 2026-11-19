<template>
  <DodoItemModal label="Kopfschmerzen" modal-label="Kopfschmerzen" :state="hasDetails ? '' : 'Keine Angabe'">
    <template v-if="$slots.trigger" #trigger="{ open }">
      <slot name="trigger" :open="open" />
    </template>

    <IonItemDivider><IonLabel>Beginn</IonLabel></IonItemDivider>
    <DodoInputSelect label="Beginn" v-model="onset"
      :options="[{ value: 'allmählich', label: 'Allmählich / k.A.' }, { value: 'schlagartig', label: 'Schlagartig' }]" />
    <DodoInputSelect v-if="details.onset === 'schlagartig'" label="↳ Schmerzmaximum"
      v-model="details.peak"
      :options="[
        { value: 'sofort', label: 'Sofort' },
        { value: 'innerhalb von 5 Minuten', label: '<5min' },
        { value: 'später', label: '>5min' },
      ]" />

    <IonItemDivider><IonLabel>Lokalisation</IonLabel></IonItemDivider>
    <IonItem v-if="!wholeHead">
      <div class="chip-container">
        <DodoToggleChip v-if="details.side === 'beidseits'" color="success" :model-value="true"
          @update:model-value="details.side = ''">Beidseits</DodoToggleChip>
        <template v-else>
          <DodoToggleChip color="warning" :model-value="details.side === 'links'"
            @update:model-value="toggleSide('links', $event)">Links</DodoToggleChip>
          <DodoToggleChip color="warning" :model-value="details.side === 'rechts'"
            @update:model-value="toggleSide('rechts', $event)">Rechts</DodoToggleChip>
        </template>
      </div>
    </IonItem>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in visibleLocations" :key="entry" color="primary"
          :model-value="details.location.includes(entry)"
          @update:model-value="toggleLocation(entry, $event)">{{ entry === 'gesamter Kopf' ? 'Gesamter Kopf' : entry }}</DodoToggleChip>
        <DodoToggleChip v-if="store.context.isTrauma && !wholeHead" color="warning"
          :model-value="details.location.includes(WOUND_LOCATION)"
          @update:model-value="toggleLocation(WOUND_LOCATION, $event)">{{ WOUND_LOCATION }}</DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider><IonLabel>Charakter</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in qualityOptions" :key="entry" color="primary"
          :model-value="details.quality.includes(entry)"
          @update:model-value="toggleSelection('quality', entry, $event)">{{ entry }}</DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider><IonLabel>Stärke</IonLabel></IonItemDivider>
    <DodoInputSelect label="Schmerzen" v-model="details.severity" empty-label="Keine Angabe"
      :options="severityOptions" lines="none" />

    <IonItemDivider><IonLabel>Verlauf</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in visibleProgressions" :key="entry.value" color="primary"
          :model-value="details.progression === entry.value"
          @update:model-value="details.progression = $event ? entry.value : ''">{{ entry.label }}</DodoToggleChip>
      </div>
    </IonItem>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in visiblePatterns" :key="entry.value" color="success"
          :model-value="details.pattern === entry.value"
          @update:model-value="details.pattern = $event ? entry.value : ''">{{ entry.label }}</DodoToggleChip>
      </div>
    </IonItem>

    <IonItemDivider><IonLabel>Verstärkung / Auslösung</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in provocationOptions" :key="entry" color="primary"
          :model-value="details.provocation.includes(entry)"
          @update:model-value="toggleSelection('provocation', entry, $event)">{{ entry }}</DodoToggleChip>
      </div>
    </IonItem>

  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDokuStore } from '@/store/doku'
import { severityOptions } from '@/data/blocks/bauchschmerz'
import type { KopfschmerzDetails } from '@/types/blocks/kopfschmerz'
import {
  locationOptions, WOUND_LOCATION, qualityOptions, provocationOptions, progressionOptions, patternOptions, renderKopfschmerzText,
} from '@/data/blocks/kopfschmerz'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.kopfschmerz.details)
const hasDetails = computed(() => Boolean(renderKopfschmerzText(details.value).trim()))
const onset = computed({
  get: () => details.value.onset || 'allmählich',
  set: (value: KopfschmerzDetails['onset']) => {
    details.value.onset = value
    details.value.peak = value === 'schlagartig' ? 'sofort' : ''
  },
})

function toggleSelection(field: 'location' | 'quality' | 'provocation', label: string, enabled: boolean) {
  const values = details.value[field].filter(value => value !== label)
  details.value[field] = enabled ? [...values, label] : values
}

const wholeHead = computed(() => details.value.location.includes('gesamter Kopf'))
const visibleLocations = computed(() => locationOptions.filter(location => !wholeHead.value || location === 'gesamter Kopf'))
const visibleProgressions = computed(() => progressionOptions.filter(entry => !details.value.progression || entry.value === details.value.progression))
const visiblePatterns = computed(() => patternOptions.filter(entry => !details.value.pattern || entry.value === details.value.pattern))

function toggleSide(side: 'links' | 'rechts', enabled: boolean) {
  details.value.side = !enabled ? '' : details.value.side && details.value.side !== side ? 'beidseits' : side
}

function toggleLocation(label: string, enabled: boolean) {
  if (enabled) {
    if (label === 'gesamter Kopf') details.value.side = ''
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
