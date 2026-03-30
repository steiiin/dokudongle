<template>

  <IonItem :lines="props.toggle ? 'none' : props.lines">
    <IonToggle :model-value="props.toggle"
      label-placement="end"
      @update:model-value="onToggleChange">
      {{ props.toggleLabel }}
    </IonToggle>
  </IonItem>

  <IonItem v-if="props.toggle" :lines="props.lines">

    <DodoInputSelect
      ref="textSelect"
      :label="props.textLabel ? '↳ ' + props.textLabel : '↳ '" v-model="props.text"
      :empty-label="props.emptyLabel"
      :options="props.options"
      :allow-custom="props.allowCustom" :custom-label="props.customLabel" :custom-placeholder="props.customPlaceholder"
      :autocorrect-fn="props.autocorrectFn"
      @update:model-value="onTextChange"
      @leaved-empty="handleEmpty">
    </DodoInputSelect>

  </IonItem>
</template>

<script setup lang="ts">

import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import DodoInputSelect, { OptionInput, SelectValue } from './DodoInputSelect.vue'

// ############################################################################

const props = withDefaults(defineProps<{

  toggleLabel: string
  toggle: boolean

  textLabel?: string
  text: string

  emptyLabel?: string
  options: OptionInput[]
  allowCustom?: boolean
  customLabel?: string
  customPlaceholder?: string

  autocorrectFn?: (draft: string) => string
  lines?: 'full' | 'inset' | 'none'

}>(), {
  textLabel: '',
  lines: 'full',
})

const emit = defineEmits<{
  (e: 'update:toggle', value: boolean): void
  (e: 'update:text', value: SelectValue): void
}>()

// ############################################################################

const textSelect = ref<InstanceType<typeof DodoInputSelect> | null>(null)

// ############################################################################

let focusTimeout: ReturnType<typeof setTimeout> | null = null
const clearFocusTimeout = () => {
  if (focusTimeout) {
    clearTimeout(focusTimeout)
    focusTimeout = null
  }
}

// ############################################################################

const onToggleChange = (value: boolean | null | undefined) => {
  emit('update:toggle', !!value)
}

const onTextChange = (value: SelectValue) => {
  emit('update:text', value ?? '')
}

const handleEmpty = () => {
  emit('update:toggle', false)
}

// ############################################################################

watch(
  () => props.toggle,
  async (enabled) => {
    clearFocusTimeout()

    if (!enabled) return

    await nextTick()

    focusTimeout = setTimeout(() => {
      textSelect.value?.$el.click?.()
    }, 300)
  }
)

// ############################################################################

onBeforeUnmount(() => {
  clearFocusTimeout()
})

</script>