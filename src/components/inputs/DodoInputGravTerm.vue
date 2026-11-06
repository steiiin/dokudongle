<template>
  <div class="dd-grav-term">
    <DodoToggleGroup v-model="mode" class="dd-grav-term__switch">
      <DodoToggleButton v-if="allowClear" value="unrecorded">Keine Angabe</DodoToggleButton>
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

    <div v-else-if="mode === 'known'" class="dd-grav-term__date">
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

import { computed, ref, watch } from 'vue'

import DodoInputSelect, { type SelectValue } from './DodoInputSelect.vue'
import DodoToggleButton from './DodoToggleButton.vue'
import DodoToggleGroup from './DodoToggleGroup.vue'
import {
  PREGNANCY_TRIMESTERS,
  PregnancySpan,
  type PregnancyTrimester,
} from '@/types/protocol/pregnancy'

// ############################################################################

type TermMode = 'unrecorded' | 'unknown' | 'known'

const props = defineProps<{
  modelValue: PregnancySpan | null
  allowClear?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: PregnancySpan | null): void
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

const emptyMode = ref<TermMode>('unrecorded')
watch(() => props.modelValue, value => {
  if (!value) emptyMode.value = 'unrecorded'
})

const mode = computed<TermMode>({
  get: () => props.modelValue ? (props.modelValue.isApproximate ? 'unknown' : 'known') : emptyMode.value,
  set: (value) => {
    emptyMode.value = value
    if (value === 'unrecorded') {
      emit('update:modelValue', null)
      return
    }
    if (value === 'unknown') {
      emit('update:modelValue', new PregnancySpan(props.modelValue ? trimesterFor(props.modelValue) : '1. Trimenon'))
      return
    }

    if (props.modelValue) emit('update:modelValue', new PregnancySpan(props.modelValue.calculatedTerm))
  },
})

const approx = computed<SelectValue>({
  get: () => !props.modelValue ? '' : isPregnancyTrimester(props.modelValue.approx)
    ? props.modelValue.approx
    : trimesterFor(props.modelValue),
  set: (value) => {
    if (!value) {
      if (props.allowClear) emit('update:modelValue', null)
      return
    }
    emit('update:modelValue', new PregnancySpan(String(value)))
  },
})

const dateInput = computed({
  get: () => props.modelValue ? toDateInput(props.modelValue.calculatedTerm) : '',
  set: (value: string) => {
    if (!value && props.allowClear) {
      emit('update:modelValue', null)
      return
    }
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
