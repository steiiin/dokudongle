<template>
  <div class="dd-input-textarea">

    <div class="preview" v-if="!modelValue.isEmpty">
      {{ modelValue.value }}
    </div>

    <IonButton :color="isMissingField ? 'danger' : (inheritStyle ? 'dark' : '')"
      :fill="inheritStyle ? 'clear' : 'outline'" expand="block"
      size="default" :disabled="modelValue.isEnhancing" :class="{ inheritStyle }"
      @click="openModal">
      <IonIcon slot="start" :src="alertCircle" v-if="isMissingField"></IonIcon>
      {{ title }} {{ modelValue.isEmpty ? 'hinzufügen' : 'bearbeiten' }}
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
          <IonTextarea ref="inputTextarea" class="dd-modal-textarea"
            v-model="draft" :placeholder="placeholder"
            :auto-grow="true" :disabled="modelValue.isEnhancing"
            @ionFocus="handleFocus"
            @ionBlur="handleBlur">
          </IonTextarea>
          <div class="dd-placeholder-buttons" v-if="resolvedPlaceholders.length > 0">
            <IonButton
              v-for="placeholderTemplate in resolvedPlaceholders" :key="placeholderTemplate.key"
              fill="outline" size="small" @click="openPlaceholderDialog(placeholderTemplate)">
              {{ placeholderTemplate.label }}
            </IonButton>
          </div>
        </div>
      </IonContent>
      <IonFooter>
        <IonToolbar class="dd-modal-toolbar" v-if="!modelValue.isEnhancing">
          <IonButtons slot="start">
            <IonButton @click="undo" >
              <IonIcon :src="arrowUndo" slot="icon-only"></IonIcon>
            </IonButton>
            <IonButton @click="redo">
              <IonIcon :src="arrowRedo" slot="icon-only"></IonIcon>
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton @click="clear" v-if="!modelValue.isEmpty">
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
            <IonButton color="primary" @click="acceptPlaceholderDialog">
              Einfügen
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class="ion-padding">
        <div class="dd-placeholder-preview" v-if="activePlaceholder" v-html="placeholderPreviewText">
        </div>
        <IonList v-if="activePlaceholder">
          <template v-for="field in activePlaceholder.fields" :key="field.key">

            <DodoInputSelect v-model="placeholderValues[field.key]" v-if="field.allowOptions"
              :label="field.label" :options="field.options"
              :allow-custom="field.allowCustom" :custom-label="field.customLabel" :custom-placeholder="field.customPlaceholder">
            </DodoInputSelect>

            <IonItem v-else>
              <DodoInputText v-model="placeholderValues[field.key]"
                :label="field.label" :placeholder="field.customPlaceholder">
              </DodoInputText>
            </IonItem>

          </template>
        </IonList>
      </IonContent>
    </IonModal>
  </div>
</template>

<script setup lang="ts">

import { alertController } from '@ionic/vue'
import { toastController } from '@ionic/vue'

