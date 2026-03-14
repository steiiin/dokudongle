<template>
  <ion-item :lines="isCustomMode ? 'none' : lines">
    <ion-select :label="label" interface="popover" v-model="selectValue">
      <ion-select-option v-if="emptyLabel" value="">
        {{ emptyLabel }}
      </ion-select-option>
      <ion-select-option v-for="opt in options"
        :key="opt" :value="opt">
        {{ opt }}
      </ion-select-option>
      <ion-select-option v-if="allowCustom" :value="CUSTOM_VALUE">
        Andere
      </ion-select-option>
    </ion-select>
  </ion-item>

  <ion-item v-if="isCustomMode" :lines="lines">
    <dd-input-box ref="customInput"
      v-model="customText"
      :label="'↳ ' + customLabel"
      :placeholder="customPlaceholder"
      :autocorrectFn="basicCap"
      @leaved-empty="handleEmpty"
    />
  </ion-item>
</template>

<script setup lang="ts">

import { IonItem, IonSelect, IonSelectOption } from '@ionic/vue'
import { computed, ref, watch } from 'vue'

import DdInputBox from './DdInputBox.vue'
import { basicCap } from '@/utils/autocorrect/basic';

const CUSTOM_VALUE = '__custom'

const props = defineProps<{
  modelValue: string
  label: string
  options: string[]
  emptyLabel?: string
  allowCustom?: boolean
  customLabel?: string
  customPlaceholder?: string
  autocorrectFn?: (draft: string) => string,
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const customInput = ref<any|null>(null)
const customText = ref('')
const isCustomMode = ref(false)

function isKnownOption(value: string): boolean {
  return props.options.includes(value)
}

function isEmptyOption(value: string): boolean {
  return value === ''
}

const selectValue = computed({
  get(): string {
    if (isCustomMode.value) {
      return CUSTOM_VALUE
    }
    return props.modelValue
  },
  set(val: string) {
    if (val === CUSTOM_VALUE) {
      isCustomMode.value = true
      emit('update:modelValue', customText.value)
      setTimeout(() => { customInput.value?.setFocus() }, 300)
      return
    }
    isCustomMode.value = false
    emit('update:modelValue', val)
  }
})

const handleEmpty = () => {
  selectValue.value = ''
}

watch(customText, (value) => {
  if (isCustomMode.value) {
    emit('update:modelValue', value)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    const known = isKnownOption(value)
    const empty = isEmptyOption(value)

    if (known || empty) {
      // regular option or explicit empty selection
      if (!isCustomMode.value) {
        customText.value = ''
      }
      return
    }

    // external modelValue is a custom value
    isCustomMode.value = true
    customText.value = value
  },
  { immediate: true }
)

</script>