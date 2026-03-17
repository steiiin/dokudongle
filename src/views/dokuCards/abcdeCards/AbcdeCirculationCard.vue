<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>C - Circulation</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <DodoItemModal label="Haut" modal-label="Hautbefund"
          :state="store.doku.xabCde.skinText" lines="full">

          <IonItemDivider>
            <IonLabel>Farbe</IonLabel>
          </IonItemDivider>
          <IonRadioGroup v-model="store.doku.xabCde.skin.color">
            <IonItem>
              <IonRadio value="rosig">Rosig</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="blass">Blass</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="marmoriert">Marmoriert</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="zyanotisch">Zyanotisch</IonRadio>
            </IonItem>
          </IonRadioGroup>

          <IonItemDivider>
            <IonLabel>Beschaffenheit</IonLabel>
          </IonItemDivider>
          <IonItem>
            <IonToggle v-model="store.doku.xabCde.skin.clammy" label-placement="end">
              Schweißig?
            </IonToggle>
          </IonItem>
          <IonItem>
            <IonToggle v-model="store.doku.xabCde.skin.poorSkinTurgor" label-placement="end">
              Stehende Hautfalten?
            </IonToggle>
          </IonItem>

          <IonItemDivider>
            <IonLabel>Temperatur (Extremitäten)</IonLabel>
          </IonItemDivider>
          <IonRadioGroup v-model="store.doku.xabCde.skin.peripheralTemp">
            <IonItem>
              <IonRadio value="warm">Warm</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="kühl">Kühl</IonRadio>
            </IonItem>
          </IonRadioGroup>

          <template v-if="store.doku.xabCde.skin.peripheralTemp == 'kühl'">

            <IonItemDivider>
              <IonLabel>Temperatur (Stamm)</IonLabel>
            </IonItemDivider>
            <IonRadioGroup v-model="store.doku.xabCde.skin.centralTemp">
              <IonItem>
                <IonRadio value="warm">Warm</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="kühl">Kühl</IonRadio>
              </IonItem>
            </IonRadioGroup>

          </template>

        </DodoItemModal>

        <DodoItemModal label="Puls" modal-label="Puls"
          :state="store.doku.xabCde.pulseText">

          <IonItemDivider>
            <IonLabel>Puls (Peripher)</IonLabel>
          </IonItemDivider>
          <IonRadioGroup v-model="store.doku.xabCde.pulse.peripheralStrength">
            <IonItem>
              <IonRadio value="gut">Gut tastbar</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="schlecht">Schlecht tastbar</IonRadio>
            </IonItem>
            <IonItem>
              <IonRadio value="nicht">Kein Puls</IonRadio>
            </IonItem>
          </IonRadioGroup>

          <template v-if="store.doku.xabCde.pulse.peripheralStrength != 'gut'">

            <IonItemDivider>
              <IonLabel>Puls (Zentral)</IonLabel>
            </IonItemDivider>
            <IonRadioGroup v-model="store.doku.xabCde.pulse.centralStrength">
              <IonItem>
                <IonRadio value="gut">Gut tastbar</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="schlecht">Schlecht tastbar</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="nicht">Kein Puls</IonRadio>
              </IonItem>
            </IonRadioGroup>

          </template>

          <template v-if="ctx.hasPulse">

            <IonItemDivider>
              <IonLabel>Frequenz</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonToggle v-model="store.doku.xabCde.pulse.rhythmic" label-placement="end">
                Regelmäßig?
              </IonToggle>
            </IonItem>

            <IonRadioGroup v-model="store.doku.xabCde.pulse.rate">
              <IonItem>
                <IonRadio value="normofrequent">Normofrequent</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="bradykard">Bradykard</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="tachykard">Tachykard</IonRadio>
              </IonItem>
            </IonRadioGroup>

          </template>

        </DodoItemModal>

        <DodoInputSelect v-model="store.doku.xabCde.rr" v-if="ctx.hasPulse"
          label="Blutdruck" lines="full"
          :options="[
            { value: '', label: 'Normoton' },
            { value: 'hypoton', label: 'Hypoton' },
            { value: 'hyperton', label: 'Hyperton' },
          ]">
        </DodoInputSelect>

        <DodoItemModal label="EKG" modal-label="EKG"
          :state="store.doku.xabCde.ecgState" lines="full">

          <IonItem :lines="store.doku.xabCde.ecg.assessed ? 'full' : 'none'">
            <IonToggle v-model="store.doku.xabCde.ecg.assessed" label-placement="end">
              EKG geschrieben?
            </IonToggle>
          </IonItem>

          <template v-if="store.doku.xabCde.ecg.assessed">

            <DodoInputSelect v-model="store.doku.xabCde.ecg.value"
              label="EKG" lines="full"
              :options="[
                { value: 'SR', label: 'Sinusrhythmus' },
                { value: 'VHF', label: 'Vorhofflimmern' },
              ]"
              allow-custom custom-label="Rhythmus"
              custom-placeholder="z.B. TAA 130-160/min">
            </DodoInputSelect>

          </template>

        </DodoItemModal>

        <DodoItemModal label="Brustschmerz" modal-label="Brustschmerz" v-if="!ctx.isNonVerbal"
          :state="store.doku.xabCde.chestpainState" lines="full">

          <IonItem lines="full">
            <IonToggle v-model="store.doku.xabCde.chest.tightness" label-placement="end">
              Brustenge?
            </IonToggle>
          </IonItem>

          <DodoInputSelect v-model="store.doku.xabCde.chest.pain" v-if="ctx.hasPulse"
            label="Blutdruck" lines="full"
            :options="[
              { value: 'keine', label: 'Keine' },
              { value: 'leichte', label: 'Leicht' },
              { value: '', label: 'Mittel' },
              { value: 'starke', label: 'Stark' },
            ]">
          </DodoInputSelect>

          <template v-if="store.doku.xabCde.chest.pain !== 'keine'">

            <IonItem lines="full">
              <IonToggle v-model="store.doku.xabCde.chest.tenderness" label-placement="end">
                Druckdolent?
              </IonToggle>
            </IonItem>

            <IonItem lines="full">
              <IonToggle v-model="store.doku.xabCde.chest.aggravation" label-placement="end">
                Bewegungsabhängig?
              </IonToggle>
            </IonItem>

            <DodoInputTextOptional lines="none"
              toggle-label="Strahlt aus?" v-model:toggle="store.doku.xabCde.chest.radiation.assessed"
              text-label="Wohin?" text-placeholder="z.B. li. Arm" v-model:text="store.doku.xabCde.chest.radiation.value"
              :autocorrect-fn="basicCap">
            </DodoInputTextOptional>

          </template>

        </DodoItemModal>

        <DodoInputSelect v-model="store.doku.xabCde.capillaryRefill" v-if="ctx.hasPulse"
          label="Rekap-Zeit" lines="full"
          :options="[
            { value: '1s', label: '1s' },
            { value: '2s', label: '2s' },
            { value: '3s', label: '3s' },
            { value: '>3s', label: '>3s' },
          ]">
        </DodoInputSelect>

        <DodoInputSelect v-model="store.doku.xabCde.edema.grade" v-if="ctx.hasPulse"
          label="Ödeme" lines="none"
          :options="[
            'keine Ödeme',
            'Knöchelödeme',
            'Unterschenkelödeme',
            'ausgeprägte abhängige Ödeme',
          ]">
        </DodoInputSelect>
        <DodoInputSelect v-model="store.doku.xabCde.edema.variation" v-if="ctx.hasPulse && store.doku.xabCde.edema.grade != 'keine Ödeme'"
          label="Verlauf" lines="none" empty-label="unklar"
          :options="[
            'neu aufgetreten',
            'zunehmend',
            'unverändert',
            'rückläufig',
          ]">
        </DodoInputSelect>

      </IonList>

      <DodoInputTreatment v-if="store.doku.xabCde.needTreatment"
        v-model="store.doku.xabCde.treatment"
        placeholder="Schocklagerung">
      </DodoInputTreatment>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { AssessedValue } from '@/types/protocol/input'
