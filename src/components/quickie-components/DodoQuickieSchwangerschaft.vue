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

        <IonItem :lines="localGravida.assessed ? 'none' : 'inset'">
          <IonToggle v-model="localGravida.assessed" label-placement="end">
            Gravida erfassen?
          </IonToggle>
        </IonItem>
        <IonItem v-if="localGravida.assessed" lines="inset">
          <IonInput
            :model-value="localGravida.value"
            label="↳ Gravida"
            inputmode="numeric"
            type="number"
            min="0"
            @ionInput="localGravida.value = parseCount($event.detail.value, localGravida.value)"
          />
        </IonItem>

        <IonItem :lines="localPara.assessed ? 'none' : 'inset'">
          <IonToggle v-model="localPara.assessed" label-placement="end">
            Para erfassen?
          </IonToggle>
        </IonItem>
        <IonItem v-if="localPara.assessed" lines="inset">
          <IonInput
            :model-value="localPara.value"
            label="↳ Para"
            inputmode="numeric"
            type="number"
            min="0"
            @ionInput="localPara.value = parseCount($event.detail.value, localPara.value)"
          />
        </IonItem>

        <IonItem lines="none">
          <IonToggle v-model="localIsMultiple" label-placement="end">
            Mehrlingsschwangerschaft?
          </IonToggle>
        </IonItem>

        <IonItemDivider>
          <IonLabel>Aktuelle Schwangerschaft</IonLabel>
        </IonItemDivider>

        <IonItem :lines="localPresentation.assessed ? 'none' : 'inset'">
          <IonToggle v-model="localPresentation.assessed" label-placement="end">
            Kindslage erfasst?
          </IonToggle>
        </IonItem>
        <DodoInputSelect
          v-if="localPresentation.assessed"
          v-model="localPresentation.value"
          label="↳ Kindslage"
          lines="inset"
          :options="[
            { value: 'SL', label: 'Schädellage (SL)' },
            { value: 'BEL', label: 'Beckenendlage (BEL)' },
            { value: 'QL', label: 'Querlage (QL)' },
          ]"
        />

        <IonItem :lines="localAmnioticFluid.assessed ? 'none' : 'inset'">
          <IonToggle v-model="localAmnioticFluid.assessed" label-placement="end">
            Fruchtwasserabgang erfasst?
          </IonToggle>
        </IonItem>
        <template v-if="localAmnioticFluid.assessed">
          <IonItem :lines="localAmnioticFluid.value.active ? 'none' : 'inset'">
            <IonToggle v-model="localAmnioticFluid.value.active" label-placement="end">
              ↳ Fruchtwasserabgang?
            </IonToggle>
          </IonItem>
          <DodoInputSelect
            v-if="localAmnioticFluid.value.active"
            v-model="localAmnioticFluid.value.value"
            label="↳ Farbe"
            lines="inset"
            :options="['klar', 'grün', 'blutig']"
            allow-custom
            custom-label="Farbe"
            custom-placeholder="Beschreiben ..."
          />
        </template>

        <IonItem :lines="localCalculatedTerm.assessed ? 'none' : 'inset'">
          <IonToggle v-model="localCalculatedTerm.assessed" label-placement="end">
            Errechneten Termin erfassen?
          </IonToggle>
        </IonItem>
        <IonItem v-if="localCalculatedTerm.assessed" lines="none">
          <IonInput
            v-model="calculatedTermInput"
            label="↳ Errechneter Termin"
            type="date"
          />
        </IonItem>

        <IonItemDivider>
          <IonLabel>Besonderheiten</IonLabel>
        </IonItemDivider>

        <DodoInputTextOptional
          lines="inset"
          toggle-label="Komplikationen?"
          v-model:toggle="localComplications.active"
          text-label="Welche?"
          text-placeholder="Beschreiben ..."
          v-model:text="localComplications.value"
        />
        <DodoInputTextOptional
          lines="inset"
          toggle-label="Frühere Schwangerschaftskomplikationen?"
          v-model:toggle="localPreviouslyComplications.active"
          text-label="Welche?"
          text-placeholder="Beschreiben ..."
          v-model:text="localPreviouslyComplications.value"
        />
        <DodoInputTextOptional
          lines="none"
          toggle-label="Gynäkologische Voroperationen?"
          v-model:toggle="localPreviousGynOperations.active"
          text-label="Welche?"
          text-placeholder="Beschreiben ..."
          v-model:text="localPreviousGynOperations.value"
        />
      </IonList>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import DodoInputSelect from '../DodoInputSelect.vue'
import DodoInputTextOptional from '../DodoInputTextOptional.vue'
import { QuickieSchwangerschaft } from '@/data/quickies'
import { AssessedValue, OptionalValue } from '@/types/protocol/input'
import { concatDoku, prefix } from '@/utils/text'

