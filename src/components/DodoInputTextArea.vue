<template>
  <div class="dd-input-textarea">
    <div v-if="!modelValue.isEmpty" class="preview">
      {{ modelValue.value }}
    </div>

    <IonButton
      :color="triggerColor"
      :fill="triggerFill"
      expand="block"
      size="default"
      :disabled="modelValue.isEnhancing"
      :class="{ inheritStyle }"
      @click="openModal"
    >
      <IonIcon v-if="isMissingField" slot="start" :src="alertCircle" />
      {{ title }} {{ triggerActionLabel }}
    </IonButton>

    <IonModal :is-open="isModalOpen" class="dd-input-modal" :class="{ 'is-enhancing': modelValue.isEnhancing }" @will-dismiss="closeModal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{{ title }}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton :disabled="modelValue.isEnhancing" @click="closeModal">
              Speichern
            </IonButton>
          </IonButtons>
          <IonButtons slot="end" v-if="false">
            <IonButton color="success" :disabled="isEnhanceDisabled" @click="enhance">
              Korrigieren
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonProgressBar v-if="modelValue.isEnhancing" type="indeterminate" />
      </IonHeader>
      <IonContent class="dd-modal-content ion-padding">
        <div class="dd-modal-hint" v-if="$slots.default">
          <slot />
        </div>
        <div class="dd-modal-data">
          <div class="dd-modal-textarea-wrap">
            <div
              v-show="activeWordRange"
              class="dd-modal-textarea-mirror"
              aria-hidden="true"
            ><span>{{ draft.slice(0, activeWordRange?.start ?? 0) }}</span><span class="dd-active-word">{{ activeWordRange?.word ?? '' }}</span><span>{{ draft.slice(activeWordRange?.end ?? 0) }}</span></div>
            <textarea
              ref="inputTextarea"
              v-model="draft"
              class="dd-modal-textarea"
              :placeholder="placeholder"
              :disabled="modelValue.isEnhancing"
              :readonly="!isTextAssistReady"
              rows="1"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              :spellcheck="false"
              @focus="handleFocus"
              @blur="handleBlur"
              @input="handleInput"
              @beforeinput="handleBeforeInput"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
              @click="handleSelectionInteraction"
              @select="handleSelectionInteraction"
              @keyup="handleSelectionInteraction"
            />
          </div>

        </div>
      </IonContent>
      <IonFooter>
        <IonToolbar v-if="resolvedQuickies.length>0">
          <IonButton v-for="quickie in resolvedQuickies"
            :key="quickie.key" fill="clear"
            @click="openQuickie(quickie)">
            {{ quickie.label }}
          </IonButton>
        </IonToolbar>
        <IonToolbar class="dd-modal-toolbar" v-if="!modelValue.isEnhancing">
          <IonButtons slot="start">
            <IonButton @click="undo" :disabled="!modelValue.canUndo">
              <IonIcon :src="arrowUndo" slot="icon-only"></IonIcon>
            </IonButton>
            <IonButton @click="redo" :disabled="!modelValue.canRedo">
              <IonIcon :src="arrowRedo" slot="icon-only"></IonIcon>
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton @click="openDictionary" aria-label="Eigenes Wörterbuch">
              <IonIcon :src="bookOutline" slot="icon-only"></IonIcon>
            </IonButton>
            <IonButton @click="deleteText" v-if="!modelValue.isEmpty">
              <IonIcon :src="trashBin" color="danger" slot="icon-only"></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <DodoTextSuggestionHost />
      </IonFooter>
    </IonModal>

    <component v-if="activeQuickieComponent"
      :is="activeQuickieComponent"
      :is-open="isQuickieModalOpen"
      :quickie="activeQuickie"
      @cancel="closeQuickieDialog"
      @accept="acceptQuickieDialog"
    />

    <DodoUserDictionaryModal
      :is-open="isDictionaryOpen"
      :entries="dictionaryEntries"
      :busy="isDictionaryBusy"
      :error="dictionaryError"
      @close="closeDictionary"
      @add="addDictionaryWord"
      @remove="removeDictionaryWord"
    />

  </div>
</template>

