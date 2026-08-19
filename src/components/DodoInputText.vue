<template>
  <IonInput class="dd-input-text"
    ref="inputRef"
    v-model="inputValue"
    :label="label"
    :placeholder="placeholder ?? 'Text eingeben ...'"
    :inputmode="inputmode"
    :style="inputStyle"
    :readonly="imeEnabled && !isTextAssistReady"
    :autocomplete="imeOperational ? 'off' : undefined"
    :autocorrect="imeOperational ? 'off' : undefined"
    :autocapitalize="imeOperational ? 'off' : undefined"
    :spellcheck="imeOperational ? false : undefined"
    @ionBlur="handleBlur">
  </IonInput>
</template>

<script setup lang="ts">

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gainFocus } from '@/utils/input'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'

import { textAssistService } from '@/services/text-assist'
import type { ImeDictionary } from '@/services/text-assist'
import type { TextInputSnapshot } from '@/services/text-assist'
import type { TextMutation } from '@/services/text-assist'

// ############################################################################

const props = defineProps<{
  modelValue: string,
  label?: string,
  placeholder?: string,
  labelColor?: string,
  autocorrectFn?: (draft: string) => string,
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url',
  imeDictionary?: ImeDictionary,
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'leaved-empty'): void,
}>()

// ############################################################################

const inputRef = ref<any | null>(null)
const nativeInput = ref<HTMLInputElement | null>(null)
const isTextAssistReady = ref(props.imeDictionary === undefined)
const isTextAssistAvailable = ref(true)
const isComposing = ref(false)
const isApplyingAssistMutation = ref(false)
const pendingBeforeInput = ref<TextInputSnapshot | null>(null)
const compositionBefore = ref<TextInputSnapshot | null>(null)
const assistSessionId = `dodo-input-${Date.now()}-${Math.random().toString(36).slice(2)}`
let assistRevision = 0
let assistInputsInFlight = 0
let suggestionsSuppressed = false
let componentUnmounted = false
let textAssistInitialization: Promise<void> | null = null

const imeEnabled = computed(() => props.imeDictionary !== undefined)
const imeOperational = computed(() => imeEnabled.value && isTextAssistAvailable.value)
const imeDictionarySignature = computed(() => props.imeDictionary === undefined
  ? null
  : JSON.stringify(props.imeDictionary))

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string | null | undefined) => {
    emit('update:modelValue', value ?? '')
  },
})

const initializeTextAssist = () => {
  if (textAssistInitialization) return textAssistInitialization

  isTextAssistReady.value = false
  textAssistInitialization = textAssistService.initializeAutomatic()
    .catch((error) => {
      isTextAssistAvailable.value = false
      console.warn('Could not initialize single-line text assistance', error)
    })
    .finally(() => {
      isTextAssistReady.value = true
    })
  return textAssistInitialization
}

// ############################################################################

const resolvedLabelColor = computed(() => {
  if (!props.labelColor || props.labelColor.trim().length === 0) {
    return undefined
  }

  const color = props.labelColor.trim()
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl') || color.startsWith('var(')) {
    return color
  }

  return `var(--ion-color-${color})`
})

const inputStyle = computed(() => {
  if (!resolvedLabelColor.value) {
    return undefined
  }
  return {
    '--dd-label-color': resolvedLabelColor.value,
  }
})

// ############################################################################

const currentValue = (): string => nativeInput.value?.value ?? props.modelValue ?? ''

const setSuggestionSuppression = (disabled: boolean) => {
  if (suggestionsSuppressed === disabled) return
  suggestionsSuppressed = disabled
  void setInputSuggestionsDisabled(disabled)
}

const handleBlur = () => {

  const draft = currentValue()
  const value = draft.trim()
  if (value === '') { emit('leaved-empty') }

  if (!props.autocorrectFn)
  {
    if (draft !== value) {
      emit('update:modelValue', value)
    }
    return
  }

  const corrected = props.autocorrectFn(draft)
  if (corrected !== draft) {
    emit('update:modelValue', corrected)
  }

}

const snapshotInput = (): TextInputSnapshot => {
  const input = nativeInput.value
  const text = input?.value ?? props.modelValue ?? ''
  return {
    text,
    selectionStart: input?.selectionStart ?? text.length,
    selectionEnd: input?.selectionEnd ?? text.length,
    isComposing: isComposing.value,
  }
}

const applyAssistMutation = async (mutation: TextMutation, sourceText: string) => {
  const input = nativeInput.value
  if (!input || input.value !== sourceText) return

  const updated = sourceText.slice(0, mutation.start) + mutation.replacement + sourceText.slice(mutation.end)
  isApplyingAssistMutation.value = true
  input.value = updated
  inputRef.value.$el.value = updated
  input.setSelectionRange(mutation.cursor, mutation.cursor)
  emit('update:modelValue', updated)

  await nextTick()
  if (nativeInput.value?.value === updated) {
    nativeInput.value.setSelectionRange(mutation.cursor, mutation.cursor)
  }
  setTimeout(() => { isApplyingAssistMutation.value = false }, 0)
}

