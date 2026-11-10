<template>

  <IonItem :lines="isCustomMode ? 'none' : lines">
    <IonSelect ref="select" interface="popover" v-model="selectValue" :disabled="disabled" :style="selectStyle" class="dd-input-select">

      <div slot="label" class="multiline-label-wrapper">
        <div class="select-label-line">
          <span>{{ label }}</span>
          <span class="select-label-end"><slot name="label-end" /></span>
        </div>
        <div class="description-label-wrapper" v-if="description">{{ description }}</div>
      </div>

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
        {{ customOptionLabel ?? 'Andere' }}
      </IonSelectOption>
    </IonSelect>
  </IonItem>

  <IonItem v-if="isCustomMode" :lines="lines">
    <DodoInputText
      ref="customInput"
      v-model="customText"
      :disabled="disabled"
      :label="'↳ ' + customLabel"
      :placeholder="customPlaceholder"
      :label-color="labelColor"
      :ime-dictionary="imeDictionary"
      :assist-context-id="assistContextId"
      @leaved-empty="handleEmpty"
    />
  </IonItem>

</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { IonSelect } from '@ionic/vue'
import type { ImeDictionary } from '@/services/text-assist'

// ############################################################################

export type SelectValue = string | number
export type SelectOption = {
  value: SelectValue
  label: string }
export type OptionInput = SelectValue | SelectOption

// ############################################################################

const props = defineProps<{
  modelValue: SelectValue
  label: string
  labelColor?: string
  description?: string
  options: readonly OptionInput[]
  emptyLabel?: string
  allowCustom?: boolean
  disabled?: boolean
  customOptionLabel?: string
  customLabel?: string
  customPlaceholder?: string
  imeDictionary?: ImeDictionary,
  assistContextId?: string,
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void
}>()

// ############################################################################

const select = ref<InstanceType<typeof IonSelect> | null>(null)
const open = () => {
  if (props.disabled) return
  const element = select.value?.$el as HTMLIonSelectElement | undefined
  // Ionic benötigt ein Ereignis als Bezugspunkt für Popovers; ohne dieses öffnet es einen Hinweisdialog.
  return element?.open({ target: element } as unknown as UIEvent)
}
defineExpose({ open })

const CUSTOM_VALUE = '__custom'

const customInput = ref<any|null>(null)
const customText = ref('')
const isCustomMode = ref(false)

// ############################################################################

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

const resolvedLabelColor = computed(() => {
  if (!props.labelColor || props.labelColor.trim().length === 0) {
    return undefined
  }

  const color = props.labelColor.trim()
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl') || color.startsWith('var(')) {
    return color
  }

  return `var(--ion-color-${color})`
})

const selectStyle = computed(() => {
  if (!resolvedLabelColor.value) {
    return undefined
  }
  return {
    '--dd-label-color': resolvedLabelColor.value,
  }
})

const selectValue = computed({
  get(): SelectValue {
    if (isCustomMode.value) {
      return CUSTOM_VALUE
    }
    return props.modelValue
  },
  set(val: SelectValue) {
    if (props.disabled) return
    if (val === CUSTOM_VALUE) {
      isCustomMode.value = true
      setTimeout(() => { if (!props.disabled) customInput.value?.setFocus() }, 300)
      return
    }

    isCustomMode.value = false
    emit('update:modelValue', val)
  },
})

// ############################################################################

function isKnownOption(value: SelectValue): boolean {
  return normalizedOptions.value.some((opt) => opt.value === value)
}

function isEmptyOption(value: SelectValue): boolean {
  return value === ''
}

// ############################################################################

const handleEmpty = () => {
  if (props.disabled) return
  selectValue.value = !props.emptyLabel ? normalizedOptions.value[0].value : ''
}

// ############################################################################

watch(customText, (value) => {
  if (isCustomMode.value && !props.disabled) {
    emit('update:modelValue', value)
  }
})

watch(
  () => props.modelValue,
  (value) => {

    const known = isKnownOption(value)
    const empty = isEmptyOption(value)

    if (empty && isCustomMode.value && customText.value === '') {
      return
    }

    if (known || empty) {
      isCustomMode.value = false
      customText.value = ''
      return }

    isCustomMode.value = true
    customText.value = String(value)
  },
  { immediate: true }
)

</script>

<style>

  ion-select.dd-input-select::part(label) {
    color: var(--dd-label-color, inherit);
  }

</style>
<style scoped>

.multiline-label-wrapper {
  padding: .5rem 0;
}

.select-label-line {
  display: flex;
  align-items: center;
}

.select-label-end {
  display: flex;
  align-items: center;
  flex: none;
  /* Keep the action's hit area from changing the label's line height. */
  height: 0;
}

.description-label-wrapper {
  color: var(--ion-color-medium);
  font-size: 0.8em;

  white-space: normal;
  overflow-wrap: anywhere;
}

</style>
