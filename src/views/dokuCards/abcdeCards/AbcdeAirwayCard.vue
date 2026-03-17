<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>A - Airway</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <IonItem lines="full">
          <IonToggle v-model="store.doku.xAbcde.isBreathing" label-placement="end">
            Atmung vorhanden?
          </IonToggle>
        </IonItem>

        <DodoInputSelect label="Obstruktion" v-model="store.doku.xAbcde.obstruction" lines="full"
          empty-label="Keine"
          :options="[
            'Fremdkörper',
            'Schwellung',
            'Erbrochenes',
            'Blut',
          ]"
          allow-custom custom-label="Durch?" custom-placeholder="z.B. Blut"
          :autocorrect-fn="basicCap">
        </DodoInputSelect>

        <IonItem v-show="store.doku.xAbcde.isBreathing" lines="full">
          <IonToggle v-model="store.doku.xAbcde.hasStridor" label-placement="end">
            Stridor?
          </IonToggle>
        </IonItem>

        <IonItem lines="full">
          <IonToggle v-model="store.doku.xAbcde.hasTongueBite" label-placement="end">
            Zungenbiss?
          </IonToggle>
        </IonItem>

        <DodoItemModal label="Schleimhaut" modal-label="Mundschleimhaut"
          :state="store.doku.xAbcde.mucosaText" lines="none">

          <IonItemDivider>
            <IonLabel>Feuchtigkeit</IonLabel>
          </IonItemDivider>
          <IonRadioGroup v-model="store.doku.xAbcde.mucosa.m">
            <IonItem>
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
            <IonItem>
              <IonRadio value="rosig">Rosig</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="blass">Blass</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="gerötet">Gerötet</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="bläulich">Bläulich / Zyanotisch</IonRadio>
            </IonItem>
          </IonRadioGroup>

        </DodoItemModal>

      </IonList>

      <DodoInputTreatment v-if="store.doku.xAbcde.needTreatment"
        v-model="store.doku.xAbcde.treatment"
        placeholder="Absaugen, Guedel-Tubus">
      </DodoInputTreatment>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { enhanceSituation } from '@/utils/gpt/situation'
import { basicCap } from '@/utils/autocorrect/basic'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

watch(() => store.doku.xAbcde.isBreathing, (v) => {

  store.doku.xAbcde.hasStridor = false

  store.doku.xaBcde.breathlessness = 'keine'
  store.doku.xaBcde.mechanics.frequency = ''
  store.doku.xaBcde.mechanics.depth = ''
  store.doku.xaBcde.mechanics.pattern = ''

  store.doku.xaBcde.useAccessoryMuscles = false
  store.doku.xaBcde.hasRetractions = false
  store.doku.xaBcde.hasHypoxia = !v

  store.doku.xaBcde.auscultation.value.wheezing = ''
  store.doku.xaBcde.auscultation.value.crackles = ''
  store.doku.xaBcde.auscultation.value.dimished = ''

  store.doku.xaBcde.isParadoxical = false
  store.doku.xaBcde.hasJugularVenousDistension = false
  store.doku.xaBcde.hasEmphysema = false
  store.doku.xaBcde.hasTrachealDeviation = false

})

</script>
<style scoped>

ion-card {
  --card-bg: #377eb849;
}

</style>