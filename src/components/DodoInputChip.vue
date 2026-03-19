<template>
  <IonChip :color="color" :outline="isEmpty" :disabled="disabled"
    :class="[ {
      'DdInputChip--inactive': isEmpty,
      'DdInputChip--bold': !isEmpty } ]"
    @click="openPopover">
    <IonIcon v-if="!isEmpty"
      :icon="closeCircle"
      @click.stop="clearValue">
    </IonIcon>
    <span>{{ displayLabel }}</span>
  </IonChip>

  <IonPopover :is-open="isPopoverOpen" :event="popoverEvent" @didDismiss="closePopover">
    <IonContent>
      <IonList lines="full">

        <IonItemDivider>{{ placeholder }}</IonItemDivider>

        <IonItem v-for="opt in normalizedOptions" :key="getOptionKey(opt)"
          button :detail="false"
          @click="selectOption(opt)">
          <IonLabel>{{ opt.label }}</IonLabel>
          <IonIcon v-if="modelValue === opt.value"
            slot="end" :icon="checkmark">
          </IonIcon>
        </IonItem>

        <IonItem button :detail="false" @click="selectOther">
          <IonLabel>Andere</IonLabel>
          <IonIcon v-if="modelValue === placeholder"
            slot="end" :icon="checkmark">
          </IonIcon>
        </IonItem>

      </IonList>
    </IonContent>
  </IonPopover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { closeCircle, checkmark } from 'ionicons/icons'

type InputChipOption =
  | string
  | {
      value: string
      label: string
    }

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    placeholder: string
    options: InputChipOption[]
    color?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const isPopoverOpen = ref(false)
const popoverEvent = ref<Event | undefined>(undefined)

const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : { value: opt.value, label: opt.label },
  ),
)

const isEmpty = computed(() => !props.modelValue)

const selectedOption = computed(() =>
  normalizedOptions.value.find((opt) => opt.value === props.modelValue),
)

const displayLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  return selectedOption.value?.label ?? props.modelValue
})

const openPopover = (ev: Event) => {
  if (props.disabled) return
  popoverEvent.value = ev
  isPopoverOpen.value = true
}

const closePopover = () => {
  isPopoverOpen.value = false
  popoverEvent.value = undefined
}

const selectOption = (opt: { value: string; label: string }) => {
  emit('update:modelValue', opt.value)
  closePopover()
}

const selectOther = () => {
  emit('update:modelValue', props.placeholder)
  closePopover()
}

const clearValue = () => {
  if (props.disabled) return
  emit('update:modelValue', null)
}

const getOptionKey = (opt: { value: string; label: string }) => opt.value
</script>

<style scoped>
ion-chip {
  margin-left: 0;
  cursor: pointer;
}

.DdInputChip--inactive {
  opacity: 0.9;
}

.DdInputChip--bold {
  font-weight: bold;
}

.DdInputChip__clear {
  margin-right: 0.35rem;
  font-size: 1rem;
  flex-shrink: 0;
}
</style>