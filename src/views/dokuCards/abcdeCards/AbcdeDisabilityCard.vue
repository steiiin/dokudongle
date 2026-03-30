<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>D - Disablity</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <DodoInputSelect v-model="store.doku.xabcDe.avpu"
          label="Wachheit" lines="inset"
          :options="[
            { value: 'wach', label: 'Wach' },
            { value: 'benommen', label: 'Benommen' },
            { value: 'somnolent', label: 'Somnolent' },
            { value: 'soporös', label: 'Soporös' },
            { value: 'bewusstlos', label: 'Bewusstlos' },
          ]">
        </DodoInputSelect>

        <DodoItemModal v-if="!ctx.isNonVerbal && ctx.isPediatric" lines="inset"
          label="Orientierung (pädiatrisch)" modal-label="Orientierung (pädiatrisch)"
          :state="store.doku.xabcDe.zops.pediatricState">

          <DodoInputSelect v-model="store.doku.xabcDe.zops.consciousness"
            label="Vigilanz" lines="full"
            :options="[
              { value: 'aufmerksam', label: 'Aufmerksam' },
              { value: 'ablenkbar', label: 'Ablenkbar' },
              { value: 'unaufmerksam', label: 'Unaufmerksam' },
              { value: 'abwesend', label: 'Abwesend' },
            ]">
          </DodoInputSelect>
          <DodoInputSelect v-model="store.doku.xabcDe.zops.affect"
            label="Affekt" lines="full"
            :options="[
              { value: 'ruhig', label: 'Ruhig' },
              { value: 'troestbar', label: 'Tröstbar' },
              { value: 'untroestbar', label: 'Untröstbar' },
            ]">
          </DodoInputSelect>
          <DodoInputSelect v-model="store.doku.xabcDe.zops.response"
            label="Reaktion" lines="none"
            :options="[
              { value: 'adaequat', label: 'Adäquat' },
              { value: 'inadaequat', label: 'Inadaequat' },
              { value: 'keine', label: 'Keine' },
            ]">
          </DodoInputSelect>

        </DodoItemModal>

        <DodoItemModal v-if="!ctx.isNonVerbal && !ctx.isPediatric"
          label="Orientierung" modal-label="Orientierung" lines="inset"
          :state="store.doku.xabcDe.zops.adultState">

          <IonItem lines="inset">
            <IonLabel>Zeitlich</IonLabel>
            <DodoToggleGroup v-model="store.doku.xabcDe.zops.Z">
              <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
              <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
              <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
            </DodoToggleGroup>
          </IonItem>
          <IonItem lines="inset">
            <IonLabel>Örtlich</IonLabel>
            <DodoToggleGroup v-model="store.doku.xabcDe.zops.O">
              <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
              <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
              <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
            </DodoToggleGroup>
          </IonItem>
          <IonItem lines="inset">
            <IonLabel>Zur Person</IonLabel>
            <DodoToggleGroup v-model="store.doku.xabcDe.zops.P">
              <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
              <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
              <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
            </DodoToggleGroup>
          </IonItem>
          <IonItem lines="full">
            <IonLabel>Situativ</IonLabel>
            <DodoToggleGroup v-model="store.doku.xabcDe.zops.S">
              <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
              <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
              <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
            </DodoToggleGroup>
          </IonItem>

          <div class="quicktoggle">
            <IonChip color="success" v-if="!store.doku.xabcDe.zops.isOriented"
              @click="setZopsYes">
              <IonLabel>Alle Orientiert</IonLabel>
            </IonChip>
            <IonChip color="danger" v-if="!store.doku.xabcDe.zops.isUnoriented"
              @click="setZopsNo">
              <IonLabel>Alle Desorientiert</IonLabel>
            </IonChip>
          </div>

        </DodoItemModal>

        <DodoItemModal
          label="GCS" modal-label="GCS"
          :state="store.doku.xabcDe.gcsScore.toString()">

          <DodoInputSelect v-model="store.doku.xabcDe.gcs.a"
            label="Augen öffnen" lines="full"
            :options="[
              { value: 4, label: 'Spontan' },
              { value: 3, label: 'Auf Ansprache' },
              { value: 2, label: 'Auf Schmerzreiz' },
              { value: 1, label: 'Nein' },
            ]">
          </DodoInputSelect>

          <DodoInputSelect v-model="store.doku.xabcDe.gcs.v"
            label="Verbale Reaktion" lines="full"
            :options="[
              { value: 5, label: 'Konversationsfähig' },
              { value: 3, label: 'Wortsalat' },
              { value: 2, label: 'Laute' },
              { value: 1, label: 'Nein' },
            ]">
          </DodoInputSelect>

          <DodoInputSelect v-model="store.doku.xabcDe.gcs.m"
            label="Motorische Reaktion" lines="none"
            :options="[
              { value: 6, label: 'Auf Aufforderung' },
              { value: 5, label: 'Gezielte Abwehr' },
              { value: 4, label: 'Ungezielte Abwehr' },
              { value: 3, label: 'Dekortikationsstarre' },
              { value: 2, label: 'Dezerebrationsstarre' },
              { value: 1, label: 'Nein' },
            ]">
          </DodoInputSelect>

        </DodoItemModal>

        <DodoInputTextOptional :lines="(ctx.isNonVerbal || store.doku.xabcDe.paresis.active) ? 'full' : 'inset'"
          toggle-label="Paresen?" v-model:toggle="store.doku.xabcDe.paresis.active"
          text-label="Beschreibung:" v-model:text="store.doku.xabcDe.paresis.value"
          :autocorrect-fn="correctAnatomy">
        </DodoInputTextOptional>

        <DodoInputTextOptional v-if="!ctx.isNonVerbal" :lines="(store.doku.xabcDe.paresthesia.active) ? 'full' : 'inset'"
          toggle-label="Parästhesien?" v-model:toggle="store.doku.xabcDe.paresthesia.active"
          text-label="Beschreibung:" v-model:text="store.doku.xabcDe.paresthesia.value"
          :autocorrect-fn="correctAnatomy">
        </DodoInputTextOptional>

        <IonItem v-if="!ctx.isNonVerbal" lines="full">
          <IonToggle v-model="store.doku.xabcDe.aphasia" label-placement="end">
            Dysarthrie/Aphasie?
          </IonToggle>
        </IonItem>

        <IonItem v-if="!ctx.isNonVerbal" lines="full">
          <IonToggle v-model="store.doku.xabcDe.headache" label-placement="end">
            Kopfschmerzen?
          </IonToggle>
        </IonItem>

        <DodoInputSelect v-model="store.doku.xabcDe.dizziness"
          label="Schwindel" lines="full"
          :options="[
            { value: 'kein', label: 'Keiner' },
            { value: 'ungerichtet', label: 'Ungerichtet/Diffus' },
            { value: 'gerichtet', label: 'Dreh-/Schwankschwindel' },
          ]">
        </DodoInputSelect>

        <DodoItemModal
          label="Psych-Befund" modal-label="Psych-Befund"
          :state="store.doku.xabcDe.psychiatricState">

          <IonItemDivider>
            <IonLabel>Abweichungen</IonLabel>
          </IonItemDivider>
          <DodoInputSelect v-model="store.doku.xabcDe.psychRass"
            label="Agitation" lines="inset"
            :options="[
              { value: '', label: 'Ruhig' },
              { value: 'unruhig', label: 'Unruhig' },
              { value: 'agitiert', label: 'Agitiert' },
              { value: 'sehr agitiert', label: 'Sehr agitiert' },
              { value: 'streitsüchtig', label: 'Streitsüchtig' },
            ]">
          </DodoInputSelect>
          <IonItem lines="full" class="input-description">
            <IonNote slot="start">{{ rassDescription }}</IonNote>
          </IonItem>

          <DodoInputSelect v-model="store.doku.xabcDe.psychDisorder"
            label="Bewusstseinsstörung" :lines="!disorderDescription ? 'full' : 'inset'"
            :options="[
              { value: '', label: 'Nein' },
              { value: 'Stupor', label: 'Stupor' },
              { value: 'Delir', label: 'Delir' },
            ]">
          </DodoInputSelect>
          <IonItem  class="input-description" lines="full" v-if="!!disorderDescription">
            <IonNote slot="start">{{ disorderDescription }}</IonNote>
          </IonItem>

          <IonItem>
            <IonToggle v-model="store.doku.xabcDe.psychDelusions" label-placement="end">
              Wahnhaft?
            </IonToggle>
          </IonItem>
          <IonItem>
            <IonToggle v-model="store.doku.xabcDe.psychHallucinations" label-placement="end">
              Halluzinationen?
            </IonToggle>
          </IonItem>
          <IonItem>
            <IonToggle v-model="store.doku.xabcDe.psychBehavioralChange" label-placement="end">
              Wesensverändert?
            </IonToggle>
          </IonItem>
          <IonItem>
            <IonToggle v-model="store.doku.xabcDe.psychPerseveration" label-placement="end">
              Verbale Perseveration?
            </IonToggle>
          </IonItem>

          <IonItemDivider>
            <IonLabel>Vorbefund</IonLabel>
          </IonItemDivider>
          <IonItem>
            <IonToggle v-model="store.doku.xabcDe.psychDementia" label-placement="end">
              Demenz bekannt?
            </IonToggle>
          </IonItem>
          <IonItem lines="none" v-if="store.doku.xabcDe.couldBeBaseline">
            <IonToggle v-model="store.doku.xabcDe.psychBaseline" label-placement="end">
              Entspricht Baseline?
            </IonToggle>
          </IonItem>

        </DodoItemModal>

        <IonItem lines="full" v-if="store.doku.xabcDe.couldBeBaseline">
          <IonToggle v-model="store.doku.xabcDe.psychBaseline" label-placement="end">
            Entspricht Baseline?
          </IonToggle>
        </IonItem>

        <DodoInputSelect v-model="store.doku.xabcDe.bloodGlucose"
          label="Blutzucker" lines="full"
          :options="[
            { value: '', label: 'Nicht gemessen' },
            { value: 'normal', label: 'Normal' },
            { value: 'niedrig', label: 'Niedrig' },
            { value: 'hoch', label: 'Hoch' },
          ]">
        </DodoInputSelect>

        <DodoInputTextOptional lines="none"
          toggle-label="Intoxikation möglich?" v-model:toggle="store.doku.xabcDe.intoxication.active"
          text-label="Beschreibung" text-placeholder="z.B. C2-Geruch" v-model:text="store.doku.xabcDe.intoxication.value">
        </DodoInputTextOptional>

      </IonList>

      <DodoInputTreatment v-if="store.doku.xabcDe.needTreatment"
        v-model="store.doku.xabcDe.treatment"
        placeholder="Buccolam">
      </DodoInputTreatment>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { correctAnatomy } from '@/utils/autocorrect/anatomy'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const rassDescription = computed(() => {
  if (store.doku.xabcDe.psychRass === 'streitsüchtig') {
    return 'Offenkundig aggressiv oder gewalttätig, unmittelbare Gefahr für das Personal'
  } else if (store.doku.xabcDe.psychRass === 'sehr agitiert') {
    return 'Zieht oder entfernt Schläuche oder Katheter, oder zeigt aggressives Verhalten gegenüber Personal'
  } else if (store.doku.xabcDe.psychRass === 'agitiert') {
    return 'Häufige ungezielte Bewegung, atmet gegen das Beatmungsgerät'
  } else if (store.doku.xabcDe.psychRass === 'unruhig') {
    return 'Ängstlich aber Bewegungen nicht aggressiv oder lebhaft'
  } else {
    return 'Aufmerksam und Ruhig'
  }
})