import { alertCircle, arrowRedo, arrowUndo, trashBin, warningOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { EnhanceableText } from '@/types/protocol/input'
import { INPUT_TEXTAREA_PLACEHOLDERS, type PlaceholderTemplate } from '@/data/placeholders'

const props = withDefaults(defineProps<{
  modelValue: EnhanceableText
  title: string
  placeholder?: string
  mandatory?: boolean
  inheritStyle?: boolean
  placeholders?: string[]
  enhanceFn: (draft: string) => Promise<string | null>
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: EnhanceableText): void
}>()

const isModalOpen = ref(false)
const draft = ref('')
const isEditing = ref(false)
const lastCursorStart = ref(0)
const lastCursorEnd = ref(0)
const isPlaceholderModalOpen = ref(false)
const activePlaceholder = ref<PlaceholderTemplate | null>(null)
const placeholderValues = ref<Record<string, string>>({})

const isMissingField = computed(() => props.mandatory && props.modelValue.isEmpty)
const resolvedPlaceholders = computed(() => {
  if (!props.placeholders || props.placeholders.length === 0) {
    return []
  }
  return props.placeholders
    .map((placeholderKey) => INPUT_TEXTAREA_PLACEHOLDERS[placeholderKey.toLowerCase().trim()])
    .filter((placeholder): placeholder is PlaceholderTemplate => Boolean(placeholder))
})
const placeholderPreviewText = computed(() => {
  if (!activePlaceholder.value) { return '' }
  return activePlaceholder.value.fields.reduce((text, field) => {
    const value = placeholderValues.value[field.key]?.trim()
    const replacement = value && value.length > 0 ? value : `<dodo-tag>${field.key}</dodo-tag>`
    return text.replaceAll(`<${field.key}>`, replacement)
  }, activePlaceholder.value.template)
})

const cloneModelValue = (): EnhanceableText => {
  return props.modelValue.clone()
}

const emitUpdated = (updated: EnhanceableText) => {
  emit('update:modelValue', updated)
}

watch(
  () => props.modelValue.value,
  (newValue) => {
    if (!isEditing.value && !isModalOpen.value) {
      draft.value = newValue
    }
  }
)

const isEnhanceDisabled = computed(() => {
  return props.modelValue.isEnhancing || draft.value.trim().length === 0
})

const openModal = () => {
  draft.value = props.modelValue.value
  isModalOpen.value = true
  setTimeout(() => setTextareaFocus(), 300)
}

const closeModal = () => {
  commitOpenEditIfNeeded()
  isModalOpen.value = false
}

const inputTextarea = ref<any|null>(null)
const getNativeTextarea = async (): Promise<HTMLTextAreaElement | null> => {
  const element = inputTextarea.value?.$el

  if (!element || typeof element.getInputElement !== 'function') {
    return null
  }

  return (await element.getInputElement()) as HTMLTextAreaElement
}
const setTextareaFocus = async () => {
  const element = inputTextarea.value?.$el
  if (element && typeof element.setFocus === 'function') {
    await element.setFocus()
  }
}
const rememberCursorPosition = async () => {
  const textarea = await getNativeTextarea()
  if (!textarea) {
    return
  }

  lastCursorStart.value = textarea.selectionStart ?? draft.value.length
  lastCursorEnd.value = textarea.selectionEnd ?? draft.value.length
}

const handleFocus = () => {
  isEditing.value = true

  const updated = cloneModelValue()
  updated.beginEdit()
  emitUpdated(updated)
  rememberCursorPosition()
}

const handleBlur = () => {
  rememberCursorPosition()
  isEditing.value = false

  const updated = cloneModelValue()
  updated.commitEdit(draft.value)
  emitUpdated(updated)

  draft.value = updated.value
}

const commitOpenEditIfNeeded = () => {
  if (!isEditing.value) {
    return
  }

  isEditing.value = false

  const updated = cloneModelValue()
  updated.commitEdit(draft.value)
  emitUpdated(updated)

  draft.value = updated.value
}

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

async function confirmDelete(): Promise<boolean> {
  return new Promise(async (resolve) => {
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
}

const clear = async () => {
  const confirmed = await confirmDelete()
  if (!confirmed) return

  const updated = cloneModelValue()
  updated.commitEdit('')

  emitUpdated(updated)

  draft.value = ''
  isEditing.value = false

  isModalOpen.value = false
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

const updatePlaceholderField = (fieldKey: string, event: CustomEvent) => {
  const value = (event.detail?.value ?? '').toString()
  placeholderValues.value = {
    ...placeholderValues.value,
    [fieldKey]: value,
  }
}

const acceptPlaceholderDialog = async () => {
  if (!activePlaceholder.value) {
    return
  }

  const insertedText = placeholderPreviewText.value
  const selectionStart = lastCursorStart.value
  const selectionEnd = lastCursorEnd.value
  const before = draft.value.slice(0, selectionStart)
  const after = draft.value.slice(selectionEnd)

  draft.value = `${before}${insertedText}${after}`
  closePlaceholderDialog()

  const updated = cloneModelValue()
  updated.commitEdit(draft.value)
  emitUpdated(updated)

  await setTextareaFocus()
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

defineExpose({
  openModal
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
  color: var(--ion-color-primary);
  font-family: monospace;
  font-size: 1.3em;
}
dodo-tag::before { content: '#'; }
</style>