<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Schwangerschaft</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="handleCancel">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton color="primary" :disabled="isEmpty" @click="handleAccept">Einfügen</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <IonList lines="none">
        <IonItemDivider>
          <IonLabel>Schwangerschaftsanamnese</IonLabel>
        </IonItemDivider>

        <IonItem>
          <DodoInputNumber v-model="localGravida"
            label="Gravida"
            :min="1">
          </DodoInputNumber>
          <DodoInputNumber v-model="localPara"
            label="Para"
            :min="0">
          </DodoInputNumber>
        </IonItem>

        <DodoInputSelect
          v-model="localChildCount"
          label="Mehrlingsstatus" lines="inset"
          empty-label="Einling"
          :options="[
            'Zwillinge',
            'Drillinge',
            'Vierlinge',
            'Fünflinge',
            'Sechslinge',
            'Siebenlinge',
            'Achtlinge',
            'Neunlinge',
          ]">
        </DodoInputSelect>

        <DodoInputGravTerm v-model="localCalculatedTerm" />

        <IonItemDivider>
          <IonLabel>Aktuelle Schwangerschaft</IonLabel>
        </IonItemDivider>

        <DodoInputSelect
          v-model="localPresentation"
          label="Kindslage" lines="inset"
          empty-label="Nicht Erfasst"
          :options="[
            { value: 'SL', label: 'Schädellage' },
            { value: 'BEL', label: 'Beckenendlage' },
            { value: 'QL', label: 'Querlage' },
          ]">
        </DodoInputSelect>

        <DodoInputSelect
          v-model="localAmnioticFluid"
          label="Fruchtwasser" lines="none"
          empty-label="Nicht Erfasst"
          :options="[
            { value: 'Kein Fruchtwasserabgang', label: 'Kein Abgang' },
            { value: 'Fruchtwasserabgang (klar)', label: 'Klar' },
            { value: 'Fruchtwasserabgang (grün)', label: 'Grün' },
            { value: 'Fruchtwasserabgang (blutig)', label: 'Blutig' },
          ]">
        </DodoInputSelect>

      </IonList>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, shallowRef, watch } from 'vue'

import DodoInputSelect from '../DodoInputSelect.vue'
import DodoInputGravTerm from '../DodoInputGravTerm.vue'
import DodoInputNumber from '../DodoInputNumber.vue'

import { QuickieSchwangerschaft } from '@/data/quickies'
import { AssessedValue, OptionalValue } from '@/types/protocol/input'
import { concatDoku, prefix } from '@/utils/text'
import { IonItem } from '@ionic/vue'

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieSchwangerschaft
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

type Presentation = QuickieSchwangerschaft['presentation']

// ############################################################################

const cloneAssessed = <T>(source: AssessedValue<T>, cloneValue: (value: T) => T = value => value) =>
  new AssessedValue(source.assessed, cloneValue(source.value))

const cloneOptional = <T>(source: OptionalValue<T>) =>
  new OptionalValue(source.active, source.value)

const localGravida = ref(cloneAssessed(props.quickie.gravida))
const localPara = ref(cloneAssessed(props.quickie.para))
const localPresentation = ref<Presentation>(props.quickie.presentation)
const localAmnioticFluid = ref<string>(props.quickie.amnioticFluid)
const localChildCount = ref(props.quickie.childCount)
const localCalculatedTerm = shallowRef(props.quickie.calculatedTerm.clone())

// ############################################################################

const formatDate = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return ''
  const padDatePart = (value: number) => String(value).padStart(2, '0')
  return `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}`
}

// ############################################################################

const previewText = computed(() => prefix('Schwangerschaft:', concatDoku([

  localGravida.value.isAssessed || localPara.value.isAssessed
  ? `${
      localGravida.value.assessed ? `G${localGravida.value.value}` : 'G?'} ${
      localPara.value.assessed ? `P${localPara.value.value}` : 'P?'
    }`
  : '',
  localChildCount.value,
  [
    localPresentation.value === '' ? '' : `Kindslage ${localPresentation.value}`,
    localAmnioticFluid.value,
    localCalculatedTerm.value.isApproximate
      ? `Termin unklar, ca. ${localCalculatedTerm.value.approx}`
      : `SSW ${localCalculatedTerm.value.week}, ${prefix('errechneter Termin', formatDate(localCalculatedTerm.value.calculatedTerm))}`,
  ],
])))

const isEmpty = computed(() => !previewText.value)

// ############################################################################

const syncLocalState = (quickie: QuickieSchwangerschaft) => {
  localGravida.value = cloneAssessed(quickie.gravida)
  localPara.value = cloneAssessed(quickie.para)
  localPresentation.value = quickie.presentation
  localAmnioticFluid.value = quickie.amnioticFluid
  localChildCount.value = quickie.childCount
  localCalculatedTerm.value = quickie.calculatedTerm.clone()
}

watch(
  [() => props.quickie, () => props.isOpen],
  ([quickie, isOpen]) => {
    if (isOpen) syncLocalState(quickie)
  },
)

// ############################################################################

const handleCancel = () => {
  emit('cancel')
}

const syncQuickieFromLocalState = () => {
  props.quickie.gravida = cloneAssessed(localGravida.value)
  props.quickie.para = cloneAssessed(localPara.value)
  props.quickie.presentation = localPresentation.value

  props.quickie.amnioticFluid = localAmnioticFluid.value
  props.quickie.childCount = localChildCount.value
  props.quickie.calculatedTerm = localCalculatedTerm.value.clone()
}

const handleAccept = () => {
  syncQuickieFromLocalState()
  emit('accept', `${previewText.value}\n`)
}

</script>
