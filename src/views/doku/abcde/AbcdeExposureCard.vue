<template>
  <DodoExaminationCard title="E - Exposure">

    <IonItem lines="full">
      <DodoInputTemperature
        v-model="store.doku.xabcdE.bodyTemperature">
      </DodoInputTemperature>
    </IonItem>

    <DodoExaminationItem id="nausea" label="Übelkeit" show-line="full"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabcdE.isExamined('nausea')"
      @update:assessed="store.doku.xabcdE.assessment.nausea = $event ? 'active' : 'inactive'"
      @select="store.doku.xabcdE.nausea = true" @remove="store.doku.xabcdE.nausea = false">
      <DodoInputToggle v-model="store.doku.xabcdE.nausea" @update:model-value="store.doku.xabcdE.assessment.nausea = 'active'" lines="none">
        Übelkeit?
      </DodoInputToggle>
    </DodoExaminationItem>

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

    <DodoInputToggleOptional id="urinaryIncontinence" label="Eingenässt?" lines="full" v-model="store.doku.xabcdE.urinaryIncontinence" />

    <DodoExaminationItem id="excretions" label="Ausscheidung" show-line="full"
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
          <template #label-end><DodoBlockSourceShortcut source="excretions_urinary" /></template>
        </DodoInputToggle>
        <DodoInputToggle lines="none" :model-value="store.doku.xabcdE.excretions.value.bowelAbnormalities" @update:model-value="store.setBowelAbnormalities">
          Stuhlgang auffällig?
          <template #label-end><DodoBlockSourceShortcut source="excretions_bowel" /></template>
        </DodoInputToggle>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="abdominal" label="Bauchbefund"
      :assessed="store.doku.xabcdE.abdominal.assessed" @update:assessed="store.setAbdominalAssessed" show-line="full"
      @select="selectAbdominal" @activate="abdominalModal?.open()" @remove="store.resetAbdominal">
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

        <DodoExaminationItem id="pain" label="Bauchschmerzen" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcdE.abdominal.value.isExamined('pain')"
          @update:assessed="store.doku.xabcdE.abdominal.value.assessment.pain = $event ? 'active' : 'inactive'"
          @select="store.setAbdominalPain('keine')" @remove="store.setAbdominalPain('keine', false)"
          @activate="abdominalPainSelect?.open()">
          <DodoInputSelect ref="abdominalPainSelect"
            :model-value="store.doku.xabcdE.abdominal.value.pain"
            @update:model-value="store.setAbdominalPain($event as ExposureAbdominal['pain'])"
            label="Bauchschmerzen" lines="none"
            :options="[
              { value: 'keine', label: 'Keine' },
              { value: 'leichte', label: 'Leicht' },
              { value: '', label: 'Mittel' },
              { value: 'starke', label: 'Stark' },
            ]">
            <template #label-end><DodoBlockSourceShortcut source="bauchschmerz" /></template>
          </DodoInputSelect>
        </DodoExaminationItem>

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

    <DodoExaminationItem id="pregnancy" label="Schwangerschaft" show-line="full"
      :available="ctx.isChildbearingAge || store.doku.xabcdE.pregnancy.assessed"
      :assessed="store.doku.xabcdE.pregnancy.assessed" @update:assessed="store.setPregnancyAssessed"
      @select="store.setPregnancy(true)">
      <DodoInputToggle :model-value="store.doku.xabcdE.pregnancy.value"
        @update:model-value="store.setPregnancy" lines="none">
        Schwangerschaft
        <template #label-end><DodoBlockSourceShortcut source="schwangerschaft" /></template>
      </DodoInputToggle>
    </DodoExaminationItem>

  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'

import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import type { ExposureAbdominal, ExposureExcretions } from '@/types/protocol/abcde'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)
const abdominalPainSelect = ref<InstanceType<typeof DodoInputSelect>>()
function selectAbdominal() {
  const intent = { ...store.doku.xabcdE.abdominal.value.assessment }
  store.resetAbdominal()
  const abdominal = store.doku.xabcdE.abdominal.value
  abdominal.assessment = intent
}
const abdominalModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const excretionsModal = ref<InstanceType<typeof DodoItemModal> | null>(null)

// ############################################################################

watch(() => store.doku.xabcdE.abdominal.value.guarding, (v) => {
  if (v != '' && store.doku.xabcdE.abdominal.value.isExamined('pain') && store.doku.xabcdE.abdominal.value.pain == 'keine') {
    store.setAbdominalPain('', false)
  }
})



</script>
<style scoped>

  ion-card {
    --card-bg: #FFFF3380;
  }

</style>
