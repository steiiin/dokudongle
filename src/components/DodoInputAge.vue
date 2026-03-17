<template>
  <div class="ns-age-input">
    <IonInput
      v-model="internalYears"
      label="Alter"
      class="ns-age-input--part"
      :class="{ error: internalYears === '' }"
      fill="outline"
      labelPlacement="stacked"
      inputmode="numeric"
      :maxlength="3"
      ref="internalYearEl"
      @ionInput="onYearInput"
      @ionBlur="onYearBlur"
      @ion-focus="selectYear"
    >
      <span slot="end" class="year-suffix">{{ yearsSuffix }}</span>
    </IonInput>

    <IonInput
      v-if="showMonthInput"
      v-model="internalMonths"
      label="Monate"
      class="ns-age-input--part"
      :class="{ error: internalMonths === '' }"
      fill="outline"
      labelPlacement="stacked"
      inputmode="numeric"
      :maxlength="2"
      ref="internalMonthEl"
      @ionInput="onMonthInput"
      @keydown="onMonthKeydown"
    >
      <span slot="end" class="year-suffix">{{ monthsSuffix }}</span>
    </IonInput>
  </div>
</template>

<script setup lang="ts">
import { IonInput } from '@ionic/vue'
import { gainFocus } from '@/utils/input'
import { computed, nextTick, ref, watch } from 'vue'
import { PatientAge } from '@/types/protocol'

const props = defineProps<{
  modelValue?: PatientAge | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: PatientAge | null): void
}>()

const internalYears = ref<string>('')
const internalMonths = ref<string>('')

const internalYearEl = ref<any | null>(null)
const internalMonthEl = ref<any | null>(null)

const lastValidValue = ref<PatientAge | null>(null)

const showMonthInput = computed(() => internalYears.value === '0')

const yearsSuffix = computed(() =>
  internalYears.value !== '' && internalYears.value === '1' ? 'Jahr' : 'Jahre'
)

const monthsSuffix = computed(() =>
  internalMonths.value !== '' && internalMonths.value === '1' ? 'Monat' : 'Monate'
)

const cloneAge = (value: PatientAge | null): PatientAge | null => {
  if (!value) return null
  return new PatientAge(value.timespan, value.unit)
}

const syncFromModel = (value: PatientAge | null | undefined) => {
  if (!value) {
    return
  }

  if (value.unit === 'months') {
    internalYears.value = '0'
    internalMonths.value = String(value.timespan)
    return
  }

  internalYears.value = String(value.timespan)
  internalMonths.value = ''
}

const setNativeValue = (inputRef: any, value: string) => {
  const inputCmp = inputRef?.value
  if (!inputCmp?.$el) return
  inputCmp.$el.value = value
}

const updateDisplayedValues = () => {
  setNativeValue(internalYearEl, internalYears.value)
  setNativeValue(internalMonthEl, internalMonths.value)
}

const emitModel = () => {
  if (internalYears.value === '') {
    emit('update:modelValue', null)
    return
  }

  const years = Number(internalYears.value)

  if (years > 0) {
    const value = new PatientAge(years, 'years')
    lastValidValue.value = cloneAge(value)
    emit('update:modelValue', value)
    return
  }

  // years === 0 => month mode
  if (internalMonths.value === '') {
    emit('update:modelValue', null)
    return
  }

  const months = Number(internalMonths.value)
  const value = new PatientAge(months, 'months')
  lastValidValue.value = cloneAge(value)
  emit('update:modelValue', value)
}

const onYearInput = (event: CustomEvent) => {
  let years = String(event.detail.value ?? '').replace(/\D+/g, '')

  // keep exactly one zero if user types/selects-replaces with 0
  if (years === '0') {
    internalYears.value = '0'
    updateDisplayedValues()
    emitModel()
    gainFocus(internalMonthEl, true)
    return
  }

  // collapse values like 000, 01, 002 to first meaningful form
  years = years.replace(/^0+/, '')
  if (years === '' && String(event.detail.value ?? '').includes('0')) {
    years = '0'
  }

  if (years !== '') {
    const n = Number(years)
    if (n > 120) years = '120'
  }

  internalYears.value = years

  if (years !== '0') {
    internalMonths.value = ''
  }

  updateDisplayedValues()
  emitModel()
}

const onMonthInput = (event: CustomEvent) => {
  let months = String(event.detail.value ?? '').replace(/\D+/g, '')

  if (months === '0') {
    internalMonths.value = '1'
    updateDisplayedValues()
    emitModel()
    return
  }

  months = months.replace(/^0+/, '')
  if (months === '' && String(event.detail.value ?? '').includes('0')) {
    months = '1'
  }

  if (months !== '') {
    const n = Number(months)
    if (n > 11) months = '11'
  }

  internalMonths.value = months
  updateDisplayedValues()
  emitModel()
}

const onMonthKeydown = async (event: KeyboardEvent) => {
  if (event.key !== 'Backspace') return
  if (internalMonths.value !== '') return
  event.preventDefault()

  internalMonths.value = '0'
  internalYears.value = ''
  updateDisplayedValues()
  emitModel()

  await nextTick()
  gainFocus(internalYearEl.value, true)
}

const onYearBlur = () => {
  if (internalYears.value !== '') return

  if (!lastValidValue.value) return

  syncFromModel(lastValidValue.value)
  updateDisplayedValues()
  emit('update:modelValue', cloneAge(lastValidValue.value))
}

const selectYear = () => {
  gainFocus(internalYearEl, true)
}

watch(
  () => props.modelValue,
  (v) => {
    syncFromModel(v)

    if (v) {
      lastValidValue.value = cloneAge(v)
    }

    updateDisplayedValues()
  },
  { immediate: true }
)

watch(
  () => internalYears.value,
  (v) => {
    if (v === '0') {
      gainFocus(internalMonthEl, true)
    }
  }
)
</script>

<style scoped>
.ns-age-input {
  display: flex;
  gap: 0.5rem;
}

.ns-age-estimate,
.ns-age-input--part {
  --border-width: var(--highlight-height);
  --border-color: var(--highlight-color);
}

.ns-age-input--part {
  border-radius: 4px;
  max-width: 7rem;
  text-align: center;
}

.ns-age-input--part:hover {
  --border-color: var(--highlight-color);
  background: var(--ns-ion-primary-fade);
}

.ns-age-input--part.error {
  --border-color: #f00;
}

.year-suffix {
  margin-inline-start: 0 !important;
  opacity: 0.4;
  cursor: text;
  font-size: 0.9em;
}
</style>