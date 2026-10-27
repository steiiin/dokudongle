<template>
  <DodoItemModal label="Schwangerschaft" modal-label="Schwangerschaft" :state="hasDetails ? '' : 'Keine Angabe'">
    <IonItemDivider>
      <IonLabel>Schwangerschaftsanamnese</IonLabel>
    </IonItemDivider>

    <IonItem>
      <DodoInputNumber v-model="details.gravida"
        label="Gravida"
        :min="1">
      </DodoInputNumber>
      <DodoInputNumber v-model="details.para"
        label="Para"
        :min="0">
      </DodoInputNumber>
    </IonItem>

    <DodoInputSelect
      v-model="details.childCount"
      label="Mehrlingsstatus" lines="inset"
      empty-label="Einling"
      :options="[
        'Zwillinge',
        'Drillinge',
        'Vierlinge',
        'Fünflinge',
        'Sechslinge',
        'Siebenlinge',
        'Achtlinge',
        'Neunlinge',
      ]">
    </DodoInputSelect>

    <DodoInputGravTerm v-model="calculatedTerm" allow-clear />

    <IonItemDivider>
      <IonLabel>Aktuelle Schwangerschaft</IonLabel>
    </IonItemDivider>

    <DodoInputSelect
      v-model="details.presentation"
      label="Kindslage" lines="inset"
      empty-label="Nicht Erfasst"
      :options="[
        { value: 'SL', label: 'Schädellage' },
        { value: 'BEL', label: 'Beckenendlage' },
        { value: 'QL', label: 'Querlage' },
      ]">
    </DodoInputSelect>

    <DodoInputSelect
      v-model="details.amnioticFluid"
      label="Fruchtwasser" lines="none"
      empty-label="Nicht Erfasst"
      :options="[
        { value: 'Kein Fruchtwasserabgang', label: 'Kein Abgang' },
        { value: 'Fruchtwasserabgang (klar)', label: 'Klar' },
        { value: 'Fruchtwasserabgang (grün)', label: 'Grün' },
        { value: 'Fruchtwasserabgang (blutig)', label: 'Blutig' },
      ]">
    </DodoInputSelect>

  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDokuStore } from '@/store/doku'
import { pregnancySpanFromTerm, pregnancyTermFromSpan, renderSchwangerschaftText } from '@/data/schwangerschaft'
import type { PregnancySpan } from '@/types/protocol/pregnancy'

const store = useDokuStore()
const details = computed(() => store.doku.textAreaBlocks.schwangerschaft.details)
const hasDetails = computed(() => Boolean(renderSchwangerschaftText(details.value).trim()))
const calculatedTerm = computed<PregnancySpan | null>({
  get: () => pregnancySpanFromTerm(details.value.calculatedTerm),
  set: value => { details.value.calculatedTerm = pregnancyTermFromSpan(value) },
})
</script>
