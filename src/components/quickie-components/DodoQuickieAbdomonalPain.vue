<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Bauchschmerz (OPQRST)</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="handleCancel">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton color="primary" @click="handleAccept">Einfügen</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">

      <div class="dd-quickie-preview"
        v-html="previewText">
      </div>

      <IonList>

        <ion-item-divider>
          <ion-label>Region</ion-label>
        </ion-item-divider>

        <IonItem lines="inset">
          <IonLabel>Oberbauch</IonLabel>
          <DodoToggleChip v-model="localRegion.obre" color="danger">Rechts</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.obmi" color="danger">Mitte</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.obli" color="danger">Links</DodoToggleChip>
        </IonItem>
        <IonItem lines="inset">
          <IonLabel>Mittelbauch</IonLabel>
          <DodoToggleChip v-model="localRegion.mbre" color="warning">Rechts</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.mbmi" color="warning">Mitte</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.mbli" color="warning">Links</DodoToggleChip>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>Unterbauch</IonLabel>
          <DodoToggleChip v-model="localRegion.ubre" color="primary">Rechts</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.ubmi" color="primary">Mitte</DodoToggleChip>
          <DodoToggleChip v-model="localRegion.ubli" color="primary">Links</DodoToggleChip>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>O</b>nset</ion-label>
        </ion-item-divider>
        <DodoInputSelect label="Wie" v-model="localOnset"
          empty-label="Unklar"
          :options="[
            { value: 'plötzlicher Beginn', label: 'plötzlich' },
            { value: 'schleichender Beginn', label: 'schleichend' },
          ]">
        </DodoInputSelect>
        <DodoInputSelect label="Wann" v-model="localOnspan"
          empty-label="Akut" lines="none"
          :options="[
            'seit Stunden', 'seit Tagen', 'seit Wochen', 'seit Gestern',
          ]"
          allow-custom custom-label="" custom-placeholder="z.B. heute früh">
        </DodoInputSelect>

        <ion-item-divider>
          <ion-label><b>P</b>rovokation <i>(Verschlechterung)</i></ion-label>
        </ion-item-divider>
        <IonItem lines="none">
          <div class="chip-container">
            <DodoToggleChip v-for="entry in provocationSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>P</b>alliation <i>(Verbesserung)</i></ion-label>
        </ion-item-divider>
        <IonItem lines="none">
          <div class="chip-container">
            <DodoToggleChip v-for="entry in palliationSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>Q</b>ualität</ion-label>
        </ion-item-divider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in qualitySet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>R</b>adiation</ion-label>
        </ion-item-divider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in radiationSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>S</b>everity <i>(Schmerzskala)</i></ion-label>
        </ion-item-divider>
        <DodoInputSelect label="Schmerzen" v-model="localSeverity"
          :options="[
            { value: 'minimal', label: 'Minimal (0-1)' },
            { value: 'leicht', label: 'Leicht (2-3)' },
            { value: 'mittel', label: 'Mittel (4-6)' },
            { value: 'stark', label: 'Stark (7-8)' },
            { value: 'maximal', label: 'Maximal (9-10)' },
          ]" lines="none">
        </DodoInputSelect>

        <ion-item-divider>
          <ion-label><b>T</b>ime <i>(Verlauf)</i></ion-label>
        </ion-item-divider>
        <DodoInputTextOptional lines="none"
          toggle-label="Verlauf erfassen?" v-model:toggle="localTime.active"
          text-label="" text-placeholder="z.B. erstmalig, gleichbleibend" v-model:text="localTime.value">
        </DodoInputTextOptional>

      </IonList>

    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { QuickieAbdominalPain, QuickieAbdominalPainRegion } from '@/data/quickies'
import { concatDoku, prefix } from '@/utils/text'
import { prefixSeit } from '@/utils/prefix/general';
import { OptionalValue } from '@/types/protocol/input';
import { textIf } from '@/utils/filter';

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieAbdominalPain
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

// ############################################################################

const previewText = computed(() => {
  return prefix('Bauchschmerz: ', concatDoku([
    localRegion.value.regionText,
    severityText.value,
    [ prefixSeit(localOnspan.value), localOnset.value ],
    provocationText.value,
    palliationText.value,
    qualitySet.value.filter(e=>e.enabled).map(e=>e.label),
    radiationText.value,
    textIf(localTime.value.value, localTime.value.isActive),
  ]))
})

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const handleAccept = () => {
  emit('accept', `${previewText.value}\n`)
}

// ############################################################################

const localRegion = ref<QuickieAbdominalPainRegion>(props.quickie.region)
const localOnset = ref<string>(props.quickie.onset)
const localOnspan = ref<string>(props.quickie.onspan)
const localProvocation = ref<string[]>(props.quickie.provocation)
const localPalliation = ref<string[]>(props.quickie.palliation)
const localQuality = ref<string[]>(props.quickie.quality)
const localRadiation = ref<string[]>(props.quickie.radiation)
const localSeverity = ref<string>(props.quickie.severity)
const localTime = ref<OptionalValue<string>>(props.quickie.time)

watch(() => props.quickie, (v) => {

  localRegion.value = v.region
  localOnset.value = v.onset
  localOnspan.value = v.onspan
  localProvocation.value = v.provocation
  localPalliation.value = v.palliation
  localQuality.value = v.quality
  localRadiation.value = v.radiation
  localSeverity.value = v.severity
  localTime.value = v.time

  provocationSet.value.forEach(entry => {
    entry.enabled =
      v.provocation.includes(entry.label)
  })
  palliationSet.value.forEach(entry => {
    entry.enabled =
      v.palliation.includes(entry.label)
  })
  qualitySet.value.forEach(entry => {
    entry.enabled =
      v.quality.includes(entry.label)
  })
  radiationSet.value.forEach(entry => {
    entry.enabled =
      v.radiation.includes(entry.label)
  })


})

