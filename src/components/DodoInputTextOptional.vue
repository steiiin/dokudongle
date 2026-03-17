<template>
  <IonItem :lines="props.toggle ? 'none' : props.lines">
    <IonToggle
      :model-value="props.toggle"
      label-placement="end"
      @update:model-value="onToggleChange"
    >
      {{ props.toggleLabel }}
    </IonToggle>
  </IonItem>

  <IonItem v-if="props.toggle" :lines="props.lines">
    <DodoInputText
      ref="textInput"
      :model-value="props.text"
      :label="props.textLabel ? '↳ ' + props.textLabel : '↳ '"
      :placeholder="props.textPlaceholder"
      :autocorrectFn="props.autocorrectFn"
      @update:model-value="onTextChange"
      @leaved-empty="handleEmpty"
    />
  </IonItem>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { IonItem, IonToggle } from '@ionic/vue'
import DodoInputText from './DodoInputText.vue'

const props = withDefaults(defineProps<{
  toggleLabel: string
  toggle: boolean
  textLabel?: string
  textPlaceholder?: string
  text: string
  autocorrectFn?: (draft: string) => string
  lines?: 'full' | 'inset' | 'none'
}>(), {
  textLabel: '',
  textPlaceholder: '',
  lines: 'full',
})

const emit = defineEmits<{
  (e: 'update:toggle', value: boolean): void
  (e: 'update:text', value: string): void
}>()

const textInput = ref<InstanceType<typeof DodoInputText> | null>(null)
let focusTimeout: ReturnType<typeof setTimeout> | null = null

const clearFocusTimeout = () => {
  if (focusTimeout) {
    clearTimeout(focusTimeout)
    focusTimeout = null
  }
}

const onToggleChange = (value: boolean | null | undefined) => {
  emit('update:toggle', !!value)
}

const onTextChange = (value: string | null | undefined) => {
  emit('update:text', value ?? '')
}

watch(
  () => props.toggle,
  async (enabled) => {
    clearFocusTimeout()

    if (!enabled) return

    await nextTick()

    focusTimeout = setTimeout(() => {
      textInput.value?.setFocus?.()
    }, 300)
  }
)

const handleEmpty = () => {
  emit('update:toggle', false)
}

onBeforeUnmount(() => {
  clearFocusTimeout()
})
</script>