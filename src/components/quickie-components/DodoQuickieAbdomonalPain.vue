<template>
  <IonModal :is-open="isOpen" class="dd-placeholder-modal">
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ quickie?.label }}</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="handleCancel">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton color="primary" :disabled="containsEmptyText" @click="handleAccept">Einfügen</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">

      <div v-if="quickie" class="dd-placeholder-preview"
        v-html="placeholderPreviewText">
      </div>

      <IonList v-if="quickie">
        <template
          v-for="(field, index) in quickie.fields"
          :key="field.key"
        >
          <DodoInputSelect
            v-if="field.allowOptions"
            v-model="placeholderValues[field.key]"
            :label="field.key"
            :options="field.options ?? []"
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem } from '@ionic/vue'
import { QuickieTemplate } from '@/data/quickies'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieTemplate | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

const placeholderValues = ref<Record<string, string>>({})

watch(
  () => props.quickie,
  (quickie) => {
    if (!quickie) {
      placeholderValues.value = {}
      return
    }

    placeholderValues.value = quickie.fields.reduce((collector, field) => {
      collector[field.key] = ''
      return collector
    }, {} as Record<string, string>)
  },
  { immediate: true }
)

const resolveColor = (color?: string): string | undefined => {
  if (!color || color.trim().length === 0) {
    return undefined
  }

  const trimmedColor = color.trim()
  if (
    trimmedColor.startsWith('#') ||
    trimmedColor.startsWith('rgb') ||
    trimmedColor.startsWith('hsl') ||
    trimmedColor.startsWith('var(')
  ) {
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

const containsEmptyText = computed(() => {
  return placeholderPreviewText.value.includes('dodo-tag')
})

const placeholderPreviewText = computed(() => {
  const quickie = props.quickie
  if (!quickie) {
    return ''
  }

  return quickie.fields.reduce((text, field) => {
    const value = placeholderValues.value[field.key]?.trim()
    const color = resolveColor(field.color)

    const fallbackTag = color
      ? `<dodo-tag style="--dd-tag-color: ${escapeHtml(color)};">${field.key}</dodo-tag>`
      : `<dodo-tag>${field.key}</dodo-tag>`

    const replacement = value && value.length > 0
      ? escapeHtml(value)
      : fallbackTag

    return text.replaceAll(`<${field.key}>`, replacement)
  }, quickie.template)
})

const isLastPlaceholderField = (index: number): boolean => {
  const quickie = props.quickie
  if (!quickie) {
    return false
  }
  return index === quickie.fields.length - 1
}

const handleCancel = () => {
  emit('cancel')
}

const handleAccept = () => {
  emit('accept', placeholderPreviewText.value)
}
</script>

<style scoped>
.dd-placeholder-preview {
  white-space: pre-wrap;
  padding: 0.75rem;
  border: 1px solid var(--ion-color-medium-tint);
  border-radius: 8px;
  margin-bottom: 1rem;
  background: var(--ion-color-light);
}
</style>