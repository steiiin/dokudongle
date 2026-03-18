<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>E - Exposure</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>

        <IonItem lines="full">
          <IonInput
            v-model="store.doku.xabcdE.bodyTemperature"
            label="Temperatur"
            type="number"
            placeholder="°C"
            :min="20"
            :max="42"
          ></IonInput>
        </IonItem>

        <IonItem :lines="store.doku.xabcdE.hasAssessedExcretions ? 'inset' : 'full'">
          <IonToggle v-model="store.doku.xabcdE.hasAssessedExcretions" label-placement="end">
            Ausscheidungen erfassen?
          </IonToggle>
        </IonItem>

        <template v-if="store.doku.xabcdE.hasAssessedExcretions">

          <DodoItemModal lines="inset"
            label="Wasserlassen" modal-label="Wasserlassen"
            :description="store.doku.xabcdE.urinary.text">

            <IonItemDivider>
              <IonLabel>Katheter</IonLabel>
            </IonItemDivider>

            <DodoInputSelect v-model="store.doku.xabcdE.urinary.catheterType"
              label="Typ" lines="full"
              :options="[
                { value: '', label: 'Kein Katheter' },
                { value: 'ISK', label: 'Einmalkatheter' },
                { value: 'transurethraler DK', label: 'Transurethral' },
                { value: 'suprapubischer DK', label: 'Suprapubisch' },
                { value: 'Nierenkatheter', label: 'Nierenkatheter' },
              ]">
            </DodoInputSelect>

            <DodoInputSelect v-if="store.doku.xabcdE.urinary.catheterType != ''"
              v-model="store.doku.xabcdE.urinary.catheterIssues"
              label="Komplikation" lines="full"
              :options="[
                { value: '', label: 'Keine' },
                { value: 'disloziert', label: 'Disloziert' },
                { value: 'gezogen', label: 'Gezogen' },
                { value: 'verstopft', label: 'Verstopft' },
              ]">
            </DodoInputSelect>

            <IonItemDivider>
              <IonLabel>Auffälligkeiten</IonLabel>
            </IonItemDivider>

            <DodoInputSelect
              v-model="store.doku.xabcdE.urinary.output"
              label="Ausfuhr" lines="full"
              :options="[
                { value: '', label: 'Normal' },
                { value: 'verringert', label: 'Verringert' },
                { value: 'Harnverhalt', label: 'Harnverhalt' },
                { value: 'vermehrt', label: 'Vermehrt' },
              ]">
            </DodoInputSelect>

            <IonItem>
              <IonSelect label="Erscheinung" interface="popover" :multiple="true" v-model="store.doku.xabcdE.urinary.abnormalities">
                <IonSelectOption value="blutig">Blutig</IonSelectOption>
                <IonSelectOption value="flockig">Flockig</IonSelectOption>
                <IonSelectOption value="dunkel">Dunkel</IonSelectOption>
                <IonSelectOption value="übelriechend">Übelriechend</IonSelectOption>
              </IonSelect>
            </IonItem>

          </DodoItemModal>

          <DodoInputTextOptional
            toggle-label="Stuhlgang auffällig?" v-model:toggle="store.doku.xabcdE.bowelAbnormalities.active"
            text-label="Beschreibung:" text-placeholder="z.B. Durchfall" v-model:text="store.doku.xabcdE.bowelAbnormalities.value"
            :autocorrect-fn="basicCap">
          </DodoInputTextOptional>

        </template>

        <IonItem lines="full">
          <IonToggle v-model="store.doku.xabcdE.urinaryIncontinence" label-placement="end">
            Eingenässt?
          </IonToggle>
        </IonItem>

        <IonItem>
          <IonToggle v-model="store.doku.xabcdE.nausea" label-placement="end">
            Übelkeit?
          </IonToggle>
        </IonItem>

        <DodoItemModal
          label="Erbrechen" modal-label="Erbrechen"
          :description="store.doku.xabcdE.emesis.text" lines="full">

          <DodoInputSelect
            v-model="store.doku.xabcdE.emesis.incidences"
            label="Erbrechen" lines="full"
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
          :description="store.doku.xabcdE.abdominalText" lines="none">

          <DodoInputSelect
            v-model="store.doku.xabcdE.abdominal.guarding"
            label="Abwehrspannung" lines="full"
            :options="[
              { value: '', label: 'Keine' },
              { value: 'leichte', label: 'Leicht' },
              { value: 'starke', label: 'Stark' },
            ]">
          </DodoInputSelect>

          <template v-if="!ctx.isNonVerbal">

            <DodoInputTextOptional
              toggle-label="Bauchschmerzen vorhanden?" v-model:toggle="store.doku.xabcdE.abdominal.pain.active"
              text-label="Beschreibung:" text-placeholder="z.B. UB-Schmerz re." v-model:text="store.doku.xabcdE.abdominal.pain.value"
              :autocorrect-fn="basicCap">
            </DodoInputTextOptional>

          </template>

          <DodoInputTextOptional
            toggle-label="Peristaltik gestört?" v-model:toggle="store.doku.xabcdE.abdominal.peristalsis.active"
            text-label="Beschreibung:" text-placeholder="z.B. li/unten verstummt" v-model:text="store.doku.xabcdE.abdominal.peristalsis.value"
            :autocorrect-fn="basicCap">
          </DodoInputTextOptional>

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

import { computed, ref, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
import { basicCap } from '@/utils/autocorrect/basic'
import { insetIf } from '@/utils/filter'
const store = useDokuStore()
const ctx = computed(() => store.context)

watch(() => store.doku.xabcdE.urinary.catheterType, (v) => {
  if (v === '') {
    store.doku.xabcdE.urinary.catheterIssues = ''
  }
})

watch(() => store.doku.xabcdE.abdominal.guarding, (v) => {
  if (v != '' && !store.doku.xabcdE.abdominal.pain.active) {
    store.doku.xabcdE.abdominal.pain.active = true
  }
})

watch(() => ctx.value.isNonVerbal, (v) => {
  if (v && store.doku.xabcdE.abdominal.pain.active) {
    store.doku.xabcdE.abdominal.pain.active = false
  }
})

</script>
<style scoped>

ion-card {
  --card-bg: #FFFF3380;
}

</style>
