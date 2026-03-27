<template>
  <IonInput
    ref="inputRef"
    class="dd-input-temp"
    :model-value="displayValue"
    label="Temperatur"
    placeholder="°C"
    inputmode="decimal"
    @click="selectAll"
    @ionInput="handleInput"
    @ionBlur="handleBlur"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { gainFocus } from '@/utils/input'

const DEFAULT_TEMP = 36.5
const MIN_TEMP = 20
const MAX_TEMP = 42

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'leaved-empty'): void
}>()

const inputRef = ref<any | null>(null)
const displayValue = ref('')

const syncInputElement = (value: string) => {
  displayValue.value = value
  const inputCmp = inputRef?.value
  if (!inputCmp?.$el) return
  inputCmp.$el.value = value
}

function isValidPartial(value: string): boolean {
  if (value === '') return true

  // only: 1-2 digits, optional dot, optional 1 decimal
  if (!/^\d{0,2}(\.\d?)?$/.test(value)) return false

  const [intPart, decPart] = value.split('.')

  // allow first digit only if 2, 3 or 4
  if (intPart.length === 1) {
    return intPart === '2' || intPart === '3' || intPart === '4'
  }

  // if 2 digits: must be in 20..42
  if (intPart.length === 2) {
    const n = Number(intPart)
    if (Number.isNaN(n) || n < MIN_TEMP || n > MAX_TEMP) {
      return false
    }
  }

  if (intPart.length > 2) return false
  if (decPart && decPart.length > 1) return false

  return true
}

function sanitizeRaw(raw: string): string {
  const normalized = raw
    .replace(/,/g, '.')
    .replace(/[^0-9.]/g, '')

  let out = ''
  let dotSeen = false

  for (const ch of normalized) {
    if (ch === '.') {
      if (dotSeen) continue
      dotSeen = true

      const candidate = out + '.'
      if (isValidPartial(candidate)) {
        out = candidate
      }
      continue
    }

    const candidate = out + ch
    if (isValidPartial(candidate)) {
      out = candidate
    }
  }

  return out
}

function emitIfComplete(value: string) {
  if (!value || value.endsWith('.')) return

  const n = Number(value)
  if (Number.isNaN(n)) return
  if (n < MIN_TEMP || n > MAX_TEMP) return

  emit('update:modelValue', n)
}

function handleInput(event: CustomEvent) {
  const raw = String(event.detail.value ?? '')
  const cleaned = sanitizeRaw(raw)

  // critical part: write corrected value back into IonInput itself
  syncInputElement(cleaned)
  emitIfComplete(cleaned)
}

function handleBlur() {
  let v = displayValue.value.trim()

  if (v === '') {
    syncInputElement(String(DEFAULT_TEMP))
    emit('leaved-empty')
    emit('update:modelValue', DEFAULT_TEMP)
    return
  }

  if (v.endsWith('.')) {
    v += '0'
  }

  let n = Number(v)
  if (Number.isNaN(n)) n = DEFAULT_TEMP

  if (n < MIN_TEMP) n = MIN_TEMP
  if (n > MAX_TEMP) n = MAX_TEMP

  const finalValue = v.includes('.') ? n.toFixed(1) : String(n)
  syncInputElement(finalValue)
  emit('update:modelValue', n)
}

watch(
  () => props.modelValue,
  (value) => {
    const next = String(value ?? DEFAULT_TEMP)
    if (next !== displayValue.value) {
      syncInputElement(next)
    }
  },
  { immediate: true }
)

const setFocus = () => {
  gainFocus(inputRef, true)
}

const selectAll = () => {
  setFocus()
}

defineExpose({
  setFocus,
})
</script>

<style>
ion-input.dd-input-temp .native-input {
  text-align: right !important;
}
</style>