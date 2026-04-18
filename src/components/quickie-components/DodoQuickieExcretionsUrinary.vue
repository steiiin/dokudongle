<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Wasserlassen</IonTitle>
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

        <template v-if="store.doku.xabcdE.excretions.value.catheterType != ''">

          <IonItemDivider>
            <IonLabel>Katheter</IonLabel>
          </IonItemDivider>
          <DodoInputSelect
            v-model="localCatheterIssues"
            label="Komplikation" lines="none"
            :options="[
              { value: '', label: 'Keine' },
              { value: 'disloziert', label: 'Disloziert' },
              { value: 'gezogen', label: 'Gezogen' },
              { value: 'verstopft', label: 'Verstopft' },
            ]">
          </DodoInputSelect>

        </template>

        <IonItemDivider>
          <IonLabel>Ausfuhr</IonLabel>
        </IonItemDivider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in outputSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <IonItemDivider>
          <IonLabel>Beschwerden</IonLabel>
        </IonItemDivider>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in painSet" :key="entry.label"
              v-model="entry.enabled" :color="entry.color">{{ entry.label }}
            </DodoToggleChip>
          </div>
        </IonItem>

        <IonItemDivider>
          <IonLabel>Anomalien</IonLabel>
        </IonItemDivider>
        <DodoInputSelect
            v-model="localHematuria"
            label="Blut im Urin" lines="inset"
            :options="[
              { value: '', label: 'Kein' },
              { value: 'minimal Blut im Urin', label: 'Minimal' },
              { value: 'etwas Blut im Urin', label: 'Etwas' },
              { value: 'viel Blut im Urin', label: 'Viel' },
            ]">
          </DodoInputSelect>
        <IonItem>
          <div class="chip-container">
            <DodoToggleChip v-for="entry in anomaliesSet" :key="entry.label"
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

import { QuickieExcretionsUrinary } from '@/data/quickies'

import { concatDoku, prefix } from '@/utils/text'
import { textIf } from '@/utils/filter'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieExcretionsUrinary
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

// ############################################################################

const previewText = computed(() => {
  return prefix('Wasserlassen: ', concatDoku([
    textIf(localCatheterIssues.value, store.doku.xabcdE.excretions.value.catheterType!=''),
    outputText.value,
    painText.value,
    anomaliesText.value,
    localHematuria.value,
  ]))
})

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const syncQuickieFromLocalState = () => {
  props.quickie.catheterIssues = localCatheterIssues.value as QuickieExcretionsUrinary['catheterIssues']
  props.quickie.output = outputSet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.pain = painSet.value.filter(e => e.enabled).map(e => e.label)
  props.quickie.hematuria = localHematuria.value as QuickieExcretionsUrinary['hematuria']
  props.quickie.anomalies = anomaliesSet.value.filter(e => e.enabled).map(e => e.label)
}

const handleAccept = () => {
  syncQuickieFromLocalState()
  emit('accept', `${previewText.value}\n`)
}

// ############################################################################

const localCatheterIssues = ref<string>(props.quickie.catheterIssues)
const localOutput = ref<string[]>(props.quickie.output)
const localPain = ref<string[]>(props.quickie.pain)
const localHematuria = ref<string>(props.quickie.hematuria)
const localAnomalies = ref<string[]>(props.quickie.anomalies)

watch(() => props.quickie, (v) => {

  localCatheterIssues.value = v.catheterIssues
  localOutput.value = v.output
  localPain.value = v.pain
  localHematuria.value = v.hematuria
  localAnomalies.value = v.anomalies

  outputSet.value.forEach(entry => {
    entry.enabled =
      v.output.includes(entry.label)
  })
  painSet.value.forEach(entry => {
    entry.enabled =
      v.pain.includes(entry.label)
  })
  anomaliesSet.value.forEach(entry => {
    entry.enabled =
      v.anomalies.includes(entry.label)
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

const outputText = computed(() => {
  return outputSet.value.filter(e=>e.enabled)
                        .map(e=>e.value ?? e.label)
                        .join(', ')
})

const outputSet = ref([
  { label: 'Verringert',   color: 'warning', value: 'verringerte Ausfuhr', enabled: false },
  { label: 'Harnverhalt',  color: 'warning', enabled: false },
  { label: 'Harndrang',    color: 'success', value: 'ständinger Harndrang', enabled: false },
  { label: 'Erschwert',    color: 'success', value: 'erschwert', enabled: false },
])

// ############################################################################

const painText = computed(() => {
  return painSet.value.filter(e=>e.enabled)
                        .map(e=>e.value ?? e.label)
                        .join(', ')
})

const painSet = ref([
  { label: 'Brennen',                   value: 'Brennen beim Wasserlassen', color: 'primary', enabled: false },
  { label: 'Flankenschmerz',            color: 'primary', enabled: false },
  { label: 'Nierenklopfschmerz',        color: 'success', enabled: false },
  { label: 'Nierenlager Frei',          value: 'Nierenlager frei', color: 'success', enabled: false },
])

watch(() => painSet.value[3].enabled, (v) => {
  if (v) {
    painSet.value[2].enabled = false
  }
})

watch(() => painSet.value[2].enabled, (v) => {
  if (v) {
    painSet.value[3].enabled = false
  }
})

// ############################################################################

const anomaliesText = computed(() => {
  const anomalies = anomaliesSet.value.filter(e=>e.enabled)
                                      .map(e=>e.value ?? e.label)
  if (anomalies.length==0) { return '' }
  return `${anomalies.join(', ')} Urin`
})

const anomaliesSet = ref([

  { label: 'Dunkel', value: 'dunkler', color: 'warning', enabled: false },
  { label: 'Trübe', value: 'trüber', color: 'warning', enabled: false },
  { label: 'Flockig', value: 'flockiger', color: 'warning', enabled: false },
  { label: 'Überriechend', value: 'übel riechender', color: 'warning', enabled: false },

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
