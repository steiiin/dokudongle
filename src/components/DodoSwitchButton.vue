<template>
  <IonButton
    :fill="modelValue ? 'solid' : 'outline'"
    size="small"
    :class="{ expand }"
    @click="toggle"
  >
    <IonIcon :icon="modelValue ? checkmark : close" />
    <slot />
  </IonButton>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { checkmark, close } from 'ionicons/icons'

const props = defineProps<{
  modelValue: boolean
  expand?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style>
ion-button.expand {
  flex: inherit;
  width: 100%;
}

ion-button {
  flex: 1;
}
</style>