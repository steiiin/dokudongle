<template>
  <div class="dd-input-textarea">

    <div class="preview" v-if="!modelValue.isEmpty">
      {{ modelValue.value }}
    </div>

    <IonButton :color="isMissingField ? 'danger' : (inheritStyle ? 'dark' : '')"
      :fill="inheritStyle ? 'clear' : 'outline'" expand="block"
      size="small" :disabled="modelValue.isEnhancing" :class="{ inheritStyle }"
      @click="openModal">
      <IonIcon slot="start" :src="alertCircle" v-if="isMissingField"></IonIcon>
      {{ title }} {{ modelValue.isEmpty ? 'hinzufügen' : 'bearbeiten' }}
    </IonButton>

    <IonModal class="dd-input-modal"
      :is-open="isModalOpen"

      :class="{ 'is-enhancing': modelValue.isEnhancing }"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{{ title }}</IonTitle>
        </IonToolbar>

        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              :disabled="modelValue.isEnhancing"
              @click="closeModal"
            >
              Speichern
            </IonButton>
          </IonButtons>

          <IonButtons slot="end">
            <IonButton
              color="success"
              :disabled="isEnhanceDisabled"
              @click="enhance"
            >
              Verbessern
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonProgressBar
          v-if="modelValue.isEnhancing"
          type="indeterminate"
        />
      </IonHeader>

      <IonContent class="dd-modal-content ion-padding">
        <div class="hint" v-if="$slots.default">
          <slot />
        </div>

        <div class="dd-modal-data">
          <IonTextarea ref="inputTextarea"
            class="dd-modal-textarea"
            v-model="draft" :placeholder="placeholder"
            :auto-grow="true"
            :disabled="modelValue.isEnhancing"
            @ionFocus="handleFocus"
            @ionBlur="handleBlur"
          />

          <div class="dd-actions">
            <IonButton
              size="small"
              fill="outline"
              :disabled="modelValue.isEnhancing || !modelValue.canUndo"
              @click="undo"
            >
              Undo
            </IonButton>

            <IonButton
              size="small"
              fill="outline"
              :disabled="modelValue.isEnhancing || !modelValue.canRedo"
              @click="redo"
            >
              Redo
            </IonButton>
          </div>
          <IonButton
              size="small" color="danger" fill="outline"
              :disabled="modelValue.isEmpty"
              @click="clear" style="margin-top:-0.25rem">
              Eingaben löschen
            </IonButton>
        </div>
      </IonContent>
    </IonModal>
  </div>
</template>

<script setup lang="ts">

import { alertController } from '@ionic/vue'
import { toastController } from '@ionic/vue'

import { alertCircle, warningOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { EnhanceableText } from '@/types/protocol/input'

const props = withDefaults(defineProps<{
  modelValue: EnhanceableText
  title: string
  placeholder?: string
  mandatory?: boolean
  inheritStyle?: boolean
  enhanceFn: (draft: string) => Promise<string | null>
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: EnhanceableText): void
}>()

const isModalOpen = ref(false)
const draft = ref('')
const isEditing = ref(false)

const isMissingField = computed(() => props.mandatory && props.modelValue.isEmpty)

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
const setTextareaFocus = async () => {
  const element = inputTextarea.value?.$el
  if (element && typeof element.setFocus === 'function') {
    await element.setFocus()
  }
}

const handleFocus = () => {
  isEditing.value = true

  const updated = cloneModelValue()
  updated.beginEdit()
  emitUpdated(updated)
}

const handleBlur = () => {
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

.dd-modal-content .hint {
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

.inheritStyle {
  background-color: var(--card-bg);
}
</style>