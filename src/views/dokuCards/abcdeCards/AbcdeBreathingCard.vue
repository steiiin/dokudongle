<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>B - Breathing</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <DodoInputSelect label="Luftnot" v-model="store.doku.xaBcde.breathlessness" lines="full"  v-if="store.doku.xAbcde.isBreathing && !ctx.isNonVerbal"
          :options="[
            { value: 'keine', label: 'Keine' },
            { value: 'leichte', label: 'Leichte' },
            { value: '', label: 'Mittlere' },
            { value: 'schwere', label: 'Schwere' },
          ]">
        </DodoInputSelect>

        <IonItem lines="full">
          <IonToggle v-model="store.doku.xaBcde.hasHypoxia" label-placement="end">
            Hypoxie (&lt;90%)?
          </IonToggle>
        </IonItem>

        <DodoItemModal label="Atemmechanik" v-if="store.doku.xAbcde.isBreathing"
          :state="store.doku.xaBcde.breathingState" lines="full">

          <IonItemDivider>
            <IonLabel>Atemmuster</IonLabel>
          </IonItemDivider>
          <IonRadioGroup v-model="store.doku.xaBcde.mechanics.pattern">
            <IonItem lines="inset">
              <IonRadio value="">Normal</IonRadio>
            </IonItem>
            <IonItem lines="inset">
              <IonRadio value="Hyperventilation">Hyperventilation</IonRadio>
            </IonItem>
            <IonItem lines="inset">
              <IonRadio value="Biotsche Atmung">Biotsche Atmung</IonRadio>
            </IonItem>
            <IonItem lines="inset">
              <IonRadio value="Cheyne-Stokes-Atmung">Cheyne-Stokes-Atmung</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="Kußmaul-Atmung">Kußmaul-Atmung</IonRadio>
            </IonItem>
          </IonRadioGroup>

          <template v-if="!hasPattern">

            <IonItemDivider>
              <IonLabel>Parameter</IonLabel>
            </IonItemDivider>
            <DodoInputSelect label="Frequenz" v-model="store.doku.xaBcde.mechanics.frequency" lines="inset"
              :options="[
                { value: '', label: 'Normal' },
                { value: 'Bradypnoe', label: 'Bradypnoe (< 12/min)' },
                { value: 'Tachypnoe', label: 'Tachypnoe (> 20/min)' },
              ]">
            </DodoInputSelect>
            <DodoInputSelect label="Tiefe" v-model="store.doku.xaBcde.mechanics.depth" lines="none"
              :options="[
                { value: '', label: 'Normal' },
                { value: 'Flach', label: 'Flache Atmung' },
                { value: 'Vertieft', label: 'Vertiefte Atmung' },
              ]">
            </DodoInputSelect>

          </template>

        </DodoItemModal>

        <DodoItemModal label="Auskultation" v-if="store.doku.xAbcde.isBreathing"
          :state="store.doku.xaBcde.auscultationState" lines="full">

          <IonItem :lines="store.doku.xaBcde.auscultation.assessed ? 'full' : 'none'">
            <IonToggle v-model="store.doku.xaBcde.auscultation.assessed" label-placement="end">
              Abgehört?
            </IonToggle>
          </IonItem>

          <template v-if="hasAusculated">

            <DodoInputSelect label="Giemen/Brummen" v-model="store.doku.xaBcde.auscultation.value.wheezing" lines="inset"
              :options="[
                { value: '', label: 'Nein' },
                { value: 'li.', label: 'Links' },
                { value: 're.', label: 'Rechts' },
                { value: 'bds.', label: 'Beidseits' },
              ]">
            </DodoInputSelect>
            <DodoInputSelect label="Rasselgeräusche" v-model="store.doku.xaBcde.auscultation.value.crackles" lines="inset"
              :options="[
                { value: '', label: 'Nein' },
                { value: 'li.', label: 'Links' },
                { value: 're.', label: 'Rechts' },
                { value: 'bds.', label: 'Beidseits' },
              ]">
            </DodoInputSelect>
            <DodoInputSelect label="Abgeschwächt" v-model="store.doku.xaBcde.auscultation.value.dimished" lines="none"
              :options="[
                { value: '', label: 'Nein' },
                { value: 'li.', label: 'Links' },
                { value: 're.', label: 'Rechts' },
                { value: 'bds.', label: 'Beidseits' },
              ]">
            </DodoInputSelect>

          </template>

        </DodoItemModal>

        <DodoItemModal label="Thoraxbefunde"
          :state="store.doku.xaBcde.thoraxState" lines="none">

          <IonItem v-show="store.doku.xAbcde.isBreathing" lines="inset">
            <IonToggle v-model="store.doku.xaBcde.useAccessoryMuscles" label-placement="end">
              Hilfsmuskulatur?
            </IonToggle>
          </IonItem>

          <IonItem v-show="store.doku.xAbcde.isBreathing" lines="inset">
            <IonToggle v-model="store.doku.xaBcde.hasRetractions" label-placement="end">
              Einziehungen?
            </IonToggle>
          </IonItem>

          <IonItem v-show="store.doku.xAbcde.isBreathing" lines="inset">
            <IonToggle v-model="store.doku.xaBcde.isParadoxical" label-placement="end">
              Paradoxe Atmung?
            </IonToggle>
          </IonItem>

          <IonItem lines="inset">
            <IonToggle v-model="store.doku.xaBcde.hasJugularVenousDistension" label-placement="end">
              Halsvenenstauung?
            </IonToggle>
          </IonItem>

          <IonItem lines="inset">
            <IonToggle v-model="store.doku.xaBcde.hasEmphysema" label-placement="end">
              Subkutanes Emphysem?
            </IonToggle>
          </IonItem>

          <IonItem lines="none">
            <IonToggle v-model="store.doku.xaBcde.hasTrachealDeviation" label-placement="end">
              Trachealverschiebung?
            </IonToggle>
          </IonItem>

        </DodoItemModal>

      </IonList>

      <DodoInputTreatment v-if="store.doku.xaBcde.needTreatment"
        v-model="store.doku.xaBcde.treatment"
        placeholder="Sauerstoffgabe, Beutel-Masken-Beatmung">
      </DodoInputTreatment>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const hasPattern = computed(() => store.doku.xaBcde.mechanics.pattern != '')

watch(() => store.doku.xaBcde.mechanics.pattern, (v) => {
  store.doku.xaBcde.mechanics.frequency = ''
  store.doku.xaBcde.mechanics.depth = ''
})

const hasAusculated = computed(() => store.doku.xaBcde.auscultation.assessed)

watch(() => hasAusculated.value, (v) => {
  store.doku.xaBcde.auscultation.value.wheezing = ''
  store.doku.xaBcde.auscultation.value.crackles = ''
  store.doku.xaBcde.auscultation.value.dimished = ''
})

</script>
<style scoped>

  ion-card {
    --card-bg: #4DAF4A80;
  }

</style>