// ############################################################################

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieSchwangerschaft
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

type Presentation = QuickieSchwangerschaft['presentation']['value']
type AmnioticFluid = QuickieSchwangerschaft['amnioticFluid']['value']['value']

// ############################################################################

const cloneAssessed = <T>(source: AssessedValue<T>, cloneValue: (value: T) => T = value => value) =>
  new AssessedValue(source.assessed, cloneValue(source.value))

const cloneOptional = <T>(source: OptionalValue<T>) =>
  new OptionalValue(source.active, source.value)

const cloneDate = (date: Date) => new Date(date.getTime())

const localGravida = ref(cloneAssessed(props.quickie.gravida))
const localPara = ref(cloneAssessed(props.quickie.para))
const localPresentation = ref<AssessedValue<Presentation>>(cloneAssessed(props.quickie.presentation))
const localAmnioticFluid = ref<AssessedValue<OptionalValue<AmnioticFluid>>>(
  cloneAssessed(props.quickie.amnioticFluid, cloneOptional),
)
const localIsMultiple = ref(props.quickie.isMultiple)
const localCalculatedTerm = ref(cloneAssessed(props.quickie.calculatedTerm, cloneDate))
const localComplications = ref(cloneOptional(props.quickie.complications))
const localPreviouslyComplications = ref(cloneOptional(props.quickie.previouslyComplications))
const localPreviousGynOperations = ref(cloneOptional(props.quickie.previousGynOperations))

// ############################################################################

const padDatePart = (value: number) => String(value).padStart(2, '0')

const toDateInput = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

const parseDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

const calculatedTermInput = computed({
  get: () => toDateInput(localCalculatedTerm.value.value),
  set: (value: string) => {
    const date = parseDateInput(value)
    if (date) localCalculatedTerm.value.value = date
  },
})

const formatDate = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return ''
  return `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}`
}

const parseCount = (value: string | number | null | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

// ############################################################################

const previewText = computed(() => prefix('Schwangerschaft:', concatDoku([
  [
    localGravida.value.assessed ? `G${localGravida.value.value}` : '',
    localPara.value.assessed ? `P${localPara.value.value}` : '',
    localIsMultiple.value ? 'Mehrlingsschwangerschaft' : '',
  ],
  [
    localPresentation.value.isAssessed ? `Kindslage ${localPresentation.value.value}` : '',
    localAmnioticFluid.value.assessed
      ? localAmnioticFluid.value.value.active
        ? prefix('Fruchtwasser', localAmnioticFluid.value.value.value)
        : 'kein Fruchtwasserabgang'
      : '',
    localCalculatedTerm.value.isAssessed
      ? prefix('errechneter Termin', formatDate(localCalculatedTerm.value.value))
      : '',
  ],
  prefix('Komplikationen:', localComplications.value.isActive ? localComplications.value.value : ''),
  prefix(
    'frühere Schwangerschaftskomplikationen:',
    localPreviouslyComplications.value.isActive ? localPreviouslyComplications.value.value : '',
  ),
  prefix(
    'gynäkologische Voroperationen:',
    localPreviousGynOperations.value.isActive ? localPreviousGynOperations.value.value : '',
  ),
])))

const isEmpty = computed(() => !previewText.value)

// ############################################################################

const syncLocalState = (quickie: QuickieSchwangerschaft) => {
  localGravida.value = cloneAssessed(quickie.gravida)
  localPara.value = cloneAssessed(quickie.para)
  localPresentation.value = cloneAssessed(quickie.presentation)
  localAmnioticFluid.value = cloneAssessed(quickie.amnioticFluid, cloneOptional)
  localIsMultiple.value = quickie.isMultiple
  localCalculatedTerm.value = cloneAssessed(quickie.calculatedTerm, cloneDate)
  localComplications.value = cloneOptional(quickie.complications)
  localPreviouslyComplications.value = cloneOptional(quickie.previouslyComplications)
  localPreviousGynOperations.value = cloneOptional(quickie.previousGynOperations)
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
  props.quickie.presentation = cloneAssessed(localPresentation.value)
  props.quickie.amnioticFluid = cloneAssessed(localAmnioticFluid.value, cloneOptional)
  props.quickie.isMultiple = localIsMultiple.value
  props.quickie.calculatedTerm = cloneAssessed(localCalculatedTerm.value, cloneDate)
  props.quickie.complications = cloneOptional(localComplications.value)
  props.quickie.previouslyComplications = cloneOptional(localPreviouslyComplications.value)
  props.quickie.previousGynOperations = cloneOptional(localPreviousGynOperations.value)
}

const handleAccept = () => {
  syncQuickieFromLocalState()
  emit('accept', `${previewText.value}\n`)
}

</script>
