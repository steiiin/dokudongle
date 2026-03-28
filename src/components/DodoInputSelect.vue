<template>
  <IonItem :lines="isCustomMode ? 'none' : lines">
    <IonSelect :label="label" interface="popover" v-model="selectValue">
      <IonSelectOption v-if="emptyLabel" value="">
        {{ emptyLabel }}
      </IonSelectOption>

      <IonSelectOption
        v-for="opt in normalizedOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </IonSelectOption>
      <IonSelectOption v-if="allowCustom" :value="CUSTOM_VALUE">
        Andere
      </IonSelectOption>
    </IonSelect>
  </IonItem>

  <IonItem v-if="isCustomMode" :lines="lines">
    <DodoInputText
      ref="customInput"
      v-model="customText"
      :label="'↳ ' + customLabel"
      :placeholder="customPlaceholder"
      :autocorrectFn="autocorrectFn"
      @leaved-empty="handleEmpty"
    />
  </IonItem>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'

const CUSTOM_VALUE = '__custom'

export type SelectValue = string | number
export type SelectOption = {
  value: SelectValue
  label: string }
export type OptionInput = SelectValue | SelectOption

const props = defineProps<{
  modelValue: SelectValue
  label: string
  options: OptionInput[]
  emptyLabel?: string
  allowCustom?: boolean
  customLabel?: string
  customPlaceholder?: string
  autocorrectFn?: (draft: string) => string,
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void
}>()

const customInput = ref<any|null>(null)
const customText = ref('')
const isCustomMode = ref(false)

const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        value: opt,
        label: String(opt),
      }
    }
    return opt
  })
})

function isKnownOption(value: SelectValue): boolean {
  return normalizedOptions.value.some((opt) => opt.value === value)
}

function isEmptyOption(value: SelectValue): boolean {
  return value === ''
}

const selectValue = computed({
  get(): SelectValue {
    if (isCustomMode.value) {
      return CUSTOM_VALUE
    }
    return props.modelValue
  },
  set(val: SelectValue) {
    if (val === CUSTOM_VALUE) {
      isCustomMode.value = true
      emit('update:modelValue', customText.value)
      setTimeout(() => { customInput.value?.setFocus() }, 300)
      return
    }

    isCustomMode.value = false
    emit('update:modelValue', val)
  },
})

const handleEmpty = () => {
  selectValue.value = !props.emptyLabel ? normalizedOptions.value[0].value : ''
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
    customText.value = String(value)
  },
  { immediate: true }
)

</script>