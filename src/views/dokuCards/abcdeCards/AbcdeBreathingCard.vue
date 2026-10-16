<template>
  <DodoExaminationCard title="B - Breathing">

    <DodoInputSelect label="Luftnot" v-model="store.doku.xaBcde.breathlessness" lines="full"  v-if="store.doku.xAbcde.isBreathing && !ctx.isNonVerbal"
      :options="[
        { value: 'keine', label: 'Keine' },
        { value: 'leichte', label: 'Leichte' },
        { value: '', label: 'Mittlere' },
        { value: 'schwere', label: 'Schwere' },
      ]">
    </DodoInputSelect>

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

    <IonItem lines="full">
      <IonToggle v-model="store.doku.xaBcde.hasHypoxia" label-placement="end">
        Hypoxie (&lt;90%)?
      </IonToggle>
    </IonItem>

    <DodoExaminationItem id="auscultation" label="Auskultation" assessed-presets
      v-model:assessed="store.doku.xaBcde.auscultation.assessed"
      :available="store.doku.xAbcde.isBreathing" show-line="full" picker-separator-after
      @activate="auscultationModal?.open()" @remove="resetAuscultation">
      <DodoItemModal ref="auscultationModal" label="Auskultation"
        :state="store.doku.xaBcde.auscultationState" lines="none">
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

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="accessoryMuscles" label="Hilfsmuskulatur"
      v-model:assessed="store.doku.xaBcde.accessoryMuscles.assessed"
      :available="store.doku.xAbcde.isBreathing"
      show-line="inset"
      @select="store.doku.xaBcde.accessoryMuscles.value = true"
      @remove="store.doku.xaBcde.accessoryMuscles.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.accessoryMuscles.value" label-placement="end">
          Hilfsmuskulatur?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoExaminationItem id="retractions" label="Einziehungen"
      v-model:assessed="store.doku.xaBcde.retractions.assessed"
      :available="store.doku.xAbcde.isBreathing"
      show-line="inset"
      @select="store.doku.xaBcde.retractions.value = true"
      @remove="store.doku.xaBcde.retractions.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.retractions.value" label-placement="end">
          Einziehungen?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoExaminationItem id="paradoxical" label="Paradoxe Atmung"
      v-model:assessed="store.doku.xaBcde.paradoxical.assessed"
      :available="store.doku.xAbcde.isBreathing"
      show-line="inset"
      @select="store.doku.xaBcde.paradoxical.value = true"
      @remove="store.doku.xaBcde.paradoxical.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.paradoxical.value" label-placement="end">
          Paradoxe Atmung?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoExaminationItem id="jugularVenousDistension" label="Halsvenenstauung"
      v-model:assessed="store.doku.xaBcde.jugularVenousDistension.assessed"
      show-line="inset"
      @select="store.doku.xaBcde.jugularVenousDistension.value = true"
      @remove="store.doku.xaBcde.jugularVenousDistension.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.jugularVenousDistension.value" label-placement="end">
          Halsvenenstauung?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoExaminationItem id="emphysema" label="Subkutanes Emphysem"
      v-model:assessed="store.doku.xaBcde.emphysema.assessed"
      show-line="inset"
      @select="store.doku.xaBcde.emphysema.value = true"
      @remove="store.doku.xaBcde.emphysema.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.emphysema.value" label-placement="end">
          Subkutanes Emphysem?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <DodoExaminationItem id="trachealDeviation" label="Trachealverschiebung"
      v-model:assessed="store.doku.xaBcde.trachealDeviation.assessed"
      @select="store.doku.xaBcde.trachealDeviation.value = true"
      @remove="store.doku.xaBcde.trachealDeviation.value = false">
      <IonItem lines="none">
        <IonToggle v-model="store.doku.xaBcde.trachealDeviation.value" label-placement="end">
          Trachealverschiebung?
        </IonToggle>
      </IonItem>
    </DodoExaminationItem>

    <template #footer>
      <DodoInputTreatment v-if="store.doku.xaBcde.needTreatment"
        v-model="store.doku.xaBcde.treatment"
        placeholder="Sauerstoffgabe, Beutel-Masken-Beatmung">
      </DodoInputTreatment>
    </template>
  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import { isRestoringReanimation } from '@/store/reanimation'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const hasPattern = computed(() => store.doku.xaBcde.mechanics.pattern != '')

watch(() => store.doku.xaBcde.mechanics.pattern, () => {
  if (isRestoringReanimation(store.doku)) return
  store.doku.xaBcde.mechanics.frequency = ''
  store.doku.xaBcde.mechanics.depth = ''
}, { flush: 'sync' })

const auscultationModal = ref<InstanceType<typeof DodoItemModal>>()

function resetAuscultation() {
  store.doku.xaBcde.auscultation.value.wheezing = ''
  store.doku.xaBcde.auscultation.value.crackles = ''
  store.doku.xaBcde.auscultation.value.dimished = ''
}

</script>
<style scoped>

  ion-card {
    --card-bg: #4DAF4A80;
  }

</style>
