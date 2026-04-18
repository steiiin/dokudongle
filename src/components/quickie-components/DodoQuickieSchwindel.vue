<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Schwindel (OPQRST)</IonTitle>
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

      <IonList lines="none">

        <ion-item-divider>
          <ion-label><b>O</b>nset</ion-label>
        </ion-item-divider>
        <IonItem lines="inset">
            <IonLabel>Wie</IonLabel>
            <DodoToggleGroup v-model="localOnset">
              <DodoToggleButton color="warning" value="plötzlicher Beginn">Plötzlich</DodoToggleButton>
              <DodoToggleButton color="success" value="schleichender Beginn">Schleichend</DodoToggleButton>
            </DodoToggleGroup>
          </IonItem>
        <DodoInputSelect label="Wann" v-model="localOnspan"
          empty-label="Akut"
          :options="[
            'seit Stunden', 'seit Tagen', 'seit Wochen', 'seit Gestern',
          ]"
          allow-custom custom-label="" custom-placeholder="z.B. heute früh">
        </DodoInputSelect>

        <ion-item-divider>
          <ion-label><b>P</b>rovokation <i>(Verschlechterung)</i></ion-label>
        </ion-item-divider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in provocationSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <ion-item-divider>
          <ion-label><b>P</b>alliation <i>(Verbesserung)</i></ion-label>
        </ion-item-divider>
        <IonItem>
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
          <ion-label><b>S</b>everity</ion-label>
        </ion-item-divider>
        <DodoInputSelect label="Schweregrad" v-model="localSeverity"
          :options="[
            { value: 'minimal', label: 'Minimal' },
            { value: 'leicht', label: 'Leicht' },
            { value: 'mittel', label: 'Mittel' },
            { value: 'stark', label: 'Stark' },
            { value: 'maximal', label: 'Maximal' },
          ]" lines="none">
        </DodoInputSelect>

        <ion-item-divider>
          <ion-label><b>T</b>ime <i>(Verlauf)</i></ion-label>
        </ion-item-divider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in timeSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>


      </IonList>

    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { QuickieAbdominalPain, QuickieAbdominalPainRegion, QuickieSchwindel } from '@/data/quickies'
import { concatDoku, prefix } from '@/utils/text'
import { prefixSeit } from '@/utils/prefix/general';
import { OptionalValue } from '@/types/protocol/input';
import { textIf } from '@/utils/filter';

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieSchwindel
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

// ############################################################################

const previewText = computed(() => {
  return prefix('Schwindel: ', concatDoku([
    severityText.value,
    [ prefixSeit(localOnspan.value), localOnset.value ],
    provocationText.value,
    palliationText.value,
    qualitySet.value.filter(e=>e.enabled).map(e=>e.label),
    radiationText.value,
    timeText.value,
  ]))
})

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const syncQuickieFromLocalState = () => {
  props.quickie.onset = localOnset.value as QuickieAbdominalPain['onset']
  props.quickie.onspan = localOnspan.value
  props.quickie.provocation = provocationSet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.palliation = palliationSet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.quality = qualitySet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.radiation = radiationSet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.severity = localSeverity.value as QuickieAbdominalPain['severity']
  props.quickie.time = timeSet.value.filter(e => e.enabled).map(e => e.label)
}

const handleAccept = () => {
  syncQuickieFromLocalState()
  emit('accept', `${previewText.value}\n`)
}

// ############################################################################

const localOnset = ref<string>(props.quickie.onset)
const localOnspan = ref<string>(props.quickie.onspan)
const localProvocation = ref<string[]>(props.quickie.provocation)
const localPalliation = ref<string[]>(props.quickie.palliation)
const localQuality = ref<string[]>(props.quickie.quality)
const localRadiation = ref<string[]>(props.quickie.radiation)
const localSeverity = ref<string>(props.quickie.severity)
const localTime = ref<string[]>(props.quickie.time)

watch(() => props.quickie, (v) => {

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
  timeSet.value.forEach(entry => {
    entry.enabled =
      v.time.includes(entry.label)
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
  { label: 'Kopfbewegung',  color: 'primary', prep: 'bei', enabled: false },
  { label: 'Lagewechsel',   color: 'warning', prep: 'bei', enabled: false },
  { label: 'Aufstehen',     color: 'warning', prep: 'beim', enabled: false },
  { label: 'Augen öffnen',  value: 'geöffnet. Augen', color: 'warning', prep: 'mit', enabled: false },
  { label: 'Stress',        color: 'success', prep: 'bei', enabled: false },
  { label: 'Belastung',     value: 'körperl. Belastung', prep: 'bei', color: 'success', enabled: false },
])

const palliationSet = ref([
  { label: 'Ruhe',        value: 'ruhig liegen', color: 'primary', prep: 'bei', enabled: false },
  { label: 'Augen zu',    value: 'Augen schließen', color: 'warning', prep: 'bei', enabled: false },
  { label: 'Punkt',       value: 'Fixieren eines Punkts', color: 'warning', prep: 'bei', enabled: false },
  { label: 'Medikamente', value: 'Medikamenteneinnahme', color: 'success', prep: 'nach', enabled: false },
])

// ############################################################################

const qualitySet = ref([
  { label: 'Drehschwindel',    color: 'primary', enabled: false },
  { label: 'Schwankschwindel', color: 'primary', enabled: false },
])

// ############################################################################

const radiationText = computed(() => {

  const enabled = radiationSet.value.filter(e=>e.enabled)
  if (enabled.length==0) { return '' }
  return 'zusätzlich ' + getConcatText(enabled.map(e=>e.label))

})
const radiationSet = ref([

  { label: 'Ohrgeräusche',      color: 'primary', enabled: false },
  { label: 'Hörminderung',      color: 'primary', enabled: false },
  { label: 'Druck im Ohr',      color: 'warning', enabled: false },
  { label: 'Schmerzen im Ohr',  color: 'warning', enabled: false },

])

// ############################################################################

const severityText = computed(() => {
  return {
    minimal:   'minimal',
    leicht:   'leicht',
    mittel:   'mittel',
    stark:    'stark',
    maximal:  'maximal',
  }[localSeverity.value] ?? '';
})

// ############################################################################

const timeText = computed(() => {

  const enabled = timeSet.value.filter(e=>e.enabled)
  if (enabled.length==0) { return '' }
  return enabled.map(e=>e.value ?? e.label).join(', ')

})

const timeSet = ref([
  { label: 'Erstmalig',       value: 'erstmalig',                    color: 'primary', enabled: false },
  { label: 'Früher Ähnlich',  value: 'bereits ähnlich aufgetreten',  color: 'warning', enabled: false },
  { label: 'Früher Milder',   value: 'bereits milder aufgetreten',   color: 'warning', enabled: false },
  { label: 'Wiederholt',      value: 'bereits mehrfach aufgetreten', color: 'warning', enabled: false },
  { label: 'Zunehmend',       value: 'stetig zunehmend',    color: 'success', enabled: false },
  { label: 'Gleichbleibend',  value: 'Intensität konstant', color: 'success', enabled: false },
])

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
