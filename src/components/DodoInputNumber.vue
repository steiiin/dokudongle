<template>
  <div class="ns-num-input">

    <IonInput v-model="internalNumber"
      :label="label" placeholder="---"
      class="ns-num-input--part" :class="{ empty: internalNumber === '' }"
      fill="outline" labelPlacement="stacked"
      inputmode="numeric" :maxlength="3"
      ref="internalNumEl" :clear-input="true"
      @ionInput="onNumInput"
      @ionBlur="onNumBlur"
      @ion-focus="selectNum">
    </IonInput>

  </div>
</template>

<script setup lang="ts">

import { computed, nextTick, ref, watch } from 'vue'

import { gainFocus, setNativeValue } from '@/utils/input'
import { PatientAge } from '@/types/protocol'
import { AssessedValue } from '@/types/protocol/input';

// ############################################################################

const props = defineProps<{
  modelValue?: AssessedValue<number>,
  label?: string,
  min?: number,
  max?: number,
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: AssessedValue<number>): void
}>()

// ############################################################################

const internalAssessed = ref<boolean>(false)
const internalNumber = ref<string>("0")

const internalNumEl = ref<any|null>(null)

// ############################################################################

const syncFromModel = (value: AssessedValue<number>) => {

  internalAssessed.value = value.isAssessed
  if (value.isAssessed)
  {
    internalNumber.value = String(clampValue(value.value))
  }
  else
  {
    internalNumber.value = ""
  }

}

// ############################################################################

const clampValue = (value: number): number => {
  let next = value

  if (typeof props.min === 'number' && Number.isFinite(props.min)) {
    next = Math.max(next, props.min)
  }

  if (typeof props.max === 'number' && Number.isFinite(props.max)) {
    next = Math.min(next, props.max)
  }

  return next
}

const updateDisplayedValues = () => {
  setNativeValue(internalNumEl, internalNumber.value)
}

const emitModel = () => {

  if (internalNumber.value === '')
  {
    emit('update:modelValue', AssessedValue.unassessed(0))
    return
  }

  const parsed = Number.parseInt(internalNumber.value, 10)
  if (Number.isNaN(parsed))
  {
    emit('update:modelValue', AssessedValue.unassessed(0))
    return
  }

  const clamped = clampValue(parsed)
  if (internalNumber.value !== String(clamped)) {
    internalNumber.value = String(clamped)
    updateDisplayedValues()
  }

  emit('update:modelValue', AssessedValue.assessed(clamped))

}

// ############################################################################

const onNumInput = (event: CustomEvent) => {

  let numStr = String(event.detail.value ?? '').replace(/\D+/g, '')

  // keep exactly one zero if user types/selects-replaces with 0
  if (numStr === '0') {
    internalNumber.value = '0'
    updateDisplayedValues()
    emitModel()
    gainFocus(internalNumEl, true)
    return
  }

  // collapse values like 000, 01, 002 to first meaningful form
  numStr = numStr.replace(/^0+/, '')
  if (numStr === '' && String(event.detail.value ?? '').includes('0')) {
    numStr = '0'
  }

  if (numStr !== '') {
    const n = Number(numStr)
    if (n > 99) numStr = '99'

    const clamped = clampValue(Number(numStr))
    if (clamped !== Number(numStr)) {
      numStr = String(clamped)
    }
  }

  internalNumber.value = numStr

  updateDisplayedValues()
  emitModel()
}

const onNumBlur = () => {
  if (internalNumber.value !== '') return
  emit('update:modelValue', AssessedValue.unassessed(0))
}

const selectNum = () => {
  gainFocus(internalNumEl, true)
}

// ############################################################################

watch(
  () => props.modelValue,
  (v) => {

    if (!v) { return }
    syncFromModel(v)
    updateDisplayedValues()
  },
  { immediate: true }
)

</script>

<style lang="scss" scoped>

  .ns-num-input {

    padding: .5rem .5rem .5rem 0;

    display: flex;
    gap: 0.5rem;

    &--part {
      border-radius: 4px;
      max-width: 7rem;
      text-align: center;
    }

    &--part:hover {
      --border-color: var(--highlight-color);
      background: var(--ns-ion-primary-fade);
    }

    &--part.empty {
      --border-color: var(--ion-color-step-400, var(--ion-text-color-step-600, #999));
    }

  }

.ns-num-estimate,
.ns-num-input--part {
  --border-width: var(--highlight-height);
  --border-color: var(--highlight-color);
}

</style>