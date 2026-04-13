<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>OPQRST</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="handleCancel">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton :disabled="!isValid" color="primary" @click="handleAccept">Einfügen</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">

      <DodoListPreview :text="previewText"></DodoListPreview>

      <IonList lines="none">

        <ion-item-divider>
          <ion-label>Bezeichnung</ion-label>
        </ion-item-divider>
        <!-- <DodoListArticle>
          <h1>Symptom</h1>
          <p>z.B. Rückenschmerz</p>
        </DodoListArticle> -->
        <IonItem>
          <DodoInputText v-model="localSymtom"
            label="Symptom" :autocorrect-fn="basicCap">
          </DodoInputText>
        </IonItem>

        <template v-if="hasSymptomEntered">

          <ion-item-divider>
            <ion-label>Beschreibung</ion-label>
          </ion-item-divider>

          <DodoInputQuick
            v-model="localOnset" label="Beginn" :icon="playOutline"
            placeholder="seit gestern">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localProvocation" label="Verschlechterung" :icon="trendingDownOutline"
            placeholder="schlimmer bei Bewegung">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localPalliation" label="Verbesserung" :icon="trendingUpOutline"
            placeholder="besser bei Ruhe">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localQuality" label="Qualität / Art" :icon="pulseOutline"
            placeholder="stechend">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localRadiation" label="Region / Radiation" :icon="bodyOutline"
            placeholder="Brust, Ausstrahlung li. Arm">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localSeverity" label="Schweregrad" :icon="speedometerOutline"
            placeholder="VRS leicht">
          </DodoInputQuick>
          <DodoInputQuick
            v-model="localTime" label="Verlauf" lines="none" :icon="timeOutline"
            placeholder="zunehmend seit 2h">
          </DodoInputQuick>

        </template>

      </IonList>

    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { bodyOutline, playOutline, pulseOutline, speedometerOutline, timeOutline, trendingDownOutline, trendingUpOutline } from 'ionicons/icons'

import { QuickieOPQRST } from '@/data/quickies'
import { concatDoku } from '@/utils/text'
import { basicCap } from '@/utils/autocorrect/basic'

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieOPQRST
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

// ############################################################################

const previewText = computed(() => {
  const draft = localSymtom.value + ': ' + concatDoku([
    localOnset.value,
    localProvocation.value,
    localPalliation.value,
    localQuality.value,
    localRadiation.value,
    localSeverity.value,
    localTime.value,
  ])
  return draft.trim().length>1 ? draft  : ''
})

const isValid = computed(() =>
  hasSymptomEntered.value
  && (previewText.value.trim().length - localSymtom.value.trim().length)>2
)

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const syncQuickieFromLocalState = () => {
  Object.assign(props.quickie.symptom, localSymtom.value)
  props.quickie.onset = localOnset.value
  props.quickie.provocation = localProvocation.value
  props.quickie.palliation = localPalliation.value
  props.quickie.quality = localQuality.value
  props.quickie.radiation = localRadiation.value
  props.quickie.severity = localSeverity.value
  props.quickie.time = localTime.value
}

const handleAccept = () => {
  syncQuickieFromLocalState()
  emit('accept', `${previewText.value}\n`)
}

// ############################################################################

const localSymtom = ref<string>(props.quickie.symptom)
const localOnset = ref<string>(props.quickie.onset)
const localProvocation = ref<string>(props.quickie.provocation)
const localPalliation = ref<string>(props.quickie.palliation)
const localQuality = ref<string>(props.quickie.quality)
const localRadiation = ref<string>(props.quickie.radiation)
const localSeverity = ref<string>(props.quickie.severity)
const localTime = ref<string>(props.quickie.time)

watch(() => props.quickie, (v) => {

  localSymtom.value = v.symptom
  localOnset.value = v.onset
  localProvocation.value = v.provocation
  localPalliation.value = v.palliation
  localQuality.value = v.quality
  localRadiation.value = v.radiation
  localSeverity.value = v.severity
  localTime.value = v.time

})

const hasSymptomEntered = computed(() => localSymtom.value.trim().length>0)

</script>
<style scoped>

  .chip-container {
    padding-top: .5rem;
    padding-bottom: .5rem;
  }

</style>