import { basicCap } from '@/utils/autocorrect/basic'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

watch(() => store.doku.xabCde.pulse.centralStrength, (v) => {
  if (v == 'schlecht' && store.doku.xabCde.pulse.peripheralStrength == 'gut') {
    store.doku.xabCde.pulse.peripheralStrength = 'schlecht'
  }
  if (v == 'nicht' && store.doku.xabCde.pulse.peripheralStrength != 'nicht') {
    store.doku.xabCde.pulse.peripheralStrength = 'nicht'
  }
})

watch(() => store.doku.xabCde.pulse.peripheralStrength, (v) => {
  if (v == 'gut') { store.doku.xabCde.pulse.centralStrength = 'gut' }
  if (v == 'schlecht' && store.doku.xabCde.pulse.centralStrength == 'nicht') {
    store.doku.xabCde.pulse.centralStrength = 'schlecht'
  }
})

watch(() => store.doku.xabCde.chest.pain, (v) => {
  if (v == 'keine') {
    store.doku.xabCde.chest.tenderness = false
    store.doku.xabCde.chest.aggravation = false
    store.doku.xabCde.chest.radiation = AssessedValue.unassessed('')
  }
})

watch(() => store.doku.xabCde.edema.grade, (v) => {
  if (v == 'keine Ödeme') { store.doku.xabCde.edema.variation = '' }
})

</script>
<style scoped>

ion-card {
  --card-bg: #984EA380;
}

</style>