<script setup lang="ts">

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { alertCircle, arrowRedo, arrowUndo, bookOutline, trashBin, warningOutline } from 'ionicons/icons'
import { alertController, toastController } from '@ionic/core'

import DodoTextSuggestionHost from '@/components/DodoTextSuggestionHost.vue'
import { DATA_Quickies, type Quickie } from '@/data/quickies'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'
import { provideTextSuggestionScope } from '@/services/text-suggestions'
import { EnhanceableText } from '@/types/protocol/input'
import { textAssistService, type TextInputSnapshot, type TextMutation, type TextSuggestion, type UserDictionaryEntry } from '@/services/text-assist'
import { isCompletionDelimiter, wordAroundCursor } from '@/services/text-assist/text'

// ############################################################################

const props = defineProps<{
  modelValue: EnhanceableText
  title: string
  placeholder?: string
  mandatory?: boolean
  inheritStyle?: boolean
  quickieKeys?: string[]
  enhanceFn: (draft: string) => Promise<string | null>
  assistContextId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: EnhanceableText): void
}>()

// ############################################################################

const isModalOpen = ref(false)
const draft = ref('')
const isEditing = ref(false)
const isTextAssistReady = ref(false)
const isTextAssistAvailable = ref(true)

const textAssistInitialization = textAssistService.initialize()
  .catch((error) => {
    isTextAssistAvailable.value = false
    console.warn('Could not initialize text assistance', error)
  })
  .finally(() => {
    isTextAssistReady.value = true
  })

// ############################################################################

let typingSnapshotTimeout: ReturnType<typeof setTimeout> | null = null

// ############################################################################

const lastCursorStart = ref(0)
const lastCursorEnd = ref(0)
const pendingCursorPosition = ref<number|null>(null)
const inputTextarea = ref<HTMLTextAreaElement | null>(null)
const textSuggestions = ref<TextSuggestion[]>([])
const isComposing = ref(false)
const pendingBeforeInput = ref<TextInputSnapshot | null>(null)
const compositionBefore = ref<TextInputSnapshot | null>(null)
const isApplyingAssistMutation = ref(false)
let assistRevision = 0
let assistInputsInFlight = 0
const assistSessionId = `dodo-textarea-${Date.now()}-${Math.random().toString(36).slice(2)}`
const suggestionOwner = Symbol(assistSessionId)
const suggestionScope = provideTextSuggestionScope()

const isDictionaryOpen = ref(false)
const isDictionaryBusy = ref(false)
const dictionaryError = ref('')
const dictionaryEntries = ref<UserDictionaryEntry[]>([])

// ############################################################################

const isQuickieModalOpen = ref(false)
const activeQuickie = ref<Quickie | null>(null)

// ############################################################################

const isMissingField = computed(() => props.mandatory && props.modelValue.isEmpty)
const triggerActionLabel = computed(() => props.modelValue.isEmpty ? (props.mandatory ? 'fehlt' : 'hinzufügen') : 'bearbeiten')
const triggerColor = computed(() => {
  if (isMissingField.value) return 'danger'
  return props.inheritStyle ? 'dark' : 'light'
})
const triggerFill = computed(() => props.inheritStyle ? 'clear' : 'solid')
const isEnhanceDisabled = computed(() => props.modelValue.isEnhancing || draft.value.trim().length === 0)
const activeWordRange = computed(() => {
  if (!isEditing.value || isComposing.value || lastCursorStart.value !== lastCursorEnd.value) return null
  const previousCharacter = Array.from(draft.value.slice(0, lastCursorStart.value)).at(-1) ?? ''
  if (isCompletionDelimiter(previousCharacter)) return null
  return wordAroundCursor(draft.value, lastCursorStart.value)
})

const resolvedQuickies = computed(() => {
  if (!props.quickieKeys || props.quickieKeys.length === 0) { return [] }
  return props.quickieKeys
    .map((quickieKey) => DATA_Quickies[quickieKey.toLowerCase().trim()])
    .filter((quickie): quickie is Quickie => Boolean(quickie))
    .filter((quickie) => quickie.isAvailable(draft.value))
})

watch(textSuggestions, (suggestions) => {
  suggestionScope.update(suggestionOwner, suggestions)
})

