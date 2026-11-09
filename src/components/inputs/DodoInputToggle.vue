<template>
  <div :class="{ 'dd-ripple-surface': rippleEnabled, 'ion-activatable': rippleEnabled && !disabled }">
    <IonItem v-bind="$attrs" :lines="lines">
      <IonToggle
        :model-value="modelValue"
        :disabled="disabled"
        justify="space-between" mode="md"
        @update:model-value="onChange"
        @pointerdown="emit('pointerdown', $event)"
      >
        <slot />
      </IonToggle>
    </IonItem>
    <IonRippleEffect v-if="rippleEnabled && !disabled" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { IonItem, IonRippleEffect, IonToggle } from '@ionic/vue'
import { isMaterialMode } from '@/utils/ripple'

defineOptions({ inheritAttrs: false })
const rippleEnabled = isMaterialMode()

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'pointerdown', event: PointerEvent): void
}>()

const onChange = (value: boolean | null | undefined) => {
  if (!props.disabled) emit('update:modelValue', !!value)
}
</script>
