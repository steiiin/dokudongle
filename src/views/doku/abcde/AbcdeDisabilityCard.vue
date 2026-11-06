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

    <DodoExaminationItem id="zops" label="Orientierung (pädiatrisch)" show-line="inset"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabcDe.isExamined('zops')"
      @update:assessed="store.doku.xabcDe.assessment.zops = $event ? 'active' : 'inactive'"
      @select="resetOrientation" @remove="resetOrientation"
      @activate="pediatricOrientationModal?.open()" :available="ctx.isPediatric">
      <DodoItemModal ref="pediatricOrientationModal" v-if="ctx.isPediatric" lines="none"
        label="Orientierung (pädiatrisch)"
        :state="store.doku.xabcDe.zops.pediatricState">

        <DodoInputSelect v-model="store.doku.xabcDe.zops.consciousness" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'"
          label="Vigilanz" lines="full"
          :options="[
            { value: 'aufmerksam', label: 'Aufmerksam' },
            { value: 'ablenkbar', label: 'Ablenkbar' },
            { value: 'unaufmerksam', label: 'Unaufmerksam' },
            { value: 'abwesend', label: 'Abwesend' },
          ]">
        </DodoInputSelect>
        <DodoInputSelect v-model="store.doku.xabcDe.zops.affect" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'"
          label="Affekt" lines="full"
          :options="[
            { value: 'ruhig', label: 'Ruhig' },
            { value: 'troestbar', label: 'Tröstbar' },
            { value: 'untroestbar', label: 'Untröstbar' },
          ]">
        </DodoInputSelect>
        <DodoInputSelect v-model="store.doku.xabcDe.zops.response" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'"
          label="Reaktion" lines="none"
          :options="[
            { value: 'adaequat', label: 'Adäquat' },
            { value: 'inadaequat', label: 'Inadaequat' },
            { value: 'keine', label: 'Keine' },
          ]">
        </DodoInputSelect>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="zops" label="Orientierung" show-line="inset"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabcDe.isExamined('zops')"
      @update:assessed="store.doku.xabcDe.assessment.zops = $event ? 'active' : 'inactive'"
      @select="resetOrientation" @remove="resetOrientation"
      @activate="orientationModal?.open()" :available="!ctx.isPediatric">
      <DodoItemModal ref="orientationModal" v-if="!ctx.isPediatric"
        label="Orientierung" lines="none"
        :state="store.doku.xabcDe.zops.adultState">

        <IonItem lines="inset">
          <IonLabel>Zeitlich</IonLabel>
          <DodoToggleGroup v-model="store.doku.xabcDe.zops.Z" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'">
            <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
            <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
            <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
          </DodoToggleGroup>
        </IonItem>
        <IonItem lines="inset">
          <IonLabel>Örtlich</IonLabel>
          <DodoToggleGroup v-model="store.doku.xabcDe.zops.O" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'">
            <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
            <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
            <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
          </DodoToggleGroup>
        </IonItem>
        <IonItem lines="inset">
          <IonLabel>Zur Person</IonLabel>
          <DodoToggleGroup v-model="store.doku.xabcDe.zops.P" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'">
            <DodoToggleButton color="success" value="ja">Ja</DodoToggleButton>
            <DodoToggleButton color="warning" value="teilweise">Teilw.</DodoToggleButton>
            <DodoToggleButton color="danger" value="nein">Nein</DodoToggleButton>
          </DodoToggleGroup>
        </IonItem>
        <IonItem lines="full">
          <IonLabel>Situativ</IonLabel>
          <DodoToggleGroup v-model="store.doku.xabcDe.zops.S" @update:model-value="store.doku.xabcDe.assessment.zops = 'active'">
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
    </DodoExaminationItem>

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

    <DodoExaminationItem id="headache" label="Kopfschmerzen" show-line="full"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabcDe.isExamined('headache')"
      @update:assessed="store.doku.xabcDe.assessment.headache = $event ? 'active' : 'inactive'"
      @select="store.doku.xabcDe.headache = true" @remove="store.doku.xabcDe.headache = false">
      <DodoInputToggle lines="none" v-model="store.doku.xabcDe.headache" @update:model-value="store.doku.xabcDe.assessment.headache = 'active'">
        Kopfschmerzen?
      </DodoInputToggle>
    </DodoExaminationItem>

    <DodoExaminationItem id="dizziness" label="Schwindel" show-line="full"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabcDe.isExamined('dizziness')"
      @update:assessed="store.doku.xabcDe.assessment.dizziness = $event ? 'active' : 'inactive'"
      @select="store.setDizziness('kein')" @remove="store.setDizziness('kein', false)"
      @activate="dizzinessSelect?.open()">
      <DodoInputSelect ref="dizzinessSelect" :model-value="store.doku.xabcDe.dizziness"
        @update:model-value="store.setDizziness($event as typeof store.doku.xabcDe.dizziness)"
        label="Schwindel" lines="none"
        :options="[
          { value: 'kein', label: 'Keiner' },
          { value: 'ungerichteter', label: 'Ungerichtet/Diffus' },
          { value: 'gerichteter', label: 'Dreh-/Schwankschwindel' },
        ]">
      </DodoInputSelect>
    </DodoExaminationItem>

    <DodoInputToggle lines="full" v-if="store.doku.xabcDe.couldBeBaseline" v-model="store.doku.xabcDe.baseline">
      Entspricht Baseline?
    </DodoInputToggle>

    <DodoExaminationItem id="neuro" label="Neuro-Befund" show-line="full"
      v-model:assessed="store.doku.xabcDe.neuro.assessed"
      @select="selectNeuro" @activate="neuroModal?.open()" @remove="resetNeuro">
      <DodoItemModal ref="neuroModal" label="Neuro-Befund" modal-label="Neurologischer Befund"
        :state="store.doku.xabcDe.neuro.value.state" lines="none">

        <IonItemDivider>
          <IonLabel>Bewusstsein</IonLabel>
        </IonItemDivider>
        <DodoExaminationItem id="followInstructions" label="Anweisungen befolgen" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('followInstructions')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.followInstructions = $event ? 'active' : 'inactive'"
          @select="resetNeuroField('followInstructions')" @remove="resetNeuroField('followInstructions')"
          @activate="followInstructionsSelect?.open()">
          <DodoInputSelect ref="followInstructionsSelect" v-model="store.doku.xabcDe.neuro.value.followInstructions" @update:model-value="store.doku.xabcDe.neuro.value.assessment.followInstructions = 'active'"
            label="Anweisungen befolgen" description="Zwinkern + nicht-paretische Hand öffnen/schließen"
            lines="none"
            :options="[
              { value: 'befolgt', label: 'Beide' },
              { value: 'teilweise befolgt', label: 'Eine' },
              { value: 'nicht befolgt', label: 'Keine' },
            ]">
          </DodoInputSelect>
        </DodoExaminationItem>

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

        <DodoExaminationItem id="msMeningism" label="Nackensteife" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('msMeningism')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.msMeningism = $event ? 'active' : 'inactive'"
          @select="resetNeuroField('msMeningism')" @remove="resetNeuroField('msMeningism')"
          @activate="msMeningismSelect?.open()">
          <DodoInputSelect ref="msMeningismSelect" v-model="store.doku.xabcDe.neuro.value.msMeningism" @update:model-value="store.doku.xabcDe.neuro.value.assessment.msMeningism = 'active'"
            label="Nackensteife" lines="none"
            :options="[
              { value: '', label: 'Nicht Anwendbar' },
              { value: 'kein', label: 'Nein' },
              { value: 'leichter', label: 'Leicht' },
              { value: 'ausgeprägter', label: 'Ausgeprägt' },
            ]">
          </DodoInputSelect>
        </DodoExaminationItem>

        <DodoInputToggle lines="none" v-model="store.doku.xabcDe.neuro.value.msTremor">
          Tremor/Myoklonien?
        </DodoInputToggle>

        <IonItemDivider>
          <IonLabel>Sensorik</IonLabel>
        </IonItemDivider>
        <DodoExaminationItem id="sensitivity" label="Sensibilität gestört?" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('sensitivity')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.sensitivity = $event ? 'active' : 'inactive'"
          @select="store.doku.xabcDe.neuro.value.sensitivity.active = true" @remove="resetNeuroField('sensitivity')" @activate="sensitivityInput?.focus()">
          <DodoInputTextOptional ref="sensitivityInput" lines="none"
            toggle-label="Sensibilität gestört?" v-model:toggle="store.doku.xabcDe.neuro.value.sensitivity.active" @update:toggle="store.doku.xabcDe.neuro.value.assessment.sensitivity = 'active'"
            text-label="Wie?" text-placeholder="z.B. Taubheit li. Arm" v-model:text="store.doku.xabcDe.neuro.value.sensitivity.value" @update:text="store.doku.xabcDe.neuro.value.assessment.sensitivity = 'active'">
          </DodoInputTextOptional>
        </DodoExaminationItem>
        <DodoExaminationItem id="paraesthesia" label="Parästhesien?" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('paraesthesia')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.paraesthesia = $event ? 'active' : 'inactive'"
          @select="store.doku.xabcDe.neuro.value.paraesthesia.active = true" @remove="resetNeuroField('paraesthesia')" @activate="paraesthesiaInput?.focus()">
          <DodoInputTextOptional ref="paraesthesiaInput" lines="none"
            toggle-label="Parästhesien?" v-model:toggle="store.doku.xabcDe.neuro.value.paraesthesia.active" @update:toggle="store.doku.xabcDe.neuro.value.assessment.paraesthesia = 'active'"
            text-label="Wie?" text-placeholder="z.B. Kribbeln li. Arm" v-model:text="store.doku.xabcDe.neuro.value.paraesthesia.value" @update:text="store.doku.xabcDe.neuro.value.assessment.paraesthesia = 'active'">
          </DodoInputTextOptional>
        </DodoExaminationItem>

        <IonItemDivider>
          <IonLabel>Sprache</IonLabel>
        </IonItemDivider>
        <DodoExaminationItem id="dysarthria" label="Artikulation" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('dysarthria')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.dysarthria = $event ? 'active' : 'inactive'"
          @select="resetNeuroField('dysarthria')" @remove="resetNeuroField('dysarthria')"
          @activate="dysarthriaSelect?.open()">
          <DodoInputSelect ref="dysarthriaSelect" v-model="store.doku.xabcDe.neuro.value.dysarthria" @update:model-value="store.doku.xabcDe.neuro.value.assessment.dysarthria = 'active'"
            label="Artikulation" lines="none"
            :options="[
              { value: '', label: 'Nicht Anwendbar' },
              { value: 'normal', label: 'Normal' },
              { value: 'verwaschen', label: 'Verwaschen' },
              { value: 'unverständlich', label: 'Unverständlich' },
              { value: 'stumm', label: 'Stumm' },
            ]">
          </DodoInputSelect>
        </DodoExaminationItem>
        <DodoExaminationItem id="aphasia" label="Aphasie" show-line="inset"
          :removable="store.context.isNonVerbal"
          :assessed="store.doku.xabcDe.neuro.value.isExamined('aphasia')"
          @update:assessed="store.doku.xabcDe.neuro.value.assessment.aphasia = $event ? 'active' : 'inactive'"
          @select="resetNeuroField('aphasia')" @remove="resetNeuroField('aphasia')"
          @activate="aphasiaSelect?.open()">
          <DodoInputSelect ref="aphasiaSelect" v-model="store.doku.xabcDe.neuro.value.aphasia" @update:model-value="store.doku.xabcDe.neuro.value.assessment.aphasia = 'active'"
            label="Aphasie" :description=" !aphasiaNote ? 'Sprachbildung + Verständnis' : aphasiaNote" lines="none"
            :options="[
              { value: '', label: 'Nicht Anwendbar' },
              { value: 'keine', label: 'Keine' },
              { value: 'leichte', label: 'Leichte' },
              { value: 'schwere', label: 'Schwere' },
              { value: 'globale', label: 'Global' },
            ]">
          </DodoInputSelect>
        </DodoExaminationItem>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="psych" label="Psych-Befund" show-line="full"
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

        <DodoInputToggleOptional id="delusions" label="Wahnhaft?" v-model="store.doku.xabcDe.psych.value.delusions" />
        <DodoInputToggleOptional id="hallucinations" label="Halluzinationen?" v-model="store.doku.xabcDe.psych.value.hallucinations" />
        <DodoInputToggleOptional id="behavioralChange" label="Wesensverändert?" v-model="store.doku.xabcDe.psych.value.behavioralChange" />
        <DodoInputToggleOptional id="perseveration" label="Verbale Perseveration?" v-model="store.doku.xabcDe.psych.value.perseveration" />
        <DodoInputToggleOptional id="dementia" label="Demenz bekannt?" v-model="store.doku.xabcDe.psych.value.dementia" />

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

    <DodoExaminationItem id="intoxication" label="Intoxikation möglich?" show-line="full"
      :assessed="store.doku.xabcDe.intoxication.assessed"
      @update:assessed="store.setIntoxicationAssessed"
      @activate="intoxicationModal?.open()">
      <BlockIntoxikationCard ref="intoxicationModal" />
    </DodoExaminationItem>

  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputTextOptional from '@/components/inputs/DodoInputTextOptional.vue'
