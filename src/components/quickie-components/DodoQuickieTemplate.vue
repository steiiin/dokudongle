<template>
  <IonModal :is-open="isOpen" class="dd-quickie-modal" :can-dismiss="false">
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

      <div v-if="quickie" class="dd-quickie-preview"
        v-html="placeholderPreviewText">
      </div>

      <IonList v-if="quickie">
        <template v-for="(field, index) in quickie.fields" :key="field.key">

          <IonItem :lines="isLastPlaceholderField(index) ? 'none' : 'full'">
            <DodoInputText
              v-model="placeholderValues[field.key]"
              :label="field.key"
              :placeholder="field.customPlaceholder"
              :label-color="field.color"
              :ime-dictionary="{ /* activate IME */ }"
              :assist-context-id="fieldAssistContext(field.key)">
            </DodoInputText>
          </IonItem>

        </template>
      </IonList>
    </IonContent>
    <IonFooter>
      <DodoTextSuggestionHost />
    </IonFooter>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonFooter, IonList, IonItem } from '@ionic/vue'

import DodoTextSuggestionHost from '@/components/DodoTextSuggestionHost.vue'
import { QuickieTemplate } from '@/data/quickies'
import { provideTextSuggestionScope } from '@/services/text-suggestions'

const props = defineProps<{
  isOpen: boolean
  quickie: QuickieTemplate | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept', insertedText: string): void
}>()

const placeholderValues = ref<Record<string, string>>({})
const suggestionScope = provideTextSuggestionScope()

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

const fieldAssistContext = (fieldKey: string): string =>
  `quickie.${props.quickie?.key ?? 'template'}.${fieldKey.toLowerCase()}`

const handleCancel = () => {
  suggestionScope.reset()
  emit('cancel')
}

const handleAccept = () => {
  suggestionScope.reset()
  emit('accept', placeholderPreviewText.value)
}
</script>

<style scoped>



</style>
