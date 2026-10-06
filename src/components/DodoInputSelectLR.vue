<template>
  <IonItem :lines="lines">
    <div class="dd-input-select-lr">
      <div class="dd-input-select-lr__label">
        <div :style="{ color: resolvedLabelColor }">{{ label }}</div>
        <div v-if="description" class="dd-input-select-lr__description">{{ description }}</div>
        <div class="dd-input-select-lr__description" aria-live="polite">
          Li: {{ displayLabel(left) }} • Re: {{ displayLabel(right) }}
        </div>
      </div>

      <div class="dd-input-select-lr__buttons">
        <IonButton v-for="side in sides" :key="side.value" size="small" fill="clear"
          :aria-label="`${label}: ${side.label}`" color="dark"
          aria-haspopup="dialog"
          @click="openPopover(side.value, $event)">
          {{ side.label }}
          <IonIcon slot="end" :icon="caretDown" aria-hidden="true" />
        </IonButton>
      </div>
    </div>
  </IonItem>

  <IonPopover :is-open="isPopoverOpen" :event="popoverEvent" reference="trigger"
    :aria-label="`${label}: ${activeSide === 'left' ? 'Links' : 'Rechts'}`"
    @didDismiss="onDismiss">
    <IonContent>
      <IonList lines="full">
        <IonItem v-for="opt in normalizedOptions" :key="`${typeof opt.value}:${opt.value}`"
          button :detail="false" :aria-current="selectedValue === opt.value ? 'true' : undefined"
          @click="selectOption(opt.value)">
          <IonLabel class="ion-text-wrap">{{ opt.label }}</IonLabel>
          <IonIcon v-if="selectedValue === opt.value" slot="end" :icon="checkmark" aria-hidden="true" />
        </IonItem>
      </IonList>
    </IonContent>
  </IonPopover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { checkmark, caretDown } from 'ionicons/icons'
import type { OptionInput, SelectOption, SelectValue } from './DodoInputSelect.vue'

const props = defineProps<{
  left: SelectValue
  right: SelectValue
  label: string
  labelColor?: string
  description?: string
  options: readonly OptionInput[]
  emptyLabel?: string
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:left', value: SelectValue): void
  (e: 'update:right', value: SelectValue): void
}>()

type Side = 'left' | 'right'
const sides = [
  { value: 'left', label: 'Li' },
  { value: 'right', label: 'Re' },
] as const

const activeSide = ref<Side | null>(null)
const isPopoverOpen = ref(false)
const popoverEvent = ref<Event>()
const selectedValue = computed(() => activeSide.value === null ? undefined : props[activeSide.value])

const normalizedOptions = computed<SelectOption[]>(() => {
  const options = props.options.map(opt => typeof opt === 'object'
    ? opt
    : { value: opt, label: String(opt) })

  return props.emptyLabel !== undefined
    ? [{ value: '', label: props.emptyLabel }, ...options.filter(opt => opt.value !== '')]
    : options
})

const displayLabel = (value: SelectValue): string =>
  normalizedOptions.value.find(opt => opt.value === value)?.label ?? (value === '' ? '—' : String(value))

const resolvedLabelColor = computed(() => {
  const color = props.labelColor?.trim()
  if (!color) return undefined
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl') || color.startsWith('var(')) {
    return color
  }
  return `var(--ion-color-${color})`
})

const openPopover = (side: Side, event: Event) => {
  if (activeSide.value !== null) return
  activeSide.value = side
  popoverEvent.value = event
  isPopoverOpen.value = true
}

const selectOption = (value: SelectValue) => {
  if (!isPopoverOpen.value || activeSide.value === null) return
  if (activeSide.value === 'left') emit('update:left', value)
  else emit('update:right', value)
  isPopoverOpen.value = false
}

const onDismiss = () => {
  isPopoverOpen.value = false
  activeSide.value = null
  popoverEvent.value = undefined
}
</script>

<style scoped>
.dd-input-select-lr {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .5rem 1rem;
  width: 100%;
  min-width: 0;
  padding: .5rem 0;
}

.dd-input-select-lr__label {
  flex: 1 1 12rem;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.dd-input-select-lr__description {
  color: var(--ion-color-medium);
  font-size: .8em;
}

.dd-input-select-lr__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: .25rem;
  margin-inline-start: auto;
}

.dd-input-select-lr__buttons ion-button {
  margin: 0;
}

.dd-input-select-lr__buttons ion-icon {
  pointer-events: none;
}
</style>
