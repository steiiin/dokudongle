<template>
  <DodoItemModal
    label="Bauchschmerz" modal-label="Bauchschmerz" :state="hasDetails ? '' : 'Keine Angabe'">

    <ion-item-divider>
      <ion-label>Region</ion-label>
    </ion-item-divider>

    <IonItem lines="inset">
      <IonLabel>Oberbauch</IonLabel>
      <DodoToggleChip v-model="details.region.obre" color="danger">Rechts</DodoToggleChip>
      <DodoToggleChip v-model="details.region.obmi" color="danger">Mitte</DodoToggleChip>
      <DodoToggleChip v-model="details.region.obli" color="danger">Links</DodoToggleChip>
    </IonItem>
    <IonItem lines="inset">
      <IonLabel>Mittelbauch</IonLabel>
      <DodoToggleChip v-model="details.region.mbre" color="warning">Rechts</DodoToggleChip>
      <DodoToggleChip v-model="details.region.mbmi" color="warning">Mitte</DodoToggleChip>
      <DodoToggleChip v-model="details.region.mbli" color="warning">Links</DodoToggleChip>
    </IonItem>
    <IonItem>
      <IonLabel>Unterbauch</IonLabel>
      <DodoToggleChip v-model="details.region.ubre" color="primary">Rechts</DodoToggleChip>
      <DodoToggleChip v-model="details.region.ubmi" color="primary">Mitte</DodoToggleChip>
      <DodoToggleChip v-model="details.region.ubli" color="primary">Links</DodoToggleChip>
    </IonItem>

    <ion-item-divider>
      <ion-label><b>O</b>nset</ion-label>
    </ion-item-divider>
    <DodoInputSelect label="Beginn" v-model="details.onset"
      empty-label="Keine Angabe"
      :options="[
        { value: 'plötzlicher Beginn', label: 'Plötzlich' },
        { value: 'schleichender Beginn', label: 'Schleichend' }
      ]">
    </DodoInputSelect>
    <DodoInputSelect label="Wann" v-model="details.onspan"
      empty-label="Keine Angabe"
      :options="[
        'seit Stunden', 'seit Tagen', 'seit Wochen', 'seit Gestern',
      ]"
      allow-custom custom-label="" custom-placeholder="z.B. heute früh">
    </DodoInputSelect>

    <ion-item-divider>
      <ion-label><b>P</b>rovokation <i>(Verschlechterung)</i></ion-label>
    </ion-item-divider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in provocationOptions" :key="entry.label"
          :model-value="details.provocation.includes(entry.label)"
          @update:model-value="toggleSelection('provocation', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <ion-item-divider>
      <ion-label><b>P</b>alliation <i>(Verbesserung)</i></ion-label>
    </ion-item-divider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in palliationOptions" :key="entry.label"
          :model-value="details.palliation.includes(entry.label)"
          @update:model-value="toggleSelection('palliation', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <ion-item-divider>
      <ion-label><b>Q</b>ualität</ion-label>
    </ion-item-divider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in qualityOptions" :key="entry.label"
          :model-value="details.quality.includes(entry.label)"
          @update:model-value="toggleSelection('quality', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <ion-item-divider>
      <ion-label><b>R</b>adiation</ion-label>
    </ion-item-divider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in radiationOptions" :key="entry.label"
          :model-value="details.radiation.includes(entry.label)"
          @update:model-value="toggleSelection('radiation', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

    <ion-item-divider>
      <ion-label><b>S</b>everity <i>(Schmerzskala)</i></ion-label>
    </ion-item-divider>
    <DodoInputSelect label="Schmerzen" empty-label="Keine Angabe" v-model="details.severity"
      :options="severityOptions" lines="none">
    </DodoInputSelect>

    <ion-item-divider>
      <ion-label><b>T</b>ime <i>(Verlauf)</i></ion-label>
    </ion-item-divider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="entry in timeOptions" :key="entry.label"
          :model-value="details.time.includes(entry.label)"
          @update:model-value="toggleSelection('time', entry.label, $event)" :color="entry.color">{{ entry.label }}
        </DodoToggleChip>
      </div>
    </IonItem>

  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDokuStore } from '@/store/doku'
import {
  provocationOptions, palliationOptions, qualityOptions, radiationOptions, severityOptions, timeOptions,
  renderBauchschmerzText,
} from '@/data/bauchschmerz'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.bauchschmerz.details)
const hasDetails = computed(() => Boolean(renderBauchschmerzText(details.value).trim()))

function toggleSelection(field: 'provocation' | 'palliation' | 'quality' | 'radiation' | 'time', label: string, enabled: boolean) {
  const values = details.value[field].filter(value => value !== label)
  details.value[field] = enabled ? [...values, label] : values
}
</script>

<style scoped>
  .chip-container {
    padding-top: .5rem;
    padding-bottom: .5rem;
  }
</style>