const cloneModelValue = (): EnhanceableText => props.modelValue.clone()
const emitUpdated = (updated: EnhanceableText) => emit('update:modelValue', updated)

watch(
  () => props.modelValue.value,
  (newValue) => {
    if (!isEditing.value && !isModalOpen.value) {
      draft.value = newValue
    }
  }
)

const openModal = async () => {
  draft.value = props.modelValue.value
  isModalOpen.value = true
  await textAssistInitialization
  resizeTextarea()
  focusTextarea()
}

const closeModal = () => {
  commitOpenEditIfNeeded()
  textAssistService.invalidateSession(assistSessionId, snapshotTextarea())
  textSuggestions.value = []
  suggestionScope.clear(suggestionOwner)
  void textAssistService.flush()
  setSuggestionSuppression(false)
  isModalOpen.value = false
}


//#region Textarea

const setSuggestionSuppression = (disabled: boolean) => {
  void setInputSuggestionsDisabled(disabled)
}

const resizeTextarea = async () => {
  await nextTick()
  const textarea = inputTextarea.value
  if (!textarea) { return }

  textarea.style.height = 'auto'
  textarea.style.height = `${Math.max(textarea.scrollHeight, 44)}px`
}

const focusTextarea = () => {
  setSuggestionSuppression(true)
  setTimeout(() => inputTextarea.value?.focus(), 300)
}

watch(draft, resizeTextarea, { flush: 'post' })

const rememberCursorPosition = async () => {
  const textarea = inputTextarea.value
  if (!textarea) { return }

  lastCursorStart.value = textarea.selectionStart ?? draft.value.length
  lastCursorEnd.value = textarea.selectionEnd ?? draft.value.length
}

const setCursorPosition = async (position: number) => {
  const boundedPosition = Math.max(0, Math.min(position, draft.value.length))
  pendingCursorPosition.value = boundedPosition
  await nextTick()
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const textarea = inputTextarea.value
    if (textarea && document.activeElement === textarea) {
      textarea.setSelectionRange(boundedPosition, boundedPosition)
      lastCursorStart.value = boundedPosition
      lastCursorEnd.value = boundedPosition
      pendingCursorPosition.value = null
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 60))
  }
}

const snapshotTextarea = (): TextInputSnapshot => {
  const textarea = inputTextarea.value
  return {
    text: draft.value,
    selectionStart: textarea?.selectionStart ?? lastCursorStart.value ?? draft.value.length,
    selectionEnd: textarea?.selectionEnd ?? lastCursorEnd.value ?? draft.value.length,
    isComposing: isComposing.value,
  }
}

const applyAssistMutation = async (mutation: TextMutation) => {
  const textarea = inputTextarea.value
  const scrollTop = textarea?.scrollTop ?? 0
  isApplyingAssistMutation.value = true
  draft.value = draft.value.slice(0, mutation.start) + mutation.replacement + draft.value.slice(mutation.end)
  lastCursorStart.value = mutation.cursor
  lastCursorEnd.value = mutation.cursor
  scheduleTypingSnapshot()
  await resizeTextarea()
  await setCursorPosition(mutation.cursor)
  if (inputTextarea.value) inputTextarea.value.scrollTop = scrollTop
  setTimeout(() => { isApplyingAssistMutation.value = false }, 0)
}

const refreshTextSuggestions = async () => {
  if (!isTextAssistAvailable.value || !isEditing.value || isComposing.value || isDictionaryOpen.value) {
    textSuggestions.value = []
    return
  }
  const revision = ++assistRevision
  const suggestions = await textAssistService.getSuggestions(
    assistSessionId,
    props.assistContextId,
    snapshotTextarea(),
  )
  if (revision === assistRevision) textSuggestions.value = suggestions
}

const processAssistInput = async (before: TextInputSnapshot, event: InputEvent, after = snapshotTextarea()) => {
  const revision = ++assistRevision
  assistInputsInFlight += 1
  try {
    await textAssistInitialization
    if (!isTextAssistAvailable.value || revision !== assistRevision) return
    const update = await textAssistService.processInput({
      sessionId: assistSessionId,
      contextId: props.assistContextId,
      before,
      after,
      inputType: event.inputType || 'insertText',
      data: event.data,
    })
    if (revision !== assistRevision) return
    if (update.mutation) await applyAssistMutation(update.mutation)
    if (revision === assistRevision) textSuggestions.value = update.suggestions
  }
  finally {
    assistInputsInFlight -= 1
  }
}

