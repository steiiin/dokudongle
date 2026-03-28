<template>
  <IonInput class="dd-input-text"
    ref="inputRef"
    v-model="inputValue"
    :label="label"
    :placeholder="placeholder ?? 'Text eingeben ...'"
    :inputmode="inputmode"
    @ionBlur="handleBlur">
  </IonInput>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: string,
  label?: string,
  placeholder?: string,
  autocorrectFn?: (draft: string) => string,
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url',
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'leaved-empty'): void,
}>()

const inputRef = ref<any|null>(null)

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string | null | undefined) => {
    emit('update:modelValue', value ?? '')
  },
})

const handleBlur = () => {

  const value = props.modelValue?.trim() ?? ''
  if (value === '') { emit('leaved-empty') }

  if (!props.autocorrectFn) { return }

  const corrected =  props.autocorrectFn(props.modelValue);
  if (corrected !== props.modelValue) {
    emit('update:modelValue', corrected)
  }

}

const setFocus = async () => {
  const element = inputRef.value?.$el
  if (element && typeof element.setFocus === 'function') {
    await element.setFocus()
  }
}

defineExpose({
  setFocus,
})

</script>

<style>

ion-input.dd-input-text .native-input {
  text-align: right !important;
}

</style>
