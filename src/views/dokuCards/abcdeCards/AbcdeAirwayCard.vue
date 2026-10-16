<template>
  <DodoExaminationCard title="A - Airway">

    <IonItem lines="full">
      <IonToggle v-model="store.doku.xAbcde.isBreathing" label-placement="end">
        Atmung vorhanden?
      </IonToggle>
    </IonItem>

    <DodoInputSelect label="Obstruktion" v-model="store.doku.xAbcde.obstruction"
      lines="inset" empty-label="Keine"
      :options="[
        'Fremdkörper',
        'Schwellung',
        'Erbrochenes',
        'Blut',
      ]"
      allow-custom custom-label="Durch?" custom-placeholder="z.B. Blut"
      :ime-dictionary="{ /* activate IME */ }">
    </DodoInputSelect>

    <DodoExaminationItem id="stridor" label="Stridor"
      v-model:assessed="store.doku.xAbcde.stridor.assessed"
      :available="store.doku.xAbcde.isBreathing" show-line="inset"
      @select="store.doku.xAbcde.stridor.value = true"
      @remove="store.doku.xAbcde.stridor.value = false">
      <IonItem>
        <IonToggle v-model="store.doku.xAbcde.stridor.value" label-placement="end">
          Stridor?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoItemModal label="Schleimhaut" modal-label="Mundschleimhaut"
      :state="store.doku.xAbcde.mucosaText" lines="full">

      <IonItemDivider>
        <IonLabel>Feuchtigkeit</IonLabel>
      </IonItemDivider>
      <IonRadioGroup v-model="store.doku.xAbcde.mucosa.m">
        <IonItem lines="inset">
          <IonRadio value="feucht">Feucht</IonRadio>
        </IonItem>
        <IonItem>
          <IonRadio value="trocken">Trocken</IonRadio>
        </IonItem>
      </IonRadioGroup>
      <IonItemDivider>
        <IonLabel>Erythema / Farbe</IonLabel>
      </IonItemDivider>
      <IonRadioGroup v-model="store.doku.xAbcde.mucosa.e">
        <IonItem lines="inset">
          <IonRadio value="rosig">Rosig</IonRadio>
        </IonItem>
        <IonItem lines="inset">
          <IonRadio value="blass">Blass</IonRadio>
        </IonItem>
        <IonItem lines="inset">
          <IonRadio value="gerötet">Gerötet</IonRadio>
        </IonItem>
        <IonItem>
          <IonRadio value="bläulich">Bläulich / Zyanotisch</IonRadio>
        </IonItem>
      </IonRadioGroup>

    </DodoItemModal>

    <IonItem lines="none">
      <IonToggle v-model="store.doku.xAbcde.hasTongueBite" label-placement="end">
        Zungenbiss?
      </IonToggle>
    </IonItem>

    <template #footer>
      <DodoInputTreatment v-if="store.doku.xAbcde.needTreatment"
        v-model="store.doku.xAbcde.treatment"
        placeholder="Absaugen, Guedel-Tubus">
      </DodoInputTreatment>

    </template>
  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { watch } from 'vue'
import { isRestoringReanimation } from '@/store/reanimation'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

watch(() => store.doku.xAbcde.isBreathing, (v) => {
  if (isRestoringReanimation(store.doku)) return

  store.doku.xAbcde.stridor.assessed = false
  store.doku.xAbcde.stridor.value = false
  store.doku.xAbcde.mucosa.e = v ? 'rosig' : 'bläulich'

  store.doku.xaBcde.breathlessness = 'keine'
  store.doku.xaBcde.mechanics.frequency = ''
  store.doku.xaBcde.mechanics.depth = ''
  store.doku.xaBcde.mechanics.pattern = ''

  store.doku.xaBcde.accessoryMuscles.assessed = false
  store.doku.xaBcde.accessoryMuscles.value = false
  store.doku.xaBcde.retractions.assessed = false
  store.doku.xaBcde.retractions.value = false
  store.doku.xaBcde.hasHypoxia = !v

  store.doku.xaBcde.auscultation.assessed = false
  store.doku.xaBcde.auscultation.value.wheezing = ''
  store.doku.xaBcde.auscultation.value.crackles = ''
  store.doku.xaBcde.auscultation.value.dimished = ''

  store.doku.xaBcde.paradoxical.assessed = false
  store.doku.xaBcde.paradoxical.value = false
  store.doku.xaBcde.jugularVenousDistension.assessed = false
  store.doku.xaBcde.jugularVenousDistension.value = false
  store.doku.xaBcde.emphysema.assessed = false
  store.doku.xaBcde.emphysema.value = false
  store.doku.xaBcde.trachealDeviation.assessed = false
  store.doku.xaBcde.trachealDeviation.value = false

}, { flush: 'sync' })

</script>
<style scoped>

  ion-card {
    --card-bg: #377eb849;
  }

</style>