const disorderDescription = computed(() => {
  if (store.doku.xabcDe.psychDisorder === 'Delir') {
    return 'Fluktuierende Aufmerksamkeits- und Orientierungsstörung mit möglicher Unruhe, Halluzinationen oder Apathie. Meist organisch bedingt.'
  } else if (store.doku.xabcDe.psychDisorder === 'Stupor') {
    return 'Der Patient reagiert kaum oder gar nicht auf Reize, zeigt aber offene Augen und scheinbare Wachheit. Meist psychisch bedingt.'
  } else {
    return ''
  }
})

// ############################################################################

const setZopsNo = () => {
  store.doku.xabcDe.zops.Z = 'nein'
  store.doku.xabcDe.zops.O = 'nein'
  store.doku.xabcDe.zops.P = 'nein'
  store.doku.xabcDe.zops.S = 'nein'
}

const setZopsYes = () => {
  store.doku.xabcDe.zops.Z = 'ja'
  store.doku.xabcDe.zops.O = 'ja'
  store.doku.xabcDe.zops.P = 'ja'
  store.doku.xabcDe.zops.S = 'ja'
}

// ############################################################################

watch(() => ctx.value.isNonVerbal, (v) => {
  store.doku.xabcDe.headache = false
})

watch(() => store.doku.xabcDe.couldBeBaseline, (v) => {
  store.doku.xabcDe.psychBaseline = false
})

</script>
<style scoped>

  ion-card {
    --card-bg: #FF7F0080;
  }

  .quicktoggle {
    margin-top: .5rem;
    padding-inline: .5rem;
    text-align: right;
  }

</style>