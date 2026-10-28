<template>
  <DodoExaminationCard title="D - Disability">
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
      label="Orientierung (pädiatrisch)"
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
      label="Orientierung" lines="inset"
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
      label="GCS"
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

    <DodoInputToggle v-if="!ctx.isNonVerbal" lines="inset" v-model="store.doku.xabcDe.headache">
      Kopfschmerzen?
    </DodoInputToggle>

    <DodoInputSelect :model-value="store.doku.xabcDe.dizziness"
      @update:model-value="store.setDizziness($event as typeof store.doku.xabcDe.dizziness)"
      label="Schwindel" lines="full"
      :options="[
        { value: 'kein', label: 'Keiner' },
        { value: 'ungerichteter', label: 'Ungerichtet/Diffus' },
        { value: 'gerichteter', label: 'Dreh-/Schwankschwindel' },
      ]">
    </DodoInputSelect>

    <DodoExaminationItem id="neuro" label="Neuro-Befund" assessed-presets show-line="inset"
      v-model:assessed="store.doku.xabcDe.neuro.assessed"
      @select="resetNeuro" @activate="neuroModal?.open()" @remove="resetNeuro">
      <DodoItemModal ref="neuroModal" label="Neuro-Befund" modal-label="Neurologischer Befund"
        :state="store.doku.xabcDe.neuro.value.state" lines="none">

        <IonItemDivider v-if="!ctx.isNonVerbal">
          <IonLabel>Bewusstsein</IonLabel>
        </IonItemDivider>
        <DodoInputSelect v-if="!ctx.isNonVerbal" v-model="store.doku.xabcDe.neuro.value.followInstructions"
          label="Anweisungen befolgen" description="Zwinkern + nicht-paretische Hand öffnen/schließen"
          lines="none"
          :options="[
            { value: 'befolgt', label: 'Beide' },
            { value: 'teilweise befolgt', label: 'Eine' },
            { value: 'nicht befolgt', label: 'Keine' },
          ]">
        </DodoInputSelect>

        <IonItemDivider>
          <IonLabel>Motorik</IonLabel>
        </IonItemDivider>
        <DodoInputSelect v-model="store.doku.xabcDe.neuro.value.msFace"
          label="Fazialisparese" lines="full"
          :options="[
            { value: '', label: 'Keine' },
            { value: 'leichte', label: 'Leicht' },
            { value: 'ausgeprägte', label: 'Ausgeprägt' },
            { value: 'komplette', label: 'Komplett/Beidseitig' },
          ]">
        </DodoInputSelect>

        <DodoInputSelectLR v-model:left="store.doku.xabcDe.neuro.value.msArmLeft"
          v-model:right="store.doku.xabcDe.neuro.value.msArmRight"
          label="Armhalteversuch" lines="full"
          :options="[
            { value: 'ohne Absinken', label: 'Ohne Absinken' },
            { value: 'leichtes Absinken', label: 'Leichtes Absinken', color: 'yellow' },
            { value: 'Absinken', label: 'Voll Absinken', color: 'orange' },
            { value: 'nur Restbewegungen', label: 'Nur Restbewegung', color: 'red' },
            { value: 'keine aktive Bewegung', label: 'Keine Bewegung', color: 'red' },
          ]">
        </DodoInputSelectLR>

        <DodoInputSelectLR v-model:left="store.doku.xabcDe.neuro.value.msLegLeft"
          v-model:right="store.doku.xabcDe.neuro.value.msLegRight"
          label="Beinhalteversuch" lines="full"
          :options="[
            { value: 'ohne Absinken', label: 'Ohne Absinken' },
            { value: 'leichtes Absinken', label: 'Leichtes Absinken', color: 'yellow' },
            { value: 'Absinken', label: 'Voll Absinken', color: 'orange' },
            { value: 'nur Restbewegungen', label: 'Nur Restbewegung', color: 'red' },
            { value: 'keine aktive Bewegung', label: 'Keine Bewegung', color: 'red' },
          ]">
        </DodoInputSelectLR>

        <DodoInputSelect v-if="!ctx.isNonVerbal" v-model="store.doku.xabcDe.neuro.value.msMeningism"
          label="Nackensteife" lines="full"
          :options="[
            { value: '', label: 'Nicht Anwendbar' },
            { value: 'kein', label: 'Nein' },
            { value: 'leichter', label: 'Leicht' },
            { value: 'ausgeprägter', label: 'Ausgeprägt' },
          ]">
        </DodoInputSelect>

        <DodoInputToggle lines="none" v-model="store.doku.xabcDe.neuro.value.msTremor">
          Tremor/Myoklonien?
        </DodoInputToggle>

        <IonItemDivider v-if="!ctx.isNonVerbal">
          <IonLabel>Sensorik</IonLabel>
        </IonItemDivider>
        <DodoInputTextOptional v-if="!ctx.isNonVerbal" lines="inset"
          toggle-label="Sensibilität gestört?" v-model:toggle="store.doku.xabcDe.neuro.value.sensitivity.active"
          text-label="Wie?" text-placeholder="z.B. Taubheit li. Arm" v-model:text="store.doku.xabcDe.neuro.value.sensitivity.value">
        </DodoInputTextOptional>
        <DodoInputTextOptional v-if="!ctx.isNonVerbal" lines="none"
          toggle-label="Parästhesien?" v-model:toggle="store.doku.xabcDe.neuro.value.paraesthesia.active"
          text-label="Wie?" text-placeholder="z.B. Kribbeln li. Arm" v-model:text="store.doku.xabcDe.neuro.value.paraesthesia.value">
        </DodoInputTextOptional>

        <IonItemDivider v-if="!ctx.isNonVerbal">
          <IonLabel>Sprache</IonLabel>
        </IonItemDivider>
        <DodoInputSelect v-if="!ctx.isNonVerbal" v-model="store.doku.xabcDe.neuro.value.dysarthria"
          label="Artikulation" lines="inset"
          :options="[
            { value: '', label: 'Nicht Anwendbar' },
            { value: 'normal', label: 'Normal' },
            { value: 'verwaschen', label: 'Verwaschen' },
            { value: 'unverständlich', label: 'Unverständlich' },
            { value: 'stumm', label: 'Stumm' },
          ]">
        </DodoInputSelect>
        <DodoInputSelect v-if="!ctx.isNonVerbal" v-model="store.doku.xabcDe.neuro.value.aphasia"
          label="Aphasie" :description=" !aphasiaNote ? 'Sprachbildung + Verständnis' : aphasiaNote" lines="none"
          :options="[
            { value: '', label: 'Nicht Anwendbar' },
            { value: 'keine', label: 'Keine' },
            { value: 'leichte', label: 'Leichte' },
            { value: 'schwere', label: 'Schwere' },
            { value: 'globale', label: 'Global' },
          ]">
        </DodoInputSelect>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="psych" label="Psych-Befund" assessed-presets show-line="inset"
      v-model:assessed="store.doku.xabcDe.psych.assessed"
      @select="resetPsych" @activate="psychModal?.open()" @remove="resetPsych">
      <DodoItemModal ref="psychModal" lines="none" label="Psych-Befund"
        :state="store.doku.xabcDe.psych.value.state">

        <IonItemDivider>
          <IonLabel>Abweichungen</IonLabel>
        </IonItemDivider>
        <DodoInputSelect v-model="store.doku.xabcDe.psych.value.rass"
          label="Agitation" :description="rassDescription" lines="inset"
          :options="[
            { value: '', label: 'Ruhig' },
            { value: 'unruhig', label: 'Unruhig' },
            { value: 'agitiert', label: 'Agitiert' },
            { value: 'sehr agitiert', label: 'Sehr agitiert' },
            { value: 'streitsüchtig', label: 'Streitsüchtig' },
          ]">
        </DodoInputSelect>

        <DodoInputSelect v-model="store.doku.xabcDe.psych.value.disorder"
          label="Bewusstseinsstörung" :description="disorderDescription" lines="full"
          :options="[
            { value: '', label: 'Nein' },
            { value: 'Stupor', label: 'Stupor' },
            { value: 'Delir', label: 'Delir' },
          ]">
        </DodoInputSelect>

        <DodoInputToggle v-model="store.doku.xabcDe.psych.value.delusions">
          Wahnhaft?
        </DodoInputToggle>
        <DodoInputToggle v-model="store.doku.xabcDe.psych.value.hallucinations">
          Halluzinationen?
        </DodoInputToggle>
        <DodoInputToggle v-model="store.doku.xabcDe.psych.value.behavioralChange">
          Wesensverändert?
        </DodoInputToggle>
        <DodoInputToggle v-model="store.doku.xabcDe.psych.value.perseveration">
          Verbale Perseveration?
        </DodoInputToggle>
        <DodoInputToggle v-model="store.doku.xabcDe.psych.value.dementia">
          Demenz bekannt?
        </DodoInputToggle>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="bloodGlucose" label="Blutzucker" show-line="full"
      v-model:assessed="store.doku.xabcDe.bloodGlucose.assessed"
      @select="store.doku.xabcDe.bloodGlucose.value = 'normal'"
      @activate="bloodGlucoseSelect?.open()" @remove="store.doku.xabcDe.bloodGlucose.value = 'normal'">
      <DodoInputSelect ref="bloodGlucoseSelect" v-model="store.doku.xabcDe.bloodGlucose.value"
        label="Blutzucker" lines="none"
        :options="[
          { value: 'normal', label: 'Normal' },
          { value: 'niedrig', label: 'Niedrig' },
          { value: 'hoch', label: 'Hoch' },
        ]">
      </DodoInputSelect>
    </DodoExaminationItem>

    <DodoExaminationItem id="intoxication" label="Intoxikation möglich" show-line="full"
      v-model:assessed="store.doku.xabcDe.intoxication.assessed"
      @select="store.doku.xabcDe.intoxication.value = ''"
      @activate="intoxicationInput?.setFocus()" @remove="store.doku.xabcDe.intoxication.value = ''">
      <IonItem lines="none">
        <DodoInputText ref="intoxicationInput" label="Intoxikation" placeholder="z.B. C2-Geruch"
          v-model="store.doku.xabcDe.intoxication.value" />
      </IonItem>
    </DodoExaminationItem>

    <DodoInputToggle lines="none" v-if="store.doku.xabcDe.couldBeBaseline" v-model="store.doku.xabcDe.baseline">
      Entspricht Baseline?
    </DodoInputToggle>

  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import DodoItemModal from '@/components/DodoItemModal.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import { DisabilityNeuro, DisabilityPsych } from '@/types/protocol/abcde'