// ############################################################################

const clearTypingSnapshotTimeout = () => {
  if (!typingSnapshotTimeout) {
    return
  }

  clearTimeout(typingSnapshotTimeout)
  typingSnapshotTimeout = null
}

const createTypingSnapshot = () => {
  if (!isEditing.value) {
    return
  }

  const updated = cloneModelValue()
  updated.commitEdit(draft.value)
  updated.beginEdit()
  emitUpdated(updated)

  draft.value = updated.value
}

const scheduleTypingSnapshot = () => {
  if (!isEditing.value) {
    return
  }

  clearTypingSnapshotTimeout()
  typingSnapshotTimeout = setTimeout(() => {
    typingSnapshotTimeout = null
    createTypingSnapshot()
  }, 500)
}

const handleBeforeInput = (event: InputEvent) => {
  const before = snapshotTextarea()
  pendingBeforeInput.value = before
  if (event.isComposing || isComposing.value) return
  if (event.inputType !== 'deleteContentBackward') return

  const mutation = textAssistService.handleBackspace(assistSessionId, before)
  if (!mutation) return
  event.preventDefault()
  pendingBeforeInput.value = null
  assistRevision += 1
  void applyAssistMutation(mutation).then(refreshTextSuggestions)
}

const handleInput = (event: Event) => {
  resizeTextarea()
  void rememberCursorPosition()

  if (!isEditing.value) {
    return
  }

  scheduleTypingSnapshot()
  const inputEvent = event as InputEvent
  const before = pendingBeforeInput.value ?? {
    ...snapshotTextarea(),
    text: draft.value,
  }
  pendingBeforeInput.value = null
  if (inputEvent.isComposing || isComposing.value) {
    textSuggestions.value = []
    return
  }
  void processAssistInput(before, inputEvent)
}

const handleFocus = async () => {
  setSuggestionSuppression(true)
  isEditing.value = true
  suggestionScope.activate(suggestionOwner, (suggestion) => { void applyTextSuggestion(suggestion) })
  const revision = assistRevision

  const updated = cloneModelValue()
  updated.beginEdit()
  emitUpdated(updated)
  rememberCursorPosition()
  await textAssistInitialization
  if (revision === assistRevision) await refreshTextSuggestions()
}

const handleBlur = () => {
  clearTypingSnapshotTimeout()
  rememberCursorPosition()
  textAssistService.invalidateSession(assistSessionId, snapshotTextarea())
  textSuggestions.value = []
  suggestionScope.clear(suggestionOwner)
  setSuggestionSuppression(false)
  isEditing.value = false

  const updated = cloneModelValue()
  updated.setText(draft.value)
  emitUpdated(updated)

  draft.value = updated.value
}

const handleCompositionStart = () => {
  compositionBefore.value = snapshotTextarea()
  isComposing.value = true
  textAssistService.invalidateSession(assistSessionId, compositionBefore.value)
  textSuggestions.value = []
}

const handleCompositionEnd = async (event: CompositionEvent) => {
  isComposing.value = false
  await nextTick()
  const before = compositionBefore.value ?? snapshotTextarea()
  compositionBefore.value = null
  const inputEvent = new InputEvent('input', {
    data: event.data,
    inputType: 'insertCompositionText',
    isComposing: false,
  })
  await processAssistInput(before, inputEvent)
}

