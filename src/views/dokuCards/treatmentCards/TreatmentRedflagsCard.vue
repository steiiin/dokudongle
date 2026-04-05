<template>
  <IonCard v-if="lazy.treatment.redflags">
    <IonCardHeader>
      <IonCardTitle>Aufklärung / Einwilligung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSelect v-model="store.doku.redflags.consent"
        label="Einwilligung" lines="full"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'Fähig', label: 'Einwilligungsfähig' },
          { value: 'Unfähig', label: 'Einwilligungsunfähig' },
          { value: 'Zeitkritisch', label: 'Zeitkritisch' },
        ]">
      </DodoInputSelect>

      <DodoInputSelect
        v-model="store.doku.redflags.noTransportType"
        label="Aufklärung" :lines="isModeNormal ? 'none' : 'full'"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'BvO', label: 'Behandlung vor Ort' },
          { value: 'Verweigerung', label: 'Verweigerung' },
        ]">
      </DodoInputSelect>

      <template v-if="isModeBvO">

        <DodoInputTextOptional
          toggle-label="Gesetzlicher Betreuer/Vormund?" v-model:toggle="store.doku.redflags.attendant.active"
          text-label="Name/Art:" text-placeholder="z.B. Tochter" v-model:text="store.doku.redflags.attendant.value">
        </DodoInputTextOptional>

      </template>

      <template v-if="!isModeNormal">

        <DodoInputRedflags v-model="store.doku.redflags" />

      </template>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { tryScrollingToBottom } from '@/utils/input'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

import { useLazyStore } from '@/store/lazy'
const lazy = useLazyStore()

// ############################################################################

const isModeNormal = computed(() => store.doku.redflags.noTransportType == '')
const isModeBvO = computed(() => store.doku.redflags.noTransportType == 'BvO')

// ############################################################################

watch(() => [
  store.doku.redflags.choosenScenarios.length,
  store.doku.redflags.choosenSignals.length,
  store.doku.redflags.noTransportType,
  store.doku.redflags.attendant.active
], async (oldV, newV) => {

  const changed = oldV.toString() != newV.toString()
  if (!changed) { return }
  await tryScrollingToBottom()

})

</script>
