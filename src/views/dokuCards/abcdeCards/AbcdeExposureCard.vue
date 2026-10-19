<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>E - Exposure</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>

        <IonItem lines="full">
          <DodoInputTemperature
            v-model="store.doku.xabcdE.bodyTemperature">
          </DodoInputTemperature>
        </IonItem>

        <DodoItemModal label="Ausscheidung"
          :state="store.doku.xabcdE.excretionsState" lines="inset">

          <DodoInputToggle :lines="fullIf(store.doku.xabcdE.excretions.assessed)" v-model="store.doku.xabcdE.excretions.assessed">
            Ausscheidungen erfassen?
          </DodoInputToggle>

          <template v-if="store.doku.xabcdE.excretions.assessed">

            <IonItemDivider>
              <IonLabel>Katheter</IonLabel>
            </IonItemDivider>
            <DodoInputSelect v-model="store.doku.xabcdE.excretions.value.catheterType"
              label="Typ" lines="none"
              :options="[
                { value: '', label: 'Kein Katheter' },
                { value: 'ISK', label: 'Einmalkatheter' },
                { value: 'transurethraler DK', label: 'Transurethral' },
                { value: 'suprapubischer DK', label: 'Suprapubisch' },
                { value: 'Nierenkatheter', label: 'Nierenkatheter' },
              ]">
            </DodoInputSelect>

            <IonItemDivider>
              <IonLabel>Auffälligkeiten?</IonLabel>
            </IonItemDivider>
            <DodoInputToggle lines="inset" v-model="store.doku.xabcdE.excretions.value.urinaryAbnormalities">
              Wasserlassen auffällig?
            </DodoInputToggle>
            <DodoInputToggle lines="none" v-model="store.doku.xabcdE.excretions.value.bowelAbnormalities">
              Stuhlgang auffällig?
            </DodoInputToggle>

          </template>

        </DodoItemModal>

        <DodoInputToggle lines="full" v-model="store.doku.xabcdE.urinaryIncontinence">
          Eingenässt?
        </DodoInputToggle>

        <DodoInputToggle v-if="!ctx.isNonVerbal" v-model="store.doku.xabcdE.nausea">
          Übelkeit?
        </DodoInputToggle>

        <DodoItemModal label="Erbrechen" modal-label="Erbrechen"
          :state="store.doku.xabcdE.emesis.state" lines="full">

          <DodoInputSelect v-model="store.doku.xabcdE.emesis.incidences"
            label="Erbrechen" :lines="store.doku.xabcdE.emesis.incidences == '' ? 'none' : 'full'"
            :options="[
              { value: '', label: 'Nein' },
              { value: 'einmalig erbrochen', label: 'Einmalig' },
              { value: 'mehrfach erbrochen', label: 'Mehrfach' },
              { value: 'anhaltendes Erbrechen', label: 'Anhaltend' },
            ]">
          </DodoInputSelect>

          <template v-if="store.doku.xabcdE.emesis.incidences != ''">

            <IonItemDivider>
              <IonLabel>Auffälligkeiten?</IonLabel>
            </IonItemDivider>

            <IonRadioGroup v-model="store.doku.xabcdE.emesis.abnormalities">
              <IonItem>
                <IonRadio value="">unauffällig</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="schaumig">Schaumig</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="gallig">Gallig</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="kaffeesatzartig">Kaffeesatzartig</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="blutig">Blutig</IonRadio>
              </IonItem>
            </IonRadioGroup>

          </template>

        </DodoItemModal>

        <DodoItemModal
          label="Bauchbefund" modal-label="Bauchbefund"
          :state="store.doku.xabcdE.abdominalState" lines="none">

          <DodoInputToggle :lines="store.doku.xabcdE.abdominal.assessed ? 'full' : 'none'" v-model="store.doku.xabcdE.abdominal.assessed">
            Bauch untersucht?
          </DodoInputToggle>

          <template v-if="store.doku.xabcdE.abdominal.assessed">

            <DodoInputSelect
              v-model="store.doku.xabcdE.abdominal.value.guarding"
              label="Abwehrspannung" lines="full"
              :options="[
                { value: '', label: 'Keine' },
                { value: 'leichte', label: 'Leicht' },
                { value: 'starke', label: 'Stark' },
              ]">
            </DodoInputSelect>

            <template v-if="!ctx.isNonVerbal">

              <DodoInputSelect
                v-model="store.doku.xabcdE.abdominal.value.pain"
                label="Bauchschmerzen" lines="inset"
                :options="[
                  { value: 'keine', label: 'Keine' },
                  { value: 'leichte', label: 'Leicht' },
                  { value: '', label: 'Mittel' },
                  { value: 'starke', label: 'Stark' },
                ]">
              </DodoInputSelect>

            </template>

            <DodoInputSelect
              v-model="store.doku.xabcdE.abdominal.value.peristalsis"
              label="Peristaltik" lines="none"
              :options="[
                { value: '', label: 'Unauffällig' },
                { value: 'spärlich', label: 'Vermindert' },
                { value: 'fehlend', label: 'Fehlend' },
                { value: 'hochgestellt', label: 'Hochgestellt' },
              ]">
            </DodoInputSelect>

          </template>

        </DodoItemModal>

      </IonList>

      <DodoInputTreatment v-if="store.doku.xabcdE.needTreatment"
        v-model="store.doku.xabcdE.treatment"
        placeholder="Rettungsdecke">
      </DodoInputTreatment>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'
import { isRestoringReanimation } from '@/store/reanimation'

import { fullIf } from '@/utils/filter'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

watch(() => store.doku.xabcdE.abdominal.value.guarding, (v) => {
  if (v != '' && store.doku.xabcdE.abdominal.value.pain == 'keine') {
    store.doku.xabcdE.abdominal.value.pain = ''
  }
})

watch(() => ctx.value.isNonVerbal, (v) => {
  if (isRestoringReanimation(store.doku)) return
  if (v && store.doku.xabcdE.abdominal.value.pain != 'keine') {
    store.doku.xabcdE.abdominal.value.pain = 'keine'
  }
}, { flush: 'sync' })

</script>
<style scoped>

  ion-card {
    --card-bg: #FFFF3380;
  }

</style>
