<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Stuhlgang</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="handleCancel">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton color="primary" :disabled="isEmpty" @click="handleAccept">Einfügen</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">

      <IonList lines="none">

        <IonItemDivider>
          <IonLabel>Beschaffenheit</IonLabel>
        </IonItemDivider>
        <DodoInputSelect
          v-model="localPattern"
          label="Frequenz" lines="inset"
          :options="[
            { value: '', label: 'Nicht erfasst' },
            { value: 'Obstipation', label: 'Obstipation' },
            { value: 'Durchfall', label: 'Durchfall' },
          ]">
        </DodoInputSelect>
        <DodoInputSelect
          v-model="localConsistency"
          label="Konsistenz" lines="inset"
          :options="[
            { value: '', label: 'Nicht erfasst' },
            { value: 'kügelchenförmig', label: 'Kügelchen' },
            { value: 'hartlaibig', label: 'Hart' },
            { value: 'geformt', label: 'Geformt' },
            { value: 'breiig', label: 'Breiig' },
            { value: 'wässrig', label: 'Wässrig' },
          ]">
        </DodoInputSelect>
        <DodoInputTextOptional lines="none"
          toggle-label="Letzten Stuhlgang erfassen?" v-model:toggle="localLastBowel.active"
          text-label="Wann?" text-placeholder="z.B. 2d" v-model:text="localLastBowel.value">
        </DodoInputTextOptional>

        <IonItemDivider>
          <IonLabel>Anomalien</IonLabel>
        </IonItemDivider>
        <DodoInputSelect
          v-model="localBlood"
          label="Blut" lines="inset"
          :options="[
            { value: '', label: 'kein Blut' },
            { value: 'Blut am Klopapier', label: 'Am Klopapier' },
            { value: 'Blut im Stuhl', label: 'Im Stuhl' },
            { value: 'Teerstuhl', label: 'Teerstuhl' },
          ]">
        </DodoInputSelect>
        <IonItem lines="inset">
          <IonToggle v-model="localBowelPain" label-placement="end">
            Schmerzhafter Stuhlgang?
          </IonToggle>
        </IonItem>
        <DodoInputSelect
          v-model="localBowelSounds"
          label="Darmgeräusche" lines="none"
          :options="[
            { value: '', label: 'Nicht erfasst' },
            { value: 'normal', label: 'Normal' },
            { value: 'vermehrt', label: 'Vermehrt' },
            { value: 'vermindert', label: 'Vermindert' },
            { value: 'fehlend', label: 'Fehlend' },
            { value: 'hochgestellt', label: 'Hochgestellt' },
          ]">
        </DodoInputSelect>

      </IonList>

    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { QuickieExcretionsBowels } from '@/data/quickies'
import { concatDoku, prefix } from '@/utils/text'

import { OptionalValue } from '@/types/protocol/input'
import { textIf } from '@/utils/filter'
import { prefixVor } from '@/utils/prefix/general'

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieExcretionsBowels
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

// ############################################################################

const previewText = computed(() => {
  return prefix('Stuhlgang: ', concatDoku([
    [
      localPattern.value,
      localConsistency.value,
      textIf(prefix('zuletzt', prefixVor(localLastBowel.value.value)), localLastBowel.value.isActive),
    ],
    [
      localBlood.value,
      textIf('schmerzhafter Stuhlgang', localBowelPain.value),
    ],
    prefix('DG', localBowelSounds.value),
  ]))
})

const isEmpty = computed(() => !previewText.value)

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const handleAccept = () => {
  emit('accept', `${previewText.value}\n`)
}

// ############################################################################

const localPattern = ref<string>(props.quickie.pattern)
const localConsistency = ref<string>(props.quickie.consistency)
const localLastBowel = ref<OptionalValue<string>>(props.quickie.lastBowel)
const localBowelSounds = ref<string>(props.quickie.bowelSounds)
const localBlood = ref<string>(props.quickie.blood)
const localBowelPain = ref<boolean>(props.quickie.bowelPain)

watch(() => props.quickie, (v) => {

  localPattern.value = v.pattern
  localConsistency.value = v.consistency
  localLastBowel.value = v.lastBowel
  localBowelSounds.value = v.bowelSounds
  localBlood.value = v.blood
  localBowelPain.value = v.bowelPain

})

// ############################################################################

watch(() => localPattern.value, (v) => {
  if (v == 'Durchfall' && !(localConsistency.value == 'breiig' || localConsistency.value == 'wässrig')) {
    localConsistency.value = 'breiig'
  }
})

watch(() => localConsistency.value, (v) => {
  if ((v == 'kügelchenförmig' || v == 'hart') && localPattern.value != 'Obstipation') {
    localPattern.value = 'Obstipation'
  }
  else if ((v == 'breiig' || v == 'wässrig') && localPattern.value != 'Durchfall') {
    localPattern.value = 'Durchfall'
  }
})

</script>
<style scoped>

  .dd-quickie-preview {
    white-space: pre-wrap;
    padding: 0.75rem;
    border: 1px solid var(--ion-color-medium-tint);
    border-radius: 8px;
    margin-bottom: 1rem;
    background: var(--ion-color-light);
  }

  .chip-container {
    padding-top: .5rem;
    padding-bottom: .5rem;
  }

</style>