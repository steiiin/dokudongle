<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Aufklärung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSelect
        v-model="store.doku.redflags.noTransportType"
        label="Aufklärung" :lines="isModeNormal ? 'none' : 'full'"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'BvO', label: 'Behandlung vor Ort' },
          { value: 'Verweigerung', label: 'Verweigerung' },
        ]">
      </DodoInputSelect>

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

// ############################################################################

const isModeNormal = computed(() => store.doku.redflags.noTransportType == '')

// ############################################################################

watch(() => [
  store.doku.redflags.choosenScenarios.length,
  JSON.stringify(store.doku.redflags.scenarioSelections),
  store.doku.redflags.choosenSignals.length,
  store.doku.redflags.noTransportType,
  store.doku.redflags.removedMajorSignals?.length ?? 0,
  store.doku.redflags.removedMinorSignals?.length ?? 0,
  store.doku.redflags.removedMajorSignalIds.length,
  store.doku.redflags.removedMinorSignalIds.length,
  store.doku.redflags.disableMinorBlock
], async (oldV, newV) => {

  const changed = oldV.toString() != newV.toString()
  if (!changed) { return }
  await tryScrollingToBottom()

})

</script>