const handleSelectionInteraction = (event: Event) => {
  if (isApplyingAssistMutation.value || isComposing.value) return
  if (event instanceof KeyboardEvent && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
  void rememberCursorPosition()
  if (assistInputsInFlight > 0) return
  const snapshot = snapshotTextarea()
  textAssistService.invalidateSession(assistSessionId, snapshot)
  void refreshTextSuggestions()
}

const applyTextSuggestion = async (suggestion: TextSuggestion) => {
  const mutation = textAssistService.applySuggestion(
    assistSessionId,
    props.assistContextId,
    snapshotTextarea(),
    suggestion,
  )
  assistRevision += 1
  await applyAssistMutation(mutation)
  await refreshTextSuggestions()
}

const commitOpenEditIfNeeded = () => {
  clearTypingSnapshotTimeout()

  if (!isEditing.value) {
    return
  }

  isEditing.value = false

  const updated = cloneModelValue()
  updated.setText(draft.value)
  emitUpdated(updated)

  draft.value = updated.value
}

const refreshDictionaryEntries = async () => {
  dictionaryEntries.value = await textAssistService.getUserDictionaryEntries()
}

const openDictionary = async () => {
  await rememberCursorPosition()
  dictionaryError.value = ''
  await refreshDictionaryEntries()
  isDictionaryOpen.value = true
}

const closeDictionary = async () => {
  if (!isDictionaryOpen.value) return
  isDictionaryOpen.value = false
  dictionaryError.value = ''
  focusTextarea()
  await setCursorPosition(lastCursorStart.value)
}

const addDictionaryWord = async (word: string) => {
  dictionaryError.value = ''
  isDictionaryBusy.value = true
  try {
    await textAssistService.addUserWord(word)
    await refreshDictionaryEntries()
  }
  catch (error) {
    dictionaryError.value = error instanceof Error ? error.message : 'Das Wort konnte nicht hinzugefügt werden.'
  }
  finally {
    isDictionaryBusy.value = false
  }
}

const removeDictionaryWord = async (word: string) => {
  dictionaryError.value = ''
  isDictionaryBusy.value = true
  try {
    await textAssistService.removeUserWord(word)
    await refreshDictionaryEntries()
  }
  catch {
    dictionaryError.value = 'Das Wort konnte nicht entfernt werden.'
  }
  finally {
    isDictionaryBusy.value = false
  }
}

//#endregion

//#region Toolbar

const undo = () => {
  commitOpenEditIfNeeded()

  const updated = cloneModelValue()
  updated.undo()
  emitUpdated(updated)

  draft.value = updated.value
}

const redo = () => {
  commitOpenEditIfNeeded()

  const updated = cloneModelValue()
  updated.redo()
  emitUpdated(updated)

  draft.value = updated.value
}

const deleteText = async () => {
  const confirmDelete = async (): Promise<boolean> => {
    const alert = await alertController.create({
      header: 'Eingaben löschen',
      message: 'Möchtest du die Eingaben wirklich löschen?',
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
        },
        {
          text: 'Ja, Löschen',
          role: 'destructive',
        },
      ],
    })
    await alert.present()
    const result = await alert.onDidDismiss()
    return result.role === 'destructive'
  }

  const confirmed = await confirmDelete()
  if (!confirmed) {
    return
  }

  const updated = cloneModelValue()
  updated.commitEdit('')

  emitUpdated(updated)

  draft.value = ''
  isEditing.value = false

  isModalOpen.value = false
}

//#endregion

//#region Quickies

const activeQuickieComponent = computed(() => {
  if (!activeQuickie.value) { return null }
  return activeQuickie.value.component
})

// ############################################################################

const openQuickie = async (quickie: Quickie) => {
  await rememberCursorPosition()
  activeQuickie.value = quickie
  isQuickieModalOpen.value = true
}

const insertQuickieText = async (insertedText: string) => {
  if (!insertedText || insertedText.trim().length === 0) { return }

  commitOpenEditIfNeeded()

  const selectionStart = lastCursorStart.value
  const selectionEnd = lastCursorEnd.value
  const before = draft.value.slice(0, selectionStart)
  const after = draft.value.slice(selectionEnd)
  const insertedTextEnd = before.length + insertedText.length

  draft.value = `${before}${insertedText}${after}`

  const updated = cloneModelValue()
  updated.setText(draft.value)
  emitUpdated(updated)

  focusTextarea()
  pendingCursorPosition.value = insertedTextEnd
  await setCursorPosition(insertedTextEnd)

}

// ############################################################################

const closeQuickieDialog = () => {
  isQuickieModalOpen.value = false
  activeQuickie.value = null
}

const acceptQuickieDialog = async (insertedText: string) => {
  closeQuickieDialog()
  await insertQuickieText(insertedText)
}

//#endregion

//#region Enhancement