import BlockIntoxikationCard from '../blocks/BlockIntoxikationCard.vue'
import { DisabilityNeuro, DisabilityPsych, DisabilityZops } from '@/types/protocol/abcde'

import { useDokuStore } from '@/store/doku'
import { isRestoringReanimation } from '@/store/reanimation'
const store = useDokuStore()
const ctx = computed(() => store.context)
const bloodGlucoseSelect = ref<InstanceType<typeof DodoInputSelect> | null>(null)
const neuroModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const psychModal = ref<InstanceType<typeof DodoItemModal> | null>(null)
const intoxicationModal = ref<InstanceType<typeof BlockIntoxikationCard>>()
const orientationModal = ref<InstanceType<typeof DodoItemModal>>()
const pediatricOrientationModal = ref<InstanceType<typeof DodoItemModal>>()
const dizzinessSelect = ref<InstanceType<typeof DodoInputSelect>>()
const followInstructionsSelect = ref<InstanceType<typeof DodoInputSelect>>()
const msMeningismSelect = ref<InstanceType<typeof DodoInputSelect>>()
const dysarthriaSelect = ref<InstanceType<typeof DodoInputSelect>>()
const sensitivityInput = ref<InstanceType<typeof DodoInputTextOptional>>()
const paraesthesiaInput = ref<InstanceType<typeof DodoInputTextOptional>>()
const aphasiaSelect = ref<InstanceType<typeof DodoInputSelect>>()

function resetOrientation() {
  store.doku.xabcDe.zops = new DisabilityZops()
}

function resetNeuroField<K extends keyof DisabilityNeuro['assessment']>(field: K) {
  store.doku.xabcDe.neuro.value[field] = new DisabilityNeuro()[field]
}

function selectNeuro() {
  const intent = { ...store.doku.xabcDe.neuro.value.assessment }
  resetNeuro()
  const neuro = store.doku.xabcDe.neuro.value
  neuro.assessment = intent
}


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
  store.doku.xabcDe.assessment.zops = 'active'
  store.doku.xabcDe.zops.Z = 'nein'
  store.doku.xabcDe.zops.O = 'nein'
  store.doku.xabcDe.zops.P = 'nein'
  store.doku.xabcDe.zops.S = 'nein'
}

const setZopsYes = () => {
  store.doku.xabcDe.assessment.zops = 'active'
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