// ############################################################################

const getConcatText = (list: Array<string>): string => {
  if (list.length <= 1) { return list.pop() ?? '' }
  else {
    const lastEntry = list.pop()
    return `${list.join(', ')} & ${lastEntry}`
  }
}

// ############################################################################

const provocationText = computed(() => {

  const enabled = provocationSet.value.filter(e=>e.enabled)
  if (enabled.length==0) { return '' }

  const segments: Array<string> = []
  const groups: Record<string, string[]> = {}
  for (const entry of enabled) {
    if (!entry.prep) continue
    if (!groups[entry.prep]) { groups[entry.prep] = [] }
    groups[entry.prep].push(entry.value ?? entry.label)
  }
  const singlePrep = Object.keys(groups).length<=1
  for (const prep in groups) {
    const concat = singlePrep ? getConcatText(groups[prep]) : groups[prep].join(', ')
    segments.push(`${prep} ${concat}`)
  }

  const _concat = segments.length>0 ? segments.join(' & ')+' schlimmer' : ''

  return concatDoku([[ _concat ]], false)

})

const palliationText = computed(() => {

  const enabled = palliationSet.value.filter(e=>e.enabled)
  if (enabled.length==0) { return '' }

  const segments: Array<string> = []
  const groups: Record<string, string[]> = {}
  for (const entry of enabled) {
    if (!entry.prep) continue
    if (!groups[entry.prep]) { groups[entry.prep] = [] }
    groups[entry.prep].push(entry.value ?? entry.label)
  }
  const singlePrep = Object.keys(groups).length<=1
  for (const prep in groups) {
    const concat = singlePrep ? getConcatText(groups[prep]) : groups[prep].join(', ')
    segments.push(`${prep} ${concat}`)
  }

  const _concat = segments.length>0 ? segments.join(' & ')+' besser' : ''

  return concatDoku([[ _concat ]], false)

})

const provocationSet = ref([
  { label: 'Atmung',              value: 'tiefer Atmung', color: 'primary', prep: 'bei', enabled: false },
  { label: 'Bewegung',            color: 'warning', prep: 'bei', enabled: false },
  { label: 'Erschütterung',       color: 'warning', prep: 'bei', enabled: false },
  { label: 'Lagewechsel',         color: 'warning', prep: 'bei', enabled: false },
  { label: 'Belastung',           color: 'success', prep: 'bei', enabled: false },
  { label: 'Nahrungsaufnahme',    color: 'success', prep: 'nach', enabled: false },
])

const palliationSet = ref([
  { label: 'Ruhe',      value: 'körperl. Schonung', color: 'primary', prep: 'bei', enabled: false },
  { label: 'Sitzen',    color: 'warning', prep: 'im', enabled: false },
  { label: 'Stehen',    color: 'warning', prep: 'im', enabled: false },
  { label: 'Stuhlgang', color: 'success', prep: 'nach', enabled: false },
  { label: 'Erbrechen', color: 'success', prep: 'nach', enabled: false },
])

// ############################################################################

const qualitySet = ref([
  { label: 'brennend',      color: 'primary', enabled: false },
  { label: 'stechend',      color: 'primary', enabled: false },
  { label: 'dumpf',         color: 'success', enabled: false },
  { label: 'drückend',      color: 'success', enabled: false },
  { label: 'ziehend',       color: 'success', enabled: false },
  { label: 'krampfartig',   color: 'warning', enabled: false },
  { label: 'wellenförmig',  color: 'warning', enabled: false },
])

// ############################################################################

const radiationText = computed(() => {

  const enabled = radiationSet.value.filter(e=>e.enabled)
  if (enabled.length==0) { return '' }
  return 'strahlt aus in ' + getConcatText(enabled.map(e=>e.value ?? e.label))

})
const radiationSet = ref([

  { label: 'Flanke re.',      color: 'primary', value: 're. Flanke', enabled: false },
  { label: 'Flanke li.',      color: 'primary', value: 'li. Flanke', enabled: false },
  { label: 'Schulter re.',    color: 'primary', value: 're. Schulter', enabled: false },
  { label: 'Schulter li.',    color: 'primary', value: 'li. Schulter', enabled: false },

  { label: 'Leiste re.',      color: 'success', value: 're. Leiste', enabled: false },
  { label: 'Leiste li.',      color: 'success', value: 'li. Leiste', enabled: false },
  { label: 'Genitalregion',   color: 'success', enabled: false },

  { label: 'Thorax',          color: 'warning', enabled: false },

  { label: 'Rücken',          color: 'danger', enabled: false },
  { label: 'oberer Rücken',   color: 'danger', value: 'oberen Rücken', enabled: false },
  { label: 'unterer Rücken',  color: 'danger', value: 'unteren Rücken', enabled: false },
  { label: 'Schulterblätter', color: 'danger', value: 'zwischen die Schulterblätter', enabled: false },

])

// ############################################################################

const severityText = computed(() => {
  return {
    minmal:   'minimal/0-1',
    leicht:   'leicht/2-3',
    mittel:   'mittel/4-6',
    stark:    'stark/7-8',
    maximal:  'maximal/9-10',
  }[localSeverity.value] ?? '';
})

</script>
<style scoped>

  .dd-quickie-preview {
    white-space: pre-wrap;
    padding: 0.75rem;
    border: 1px solid var(--ion-color-medium-tint);
    border-radius: 8px;
    margin-bottom: 1rem;
    background: var(--ion-color-light);
  }

  .chip-container {
    padding-top: .5rem;
    padding-bottom: .5rem;
  }

</style>