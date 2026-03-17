<template>
  <div class="dd-age-input">
    <input
      class="dd-input amount"
      :class="{ error: isInvalid }"
      type="number"
      placeholder="Alter"
      :min="1"
      :max="120"
      :value="inputValue"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
    />
    <IonSelect v-model="unit" class="unit" cancel-text="Abbrechen" interface="popover">
      <IonSelectOption value="years">Jahre</IonSelectOption>
      <IonSelectOption value="months">Monate</IonSelectOption>
    </IonSelect>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import DodoInputSelect from './DodoInputSelect.vue'
import { PatientAge } from '@/types/protocol'

const props = defineProps<{
  modelValue: PatientAge
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: PatientAge): void
}>()

const amount = computed<number>({
  get: () => props.modelValue.timespan,
  set: (v) => emit('update:modelValue', new PatientAge(v, unit.value)),
})

const unit = computed<'years' | 'months'>({
  get: () => props.modelValue.unit,
  set: (v) => emit('update:modelValue', new PatientAge(amount.value, v)),
})

const inputValue = computed(() => {
  return Number.isFinite(amount.value) && amount.value > 0 ? String(amount.value) : ''
})

const displayValue = computed(() => {
  const num = amount.value
  if (!num) return ''

  const text = unit.value === 'years'
      ? num === 1
        ? 'Jahr'
        : 'Jahre'
      : num === 1
        ? 'Monat'
        : 'Monate'

  return `${num} ${text}`
})

const isInvalid = computed(() => !displayValue.value)

function updateAmountFromString(raw: string) {
  let val = raw.replace(/\D+/g, '')

  if (val === '') {
    amount.value = 0
    return ''
  }

  let num = parseInt(val, 10)

  if (num < 1) num = 1
  if (num > 120) num = 120

  amount.value = num
  return String(num)
}

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.value = updateAmountFromString(input.value)
}

const onKeydown = (e: KeyboardEvent) => {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
    return
  }

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

const onPaste = (e: ClipboardEvent) => {
  e.preventDefault()

  const paste = e.clipboardData?.getData('text') || ''
  const input = e.target as HTMLInputElement
  input.value = updateAmountFromString(paste)
}
</script>

<style scoped>
.dd-age-input {
  display: flex;
  gap: 1rem;
  align-items: center;
}

input.dd-input {
  margin: 1px 3px;
  outline: 1px solid var(--ion-color-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #fff;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.3rem;
}

input.dd-input:focus {
  margin: 2px 4px;
  outline: 2px solid var(--ion-color-primary);
  border: none;
}

input.dd-input.error {
  outline-color: var(--ion-color-danger);
}

.dd-age-input .amount {
  width: 120px;
  text-align: center;
}

.dd-age-input .unit {
  color: #fff;
  font-size: 0.9rem;
}
</style>