import { useDokuStore } from '@/store/doku'
import { isRestoringReanimation } from '@/store/reanimation'
const store = useDokuStore()
const ctx = computed(() => store.context)
const bloodGlucoseSelect = ref<InstanceType<typeof DodoInputSelect> | null>(null)
const neuroModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const psychModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const intoxicationInput = ref<InstanceType<typeof DodoInputText> | null>(null)

function resetNeuro() {
  store.doku.xabcDe.neuro.value = new DisabilityNeuro()
}

function resetPsych() {
  store.doku.xabcDe.psych.value = new DisabilityPsych()
}

// ############################################################################

const rassDescription = computed(() => {
  if (store.doku.xabcDe.psych.value.rass === 'streitsüchtig') {
    return 'Offenkundig aggressiv oder gewalttätig /  Gefahr für das Personal'
  } else if (store.doku.xabcDe.psych.value.rass === 'sehr agitiert') {
    return 'Zieht oder entfernt Schläuche oder Katheter / aggressives Verhalten gegenüber Personal'
  } else if (store.doku.xabcDe.psych.value.rass === 'agitiert') {
    return 'Häufige ungezielte Bewegung / atmet gegen das Beatmungsgerät'
  } else if (store.doku.xabcDe.psych.value.rass === 'unruhig') {
    return 'Ängstlich, aber Bewegungen nicht aggressiv oder lebhaft'
  } else {
    return 'Aufmerksam und Ruhig'
  }
})