const processAssistInput = async (before: TextInputSnapshot, event: InputEvent, after: TextInputSnapshot) => {
  const revision = ++assistRevision
  assistInputsInFlight += 1
  try {
    await initializeTextAssist()
    if (!imeOperational.value || revision !== assistRevision) return

    const mutation = await textAssistService.processAutomaticInput({
      sessionId: assistSessionId,
      contextId: 'single-line',
      before,
      after,
      inputType: event.inputType || 'insertText',
      data: event.data,
    }, props.imeDictionary)
    if (!mutation || revision !== assistRevision) return
    await applyAssistMutation(mutation, after.text)
  }
  finally {
    assistInputsInFlight -= 1
  }
}

const handleBeforeInput = (event: InputEvent) => {
  if (!imeOperational.value) return

  const before = snapshotInput()
  pendingBeforeInput.value = before
  if (event.isComposing || isComposing.value || event.inputType !== 'deleteContentBackward') return

  const mutation = textAssistService.handleAutomaticBackspace(assistSessionId, before)
  if (!mutation) return

  event.preventDefault()
  pendingBeforeInput.value = null
  assistRevision += 1
  void applyAssistMutation(mutation, before.text)
}

const handleInput = (event: Event) => {
  if (!imeOperational.value) return

  const inputEvent = event as InputEvent
  const after = snapshotInput()
  const before = pendingBeforeInput.value ?? { ...after, text: props.modelValue ?? '' }
  pendingBeforeInput.value = null
  if (inputEvent.isComposing || isComposing.value) return
  void processAssistInput(before, inputEvent, after)
}

const handleFocus = () => {
  if (!imeOperational.value) return
  setSuggestionSuppression(true)
}

const handleNativeBlur = () => {
  assistRevision += 1
  pendingBeforeInput.value = null
  compositionBefore.value = null
  isComposing.value = false
  textAssistService.invalidateAutomaticSession(assistSessionId)
  setSuggestionSuppression(false)
}

const handleCompositionStart = () => {
  if (!imeOperational.value) return
  compositionBefore.value = snapshotInput()
  isComposing.value = true
  pendingBeforeInput.value = null
  assistRevision += 1
  textAssistService.invalidateAutomaticSession(assistSessionId)
}

const handleCompositionEnd = (event: CompositionEvent) => {
  if (!imeOperational.value) return
  isComposing.value = false
  const before = compositionBefore.value ?? snapshotInput()
  compositionBefore.value = null
  const after = snapshotInput()
  void processAssistInput(before, {
    inputType: 'insertCompositionText',
    data: event.data,
  } as InputEvent, after)
}

const handleSelectionInteraction = (event: Event) => {
  if (!imeOperational.value || isApplyingAssistMutation.value || isComposing.value) return
  if (event instanceof KeyboardEvent
    && !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  if (assistInputsInFlight > 0) return
  assistRevision += 1
  textAssistService.invalidateAutomaticSession(assistSessionId)
}

const addNativeInputListeners = (input: HTMLInputElement) => {
  input.addEventListener('beforeinput', handleBeforeInput)
  input.addEventListener('input', handleInput)
  input.addEventListener('focus', handleFocus)
  input.addEventListener('blur', handleNativeBlur)
  input.addEventListener('compositionstart', handleCompositionStart)
  input.addEventListener('compositionend', handleCompositionEnd)
  input.addEventListener('click', handleSelectionInteraction)
  input.addEventListener('select', handleSelectionInteraction)
  input.addEventListener('keyup', handleSelectionInteraction)
}

const removeNativeInputListeners = (input: HTMLInputElement) => {
  input.removeEventListener('beforeinput', handleBeforeInput)
  input.removeEventListener('input', handleInput)
  input.removeEventListener('focus', handleFocus)
  input.removeEventListener('blur', handleNativeBlur)
  input.removeEventListener('compositionstart', handleCompositionStart)
  input.removeEventListener('compositionend', handleCompositionEnd)
  input.removeEventListener('click', handleSelectionInteraction)
  input.removeEventListener('select', handleSelectionInteraction)
  input.removeEventListener('keyup', handleSelectionInteraction)
}

watch(
  imeDictionarySignature,
  (signature) => {
    assistRevision += 1
    textAssistService.invalidateAutomaticSession(assistSessionId)
    if (signature !== null) {
      void initializeTextAssist()
      return
    }
    isTextAssistReady.value = true
    setSuggestionSuppression(false)
  },
  { immediate: true },
)

onMounted(async () => {
  const ionInput = inputRef.value?.$el as HTMLIonInputElement | undefined
  if (!ionInput?.getInputElement) return
  const input = await ionInput.getInputElement()
  if (componentUnmounted) return
  nativeInput.value = input
  addNativeInputListeners(input)
})

onBeforeUnmount(() => {
  componentUnmounted = true
  assistRevision += 1
  if (nativeInput.value) removeNativeInputListeners(nativeInput.value)
  textAssistService.invalidateAutomaticSession(assistSessionId)
  setSuggestionSuppression(false)
})

const setFocus = async () => { gainFocus(inputRef) }

// ############################################################################

defineExpose({
  setFocus,
})

</script>

<style>

ion-input.dd-input-text .native-input {
  text-align: right !important;
}

ion-input.dd-input-text .label-text-wrapper {
  color: var(--dd-label-color, inherit);
}

</style>
