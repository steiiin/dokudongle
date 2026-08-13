<template>
  <div class="dd-grav-term">
    <DodoToggleGroup v-model="mode" class="dd-grav-term__switch">
      <DodoToggleButton value="unknown">Termin unbekannt</DodoToggleButton>
      <DodoToggleButton value="known">Bekannt</DodoToggleButton>
    </DodoToggleGroup>

    <div class="dd-grav-term__approx" v-if="mode === 'unknown'">
      <DodoInputSelect
        v-model="approx"
        label="Trimenon"
        lines="none"
        :options="PREGNANCY_TRIMESTERS"
      />
    </div>

    <div v-else class="dd-grav-term__date">
      <IonInput
        v-model="dateInput"
        class="dd-grav-term__date-input"
        label="Errechneter Termin"
        type="date"
        fill="outline"
        label-placement="stacked"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'

import DodoInputSelect, { type SelectValue } from './DodoInputSelect.vue'
import DodoToggleButton from './DodoToggleButton.vue'
import DodoToggleGroup from './DodoToggleGroup.vue'
import {
  PREGNANCY_TRIMESTERS,
  PregnancySpan,
  type PregnancyTrimester,
} from '@/types/protocol/pregnancy'

// ############################################################################

type TermMode = 'unknown' | 'known'

const props = defineProps<{
  modelValue: PregnancySpan
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: PregnancySpan): void
}>()

// ############################################################################

const padDatePart = (value: number): string => String(value).padStart(2, '0')

const toDateInput = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

const parseDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) return null

  return date
}

const trimesterFor = (span: PregnancySpan): PregnancyTrimester => {
  if (span.totalWeeks < 13) return '1. Trimenon'
  if (span.totalWeeks < 28) return '2. Trimenon'
  return '3. Trimenon'
}

const isPregnancyTrimester = (value: string): value is PregnancyTrimester =>
  (PREGNANCY_TRIMESTERS as readonly string[]).includes(value)

// ############################################################################

const mode = computed<TermMode>({
  get: () => props.modelValue.isApproximate ? 'unknown' : 'known',
  set: (value) => {
    if (value === 'unknown') {
      emit('update:modelValue', new PregnancySpan(trimesterFor(props.modelValue)))
      return
    }

    emit('update:modelValue', new PregnancySpan(props.modelValue.calculatedTerm))
  },
})

const approx = computed<SelectValue>({
  get: () => isPregnancyTrimester(props.modelValue.approx)
    ? props.modelValue.approx
    : trimesterFor(props.modelValue),
  set: (value) => {
    emit('update:modelValue', new PregnancySpan(String(value)))
  },
})

const dateInput = computed({
  get: () => toDateInput(props.modelValue.calculatedTerm),
  set: (value: string) => {
    const date = parseDateInput(value)
    if (date) emit('update:modelValue', new PregnancySpan(date))
  },
})

</script>

<style lang="scss" scoped>

.dd-grav-term {

  display: grid;

  &__switch {
    padding: .5rem var(--padding-start);
    padding-bottom: 0;
    & :deep(ion-button) {
      margin-inline: 0;
    }
  }

  &__approx {
    padding: .5rem 0;
  }

  &__date {
    padding: .5rem var(--padding-start);
    padding-bottom: .75rem;
  }

  &__date-input {
    --border-width: var(--highlight-height);
    --border-color: var(--highlight-color);

    border-radius: 4px;
    max-width: 12rem;
    text-align: center;
  }

  &__date-input:hover {
    --border-color: var(--highlight-color);
    background: var(--ns-ion-primary-fade);
  }
}

</style>
