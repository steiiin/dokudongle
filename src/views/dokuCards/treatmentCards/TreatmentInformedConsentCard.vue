<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Aufklärung / Einwilligung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSelect v-model="store.doku.redflags.Consent"
        label="Einwilligung" lines="full"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'Fähig', label: 'Einwilligungsfähig' },
          { value: 'Unfähig', label: 'Einwilligungsunfähig' },
          { value: 'Zeitkritisch', label: 'Zeitkritisch' },
        ]">
      </DodoInputSelect>

      <DodoInputSelect
        v-model="store.doku.redflags.NoTransportType"
        label="Aufklärung"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'BvO', label: 'Behandlung vor Ort' },
          { value: 'Verweigerung', label: 'Verweigerung' },
        ]">
      </DodoInputSelect>

      <template v-if="useInformedConsentBvO">

        <DodoInputTextOptional
          toggle-label="Gesetzlicher Betreuer/Vormund?" v-model:toggle="store.doku.redflags.attendant.active"
          text-label="Name/Art:" text-placeholder="z.B. Tochter" v-model:text="store.doku.redflags.attendant.value">
        </DodoInputTextOptional>

      </template>

      <template v-if="withInformedConsent">

        <DodoInputRedflags v-model="store.doku.redflags" />

      </template>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, nextTick, ref, toValue, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

const withInformedConsent = computed(() => store.doku.redflags.NoTransportType != '')
const useInformedConsentBvO = computed(() => store.doku.redflags.NoTransportType == 'BvO')

const isZopsDesorientiert = computed(() => {
  const orientation = store.doku.xabcDe.zops
  return orientation.isUnoriented
})
const isFullyOriented = computed(() => store.doku.xabcDe.zops.isOriented)
const isNonVerbal = computed(() => ctx.value.isNonVerbal)


watch(() => store.doku.redflags.NoTransportType, () => {
  const consent = store.doku.redflags
  consent.RedFlags = []
  consent.RedDiagnoses = []
  consent.RedCases = []
})

const applyConsentCapability = () => {

  const consent = store.doku.redflags
  if (consent.Consent === '') {
    return
  }

  if (isZopsDesorientiert.value || isNonVerbal.value) {
    consent.Consent = 'Unfähig'
    return
  }

  if (isFullyOriented.value && !isNonVerbal.value) {
    consent.Consent = 'Fähig'
  }

  if (ctx.value.isCritical && consent.Consent !== 'Unfähig') {
    consent.Consent = 'Zeitkritisch'
  }

}

watch([() => ctx.value.isCritical, isZopsDesorientiert, isNonVerbal, isFullyOriented], () => {
  applyConsentCapability()
}, { immediate: true })


</script>
<style scoped>

</style>