const disorderDescription = computed(() => {
  if (store.doku.xabcDe.psych.value.disorder === 'Delir') {
    return 'Fluktuierende Aufmerksamkeits- und Orientierungsstörung mit möglicher Unruhe, Halluzinationen oder Apathie. Meist organisch bedingt.'
  } else if (store.doku.xabcDe.psych.value.disorder === 'Stupor') {
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

const aphasiaNote = computed(() => {
  if (store.doku.xabcDe.neuro.value.aphasia == 'leichte') {
    return 'Wortfindung, Ausdruck oder Verständnis eingeschränkt; Inhalte noch ausreichend vermittelbar.'
  } else if (store.doku.xabcDe.neuro.value.aphasia == 'schwere') {
    return 'Nur bruchstückhafte Verständigung; viel Nachfragen und Erschließen erforderlich.'
  } else if (store.doku.xabcDe.neuro.value.aphasia == 'globale') {
    return 'Keine verwertbare Sprachäußerung und kein verwertbares Sprachverständnis.'
  } else {
    return null
  }
})

// ############################################################################

watch(() => ctx.value.isNonVerbal, (isNonVerbal) => {
  if (isRestoringReanimation(store.doku)) return
  store.doku.xabcDe.headache = false
  if (isNonVerbal) {
    const defaults = new DisabilityNeuro()
    const neuro = store.doku.xabcDe.neuro.value
    neuro.followInstructions = defaults.followInstructions
    neuro.msMeningism = defaults.msMeningism
    neuro.sensitivity = defaults.sensitivity
    neuro.paraesthesia = defaults.paraesthesia
    neuro.dysarthria = defaults.dysarthria
    neuro.aphasia = defaults.aphasia
  }
}, { flush: 'sync' })

watch(() => store.doku.xabcDe.couldBeBaseline, () => {
  if (isRestoringReanimation(store.doku)) return
  store.doku.xabcDe.baseline = false
}, { flush: 'sync' })

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
