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

    <IonModal :is-open="isModalOpen" class="dd-input-modal" :class="{ 'is-enhancing': modelValue.isEnhancing }">
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
          <IonButtons slot="end">
            <IonButton color="success" :disabled="isEnhanceDisabled" @click="enhance">
              Verbessern
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
          <IonTextarea
            ref="inputTextarea"
            v-model="draft"
            class="dd-modal-textarea"
            :placeholder="placeholder"
            :auto-grow="true"
            :disabled="modelValue.isEnhancing"
            @ionFocus="handleFocus"
            @ionBlur="handleBlur"
            @ionInput="handleInput"
          />
          <div class="dd-placeholder-buttons" v-if="resolvedPlaceholders.length > 0">
            <IonButton
              v-for="placeholderTemplate in resolvedPlaceholders"
              :key="placeholderTemplate.key"
              :disabled="containsDuplicate(placeholderTemplate.key)"
              fill="solid"
              @click="openPlaceholderDialog(placeholderTemplate)"
            >
              {{ placeholderTemplate.label }}
            </IonButton>
          </div>
        </div>
      </IonContent>
      <IonFooter>
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
            <IonButton @click="deleteText" v-if="!modelValue.isEmpty">
              <IonIcon :src="trashBin" color="danger" slot="icon-only"></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonModal>

    <IonModal :is-open="isPlaceholderModalOpen" class="dd-placeholder-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{{ activePlaceholder?.label }}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton @click="closePlaceholderDialog">
              Abbrechen
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              color="primary"
              :disabled="containsEmptyPlaceholders"
              @click="acceptPlaceholderDialog">
              Einfügen
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class="ion-padding">
        <div v-if="activePlaceholder" class="dd-placeholder-preview" v-html="placeholderPreviewText" />
        <IonList v-if="activePlaceholder">
          <template v-for="(field, index) in activePlaceholder.fields" :key="field.key">
            <DodoInputSelect
              v-if="field.allowOptions"
              v-model="placeholderValues[field.key]"
              :label="field.key"
              :options="field.options"
              :allow-custom="field.allowCustom"
              :custom-label="field.customLabel"
              :custom-placeholder="field.customPlaceholder"
              :label-color="field.color"
              :lines="isLastPlaceholderField(index) ? 'none' : 'full'"
              :autocorrect-fn="field.autocorrectFn"
            />
            <IonItem v-else :lines="isLastPlaceholderField(index) ? 'none' : 'full'">
              <DodoInputText
                v-model="placeholderValues[field.key]"
                :label="field.key"
                :placeholder="field.customPlaceholder"
                :label-color="field.color"
                :autocorrect-fn="field.autocorrectFn"
              />
            </IonItem>
          </template>
        </IonList>
      </IonContent>
    </IonModal>
  </div>
</template>

<script setup lang="ts">

import { alertController, toastController } from '@ionic/vue'

import { alertCircle, arrowRedo, arrowUndo, trashBin, warningOutline } from 'ionicons/icons'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EnhanceableText } from '@/types/protocol/input'
import { INPUT_TEXTAREA_PLACEHOLDERS, type PlaceholderTemplate } from '@/data/placeholders'
import { gainFocus } from '@/utils/input'

const props = defineProps<{
  modelValue: EnhanceableText
  title: string
  placeholder?: string
  mandatory?: boolean
  inheritStyle?: boolean
  placeholders?: string[]
  enhanceFn: (draft: string) => Promise<string | null>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: EnhanceableText): void
}>()

const isModalOpen = ref(false)
const draft = ref('')
const isEditing = ref(false)

const TYPING_SNAPSHOT_DELAY_MS = 500
let typingSnapshotTimeout: ReturnType<typeof setTimeout> | null = null

const lastCursorStart = ref(0)
const lastCursorEnd = ref(0)

const isPlaceholderModalOpen = ref(false)
const activePlaceholder = ref<PlaceholderTemplate | null>(null)
const placeholderValues = ref<Record<string, string>>({})
const insertedPlaceholderBlocks = ref<Record<string, string>>({})
const inputTextarea = ref<any | null>(null)

const isMissingField = computed(() => props.mandatory && props.modelValue.isEmpty)
const triggerActionLabel = computed(() => props.modelValue.isEmpty ? 'hinzufügen' : 'bearbeiten')
const triggerColor = computed(() => {
  if (isMissingField.value) return 'danger'
  return props.inheritStyle ? 'dark' : ''
})
const triggerFill = computed(() => props.inheritStyle ? 'clear' : 'outline')
const isEnhanceDisabled = computed(() => props.modelValue.isEnhancing || draft.value.trim().length === 0)
const containsEmptyPlaceholders = computed(() => placeholderPreviewText.value.includes('dodo-tag'))