const enhance = async () => {
  commitOpenEditIfNeeded()

  let updated = cloneModelValue()
  updated.isEnhancing = true
  emitUpdated(updated)

  const response = await props.enhanceFn(updated.value)

  updated = cloneModelValue()
  updated.isEnhancing = false

  if (!response || response.trim().length === 0) {
    emitUpdated(updated)
    await showEnhanceError()
    return
  }

  updated.applyEnhanced(response)
  emitUpdated(updated)

  draft.value = updated.value
}

const showEnhanceError = async () => {
  const toast = await toastController.create({
    message: 'Die Verbesserung konnte nicht erstellt werden.',
    color: 'danger',
    icon: warningOutline,
    duration: 2200,
    position: 'bottom',
  })

  await toast.present()
}

//#endregion

onBeforeUnmount(() => {
  clearTypingSnapshotTimeout()
  textAssistService.invalidateSession(assistSessionId, snapshotTextarea())
  suggestionScope.clear(suggestionOwner)
  void textAssistService.flush()
  setSuggestionSuppression(false)
})

defineExpose({
  openModal,
})

</script>

<style scoped>
.dd-input-textarea {
  width: 100%;
}

.dd-input-textarea .preview {
  margin: 6px 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #999;
  white-space: pre-wrap;
}

.dd-input-modal ion-title {
  text-align: center;
}

.dd-modal-content {
  display: flex;
  flex-direction: column;
  position: relative;
}

.dd-modal-content .dd-modal-hint {
  font-size: 0.9em;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border-left: 2px solid white;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.dd-modal-data {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dd-modal-textarea-wrap {
  position: relative;
  width: 100%;
}

.dd-modal-toolbar {
  margin-inline: -16px;
  width: calc(100% + 2*16px);
  padding-inline: 16px;
  margin-top: 2px;
}

.dd-modal-textarea,
.dd-modal-textarea-mirror {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 44px;
  margin: 0;
  padding: 0 0 8px;
  border: 0;
  border-bottom: 1px solid var(--ion-color-primary);
  border-radius: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font-family: var(--ion-font-family, inherit);
  font-size: inherit;
  font-style: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: normal;
  text-align: inherit;
  text-decoration: inherit;
  text-indent: inherit;
  text-overflow: inherit;
  text-transform: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  resize: none;
  overflow: hidden;
}

.dd-modal-textarea {
  position: relative;
  z-index: 1;
  appearance: none;
  -webkit-appearance: none;
}

.dd-modal-textarea-mirror {
  position: absolute;
  z-index: 2;
  inset: 0;
  height: 100%;
  border-color: transparent;
  color: transparent;
  pointer-events: none;
  user-select: none;
}

.dd-modal-textarea-mirror .dd-active-word {
  color: transparent;
  text-decoration-line: underline;
  text-decoration-color: var(--ion-color-primary-tint, var(--ion-color-primary));
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.dd-modal-textarea:focus {
  caret-color: var(--ion-color-primary);
  box-shadow: 0 1px 0 var(--ion-color-primary);
}

.dd-modal-textarea:disabled {
  opacity: 0.38;
}

.dd-modal-textarea::placeholder {
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-style: inherit;
  font-weight: inherit;
  opacity: var(--ion-placeholder-opacity, 0.6);
}

.dd-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dd-input-modal.is-enhancing .dd-modal-data {
  pointer-events: none;
  opacity: 0.8;
}

.dd-quickie-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.dd-quickie-buttons ion-button {
  flex: 0;
}

.dd-quickie-preview {
  white-space: pre-wrap;
  padding: 0.75rem;
  border: 1px solid var(--ion-color-medium-tint);
  border-radius: 8px;
  margin-bottom: 1rem;
  background: var(--ion-color-light);
}

.dd-quickie-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dd-quickie-label {
  display: block;
  margin-bottom: 0.4rem;
}

.inheritStyle {
  background-color: var(--card-bg);
}

</style>
<style>
dodo-tag {
  color: var(--dd-tag-color, var(--ion-color-primary));
  font-family: monospace;
  font-size: 1.3em;
  font-weight: bold;
  letter-spacing: -1px;
}
dodo-tag::before { content: '#'; }
</style>
