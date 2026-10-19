<template>
  <IonItem :lines="lines">
    <IonToggle
      class="dd-input-toggle"
      :model-value="modelValue"
      :disabled="disabled"
      :style="toggleStyle"
      label-placement="end"
      @update:model-value="onChange"
      @pointerdown="emit('pointerdown', $event)"
    >
      <slot />
    </IonToggle>
  </IonItem>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonItem, IonToggle } from '@ionic/vue'

export type ToggleColor = 'green' | 'yellow' | 'orange' | 'red'

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  lines?: 'full' | 'inset' | 'none'
  colorOn?: ToggleColor
  colorOff?: ToggleColor
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'pointerdown', event: PointerEvent): void
}>()

const colors = {
  green: { track: 'var(--ion-color-success)', handle: 'var(--ion-color-success)' },
  yellow: { track: 'var(--ion-color-warning)', handle: 'var(--ion-color-warning)' },
  orange: { track: '#ff9800', handle: '#ff9800' },
  red: { track: 'var(--ion-color-danger)', handle: 'var(--ion-color-danger)' },
} as const

const toggleStyle = computed(() => {
  const on = props.colorOn ? colors[props.colorOn] : undefined
  const off = props.colorOff ? colors[props.colorOff] : undefined
  return {
    '--dd-toggle-label-color': (props.modelValue ? on : off)?.track,
  }
})

const onChange = (value: boolean | null | undefined) => {
  if (!props.disabled) emit('update:modelValue', !!value)
}
</script>

<style scoped>
.dd-input-toggle::part(label) {
  color: var(--dd-toggle-label-color, inherit);
}
</style>