const resolvedPlaceholders = computed(() => {
  if (!props.placeholders || props.placeholders.length === 0) {
    return []
  }
  return props.placeholders
    .map((placeholderKey) => INPUT_TEXTAREA_PLACEHOLDERS[placeholderKey.toLowerCase().trim()])
    .filter((placeholder): placeholder is PlaceholderTemplate => Boolean(placeholder))
})
const resolveColor = (color?: string): string | undefined => {
  if (!color || color.trim().length === 0) {
    return undefined
  }

  const trimmedColor = color.trim()
  if (trimmedColor.startsWith('#') || trimmedColor.startsWith('rgb') || trimmedColor.startsWith('hsl') || trimmedColor.startsWith('var(')) {
    return trimmedColor
  }

  return `var(--ion-color-${trimmedColor})`
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const isLastPlaceholderField = (index: number): boolean => {
  const placeholder = activePlaceholder.value
  if (!placeholder) {
    return false
  }
  return index === placeholder.fields.length - 1
}

const placeholderPreviewText = computed(() => {
  if (!activePlaceholder.value) { return '' }
  return activePlaceholder.value.fields.reduce((text, field) => {
    const value = placeholderValues.value[field.key]?.trim()
    const color = resolveColor(field.color)
    const fallbackTag = color
      ? `<dodo-tag style="--dd-tag-color: ${escapeHtml(color)};">${field.key}</dodo-tag>`
      : `<dodo-tag>${field.key}</dodo-tag>`
    const replacement = value && value.length > 0 ? value : fallbackTag
    return text.replaceAll(`<${field.key}>`, replacement)
  }, activePlaceholder.value.template)
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

const openModal = () => {
  draft.value = props.modelValue.value
  isModalOpen.value = true
  gainFocus(inputTextarea)
}

const closeModal = () => {
  commitOpenEditIfNeeded()
  isModalOpen.value = false
}

const getNativeTextarea = async (): Promise<HTMLTextAreaElement | null> => {
  const element = inputTextarea.value?.$el
  if (!element || typeof element.getInputElement !== 'function') {
    return null
  }
  return (await element.getInputElement()) as HTMLTextAreaElement
}

const rememberCursorPosition = async () => {
  const textarea = await getNativeTextarea()
  if (!textarea) { return }

  lastCursorStart.value = textarea.selectionStart ?? draft.value.length
  lastCursorEnd.value = textarea.selectionEnd ?? draft.value.length
}

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
  }, TYPING_SNAPSHOT_DELAY_MS)
}

const handleInput = () => {
  if (!isEditing.value) {
    return
  }

  scheduleTypingSnapshot()
}

const handleFocus = () => {
  isEditing.value = true

  const updated = cloneModelValue()
  updated.beginEdit()
  emitUpdated(updated)
  rememberCursorPosition()
}

const handleBlur = () => {
  clearTypingSnapshotTimeout()
  rememberCursorPosition()
  isEditing.value = false

  const updated = cloneModelValue()
  updated.setText(draft.value)
  emitUpdated(updated)

  draft.value = updated.value
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
  const confirmDelete = (): Promise<boolean> => new Promise(async (resolve) => {
    const alert = await alertController.create({
      header: 'Eingaben löschen',
      message: 'Möchtest du die Eingaben wirklich löschen?',
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
          handler: () => resolve(false),
        },
        {
          text: 'Ja, Löschen',
          role: 'destructive',
          handler: () => resolve(true),
        },
      ],
    })
    await alert.present()
  })

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

//#region Placeholders

const containsDuplicate = (key: string) => {
  const placeholderDefinition = INPUT_TEXTAREA_PLACEHOLDERS[key]
  const trackedText = insertedPlaceholderBlocks.value[key]

  if (!placeholderDefinition?.avoidDuplicates || !trackedText) {
    return false
  }

  return draft.value.includes(trackedText)
}

const openPlaceholderDialog = async (placeholderTemplate: PlaceholderTemplate) => {
  await rememberCursorPosition()
  activePlaceholder.value = placeholderTemplate
  placeholderValues.value = placeholderTemplate.fields.reduce((collector, field) => {
    collector[field.key] = ''
    return collector
  }, {} as Record<string, string>)
  isPlaceholderModalOpen.value = true
}

const closePlaceholderDialog = () => {
  isPlaceholderModalOpen.value = false
  activePlaceholder.value = null
}

const acceptPlaceholderDialog = async () => {
  if (!activePlaceholder.value) { return }

  commitOpenEditIfNeeded()

  const placeholderKey = activePlaceholder.value.key
  const insertedText = placeholderPreviewText.value
  const selectionStart = lastCursorStart.value
  const selectionEnd = lastCursorEnd.value
  const before = draft.value.slice(0, selectionStart)
  const after = draft.value.slice(selectionEnd)

  draft.value = `${before}${insertedText}${after}`
  closePlaceholderDialog()

  const updated = cloneModelValue()
  updated.setText(draft.value)
  emitUpdated(updated)

  insertedPlaceholderBlocks.value = {
    ...insertedPlaceholderBlocks.value,
    [placeholderKey]: insertedText,
  }

  gainFocus(inputTextarea)
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

.dd-modal-toolbar {
  margin-inline: -16px;
  width: calc(100% + 2*16px);
  padding-inline: 16px;
  margin-top: 16px;
}

.dd-modal-textarea {
  border-bottom: 1px solid var(--ion-color-primary);
  --padding-top: 0;
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

.dd-placeholder-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.dd-placeholder-buttons ion-button {
  flex: 0;
}

.dd-placeholder-preview {
  white-space: pre-wrap;
  padding: 0.75rem;
  border: 1px solid var(--ion-color-medium-tint);
  border-radius: 8px;
  margin-bottom: 1rem;
  background: var(--ion-color-light);
}

.dd-placeholder-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dd-placeholder-label {
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
