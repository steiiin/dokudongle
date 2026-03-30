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

        <IonItem :lines="store.doku.xabcdE.hasAssessedExcretions ? 'inset' : 'full'">
          <IonToggle v-model="store.doku.xabcdE.hasAssessedExcretions" label-placement="end">
            Ausscheidungen erfassen?
          </IonToggle>
        </IonItem>

        <template v-if="store.doku.xabcdE.hasAssessedExcretions">

          <DodoItemModal lines="inset"
            label="Wasserlassen" modal-label="Wasserlassen"
            :state="store.doku.xabcdE.urinary.text">

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

          <IonItem :lines="store.doku.xabcdE.abdominal.assessed ? 'full' : 'none'">
            <IonToggle v-model="store.doku.xabcdE.abdominal.assessed" label-placement="end">
              Bauch untersucht?
            </IonToggle>
          </IonItem>

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

import { basicCap } from '@/utils/autocorrect/basic'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

watch(() => store.doku.xabcdE.urinary.catheterType, (v) => {
  if (v === '') {
    store.doku.xabcdE.urinary.catheterIssues = ''
  }
})

watch(() => store.doku.xabcdE.abdominal.value.guarding, (v) => {
  if (v != '' && store.doku.xabcdE.abdominal.value.pain == 'keine') {
    store.doku.xabcdE.abdominal.value.pain = ''
  }
})

watch(() => ctx.value.isNonVerbal, (v) => {
  if (v && store.doku.xabcdE.abdominal.value.pain != 'keine') {
    store.doku.xabcdE.abdominal.value.pain = 'keine'
  }
})

</script>
<style scoped>

  ion-card {
    --card-bg: #FFFF3380;
  }

</style>
