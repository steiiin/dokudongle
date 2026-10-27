<template>
  <DodoExaminationCard title="E - Exposure">

    <IonItem lines="full">
      <DodoInputTemperature
        v-model="store.doku.xabcdE.bodyTemperature">
      </DodoInputTemperature>
    </IonItem>

    <DodoExaminationItem id="excretions" label="Ausscheidung" assessed-presets show-line="inset"
      :assessed="store.doku.xabcdE.excretions.assessed" @update:assessed="store.setExcretionsAssessed"
      @select="store.resetExcretions" @activate="excretionsModal?.open()" @remove="store.resetExcretions">
      <DodoItemModal ref="excretionsModal" label="Ausscheidung"
        :state="store.doku.xabcdE.excretionsState" lines="none">

        <IonItemDivider>
          <IonLabel>Katheter</IonLabel>
        </IonItemDivider>
        <DodoInputSelect :model-value="store.doku.xabcdE.excretions.value.catheterType"
          @update:model-value="store.setCatheterType($event as ExposureExcretions['catheterType'])"
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
        <DodoInputToggle lines="inset" :model-value="store.doku.xabcdE.excretions.value.urinaryAbnormalities" @update:model-value="store.setUrinaryAbnormalities">
          Wasserlassen auffällig?
        </DodoInputToggle>
        <DodoInputToggle lines="none" :model-value="store.doku.xabcdE.excretions.value.bowelAbnormalities" @update:model-value="store.setBowelAbnormalities">
          Stuhlgang auffällig?
        </DodoInputToggle>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoInputToggle lines="full" v-model="store.doku.xabcdE.urinaryIncontinence">
      Eingenässt?
    </DodoInputToggle>

    <DodoExaminationItem id="abdominal" label="Bauchbefund" assessed-presets
      :assessed="store.doku.xabcdE.abdominal.assessed" @update:assessed="store.setAbdominalAssessed" show-line="full"
      @select="store.resetAbdominal" @activate="abdominalModal?.open()" @remove="store.resetAbdominal">
      <DodoItemModal ref="abdominalModal" label="Bauchbefund" modal-label="Bauchbefund"
        :state="store.doku.xabcdE.abdominalState" lines="none">

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
            :model-value="store.doku.xabcdE.abdominal.value.pain"
            @update:model-value="store.setAbdominalPain($event as ExposureAbdominal['pain'])"
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

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoInputToggle v-if="!ctx.isNonVerbal" v-model="store.doku.xabcdE.nausea" lines="inset">
      Übelkeit?
    </DodoInputToggle>

    <DodoItemModal label="Erbrechen" modal-label="Erbrechen"
      :state="store.doku.xabcdE.emesis.state" lines="none">

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

    <template #footer>
      <DodoInputTreatment v-if="store.doku.xabcdE.needTreatment"
        v-model="store.doku.xabcdE.treatment"
        placeholder="Rettungsdecke">
      </DodoInputTreatment>
    </template>
  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { isRestoringReanimation } from '@/store/reanimation'

import DodoItemModal from '@/components/DodoItemModal.vue'
import type { ExposureAbdominal, ExposureExcretions } from '@/types/protocol/abcde'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)
const abdominalModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const excretionsModal = ref<InstanceType<typeof DodoItemModal> | null>(null)

// ############################################################################

watch(() => store.doku.xabcdE.abdominal.value.guarding, (v) => {
  if (v != '' && store.doku.xabcdE.abdominal.value.pain == 'keine') {
    store.setAbdominalPain('')
  }
})

watch(() => ctx.value.isNonVerbal, (v) => {
  if (isRestoringReanimation(store.doku)) return
  if (v && store.doku.xabcdE.abdominal.value.pain != 'keine') {
    store.setAbdominalPain('keine')
  }
}, { flush: 'sync' })

</script>
<style scoped>

  ion-card {
    --card-bg: #FFFF3380;
  }

</style>
