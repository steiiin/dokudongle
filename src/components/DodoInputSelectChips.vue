<template>
  <IonItem :lines="isCustomMode ? 'none' : lines">
    <button ref="trigger" type="button" class="dd-input-select-chips" aria-haspopup="dialog"
      :aria-expanded="isDialogOpen" @click="openDialog">
      <span class="dd-input-select-chips__label">
        <span :style="{ color: resolvedLabelColor }">{{ label }}</span>
        <span v-if="description" class="dd-input-select-chips__description">{{ description }}</span>
      </span>
      <span class="dd-input-select-chips__summary" aria-live="polite">{{ summary }}</span>
      <IonIcon :icon="caretDown" aria-hidden="true" />
    </button>
  </IonItem>

  <IonItem v-if="isCustomMode" :lines="lines">
    <DodoInputText ref="customInput" :model-value="customText"
      :label="'↳ ' + (customLabel ?? 'Andere')" :placeholder="customPlaceholder"
      :label-color="labelColor" :ime-dictionary="imeDictionary" :assist-context-id="assistContextId"
      @update:model-value="updateCustomText" @leaved-empty="leaveEmpty" />
  </IonItem>

  <IonModal class="dd-input-select-chips-modal" :is-open="isDialogOpen"
    :backdrop-dismiss="true" :aria-label="label" @didDismiss="onDismiss">
    <div class="dd-input-select-chips__dialog">
      <header class="dd-input-select-chips__heading">
        <h2>{{ label }}</h2>
        <p v-if="description">{{ description }}</p>
      </header>
      <div class="dd-input-select-chips__cloud">
        <div v-for="(row, index) in visibleRows" :key="index" class="dd-input-select-chips__row">
          <button v-for="option in row" :key="`${typeof option.value}:${option.value}`"
            type="button" class="dd-input-select-chips__chip"
            :aria-pressed="!isCustomMode && selectedValues.includes(option.value)" @click="toggleValue(option.value)">
            <IonIcon v-if="!isCustomMode && selectedValues.includes(option.value)" :icon="checkmark" aria-hidden="true" />
            {{ option.label }}
          </button>
        </div>
        <div class="dd-input-select-chips__row" v-if="allowCustom && !isCustomMode">
          <button
            type="button" class="dd-input-select-chips__chip dd-input-select-chips__custom"
            aria-label="Eigenen Wert eingeben" @click="enterCustom">
            <IonIcon :icon="pencil" aria-hidden="true" />
            Andere
          </button>
        </div>
      </div>
      <footer class="dd-input-select-chips__actions">
        <IonButton type="button" fill="clear" class="dd-input-select-chips__apply" @click="isDialogOpen = false">
          Übernehmen
        </IonButton>
      </footer>
    </div>
  </IonModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { caretDown, checkmark, pencil } from 'ionicons/icons'
import DodoInputText from './DodoInputText.vue'
import type { OptionInput, SelectOption, SelectValue } from './DodoInputSelect.vue'
import type { ImeDictionary } from '@/services/text-assist'

const props = withDefaults(defineProps<{
  modelValue: SelectValue[]
  label: string
  labelColor?: string
  description?: string
  options: readonly (OptionInput | readonly OptionInput[])[]
  emptyLabel?: string
  allowCustom?: boolean
  customLabel?: string
  customPlaceholder?: string
  imeDictionary?: ImeDictionary
  assistContextId?: string
  lines?: 'full' | 'inset' | 'none'
}>(), {
  emptyLabel: 'Keine',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue[]): void
}>()

const isOptionRow = (option: OptionInput | readonly OptionInput[]): option is readonly OptionInput[] =>
  Array.isArray(option)
const normalizeOption = (option: OptionInput): SelectOption =>
  typeof option === 'object' ? option : { value: option, label: String(option) }
const normalizedRows = computed<SelectOption[][]>(() => {
  const rows: SelectOption[][] = []
  let currentRow: SelectOption[] | undefined
  for (const option of props.options) {
    if (isOptionRow(option)) {
      rows.push(option.map(normalizeOption))
      currentRow = undefined
    } else {
      if (!currentRow) rows.push(currentRow = [])
      currentRow.push(normalizeOption(option))
    }
  }
  return rows
})
const normalizedOptions = computed(() => normalizedRows.value.flat())
const selectedValues = computed(() => [...new Set(props.modelValue.filter(value => value !== ''))])
const isKnown = (value: SelectValue) => normalizedOptions.value.some(option => option.value === value)
const visibleRows = computed(() => {
  const seen = new Set<SelectValue>()
  const rows = normalizedRows.value.map(row => row.filter(option => {
    if (option.value === '' || seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })).filter(row => row.length > 0)
  // Keep externally supplied values removable even if their option disappeared.
  for (const value of selectedValues.value) {
    if (!seen.has(value) && value !== customEntry.value) {
      if (rows.length === 0) rows.push([])
      rows[rows.length - 1].push({ value, label: String(value) })
      seen.add(value)
    }
  }
  return rows
})
const summary = computed(() => {
  const labels = selectedValues.value.map(value =>
    isCustomMode.value && value === customEntry.value
      ? 'Andere'
      : normalizedOptions.value.find(option => option.value === value)?.label ?? String(value))
  if (isCustomMode.value && (customEntry.value === undefined || !selectedValues.value.includes(customEntry.value))) {
    labels.push('Andere')
  }
  return labels.length > 0 ? labels.join(', ') : props.emptyLabel
})

const resolvedLabelColor = computed(() => {
  const color = props.labelColor?.trim()
  if (!color) return undefined
  return /^(#|rgb|hsl|var\()/.test(color) ? color : `var(--ion-color-${color})`
})

const isDialogOpen = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const customInput = ref<InstanceType<typeof DodoInputText> | null>(null)
const isCustomMode = ref(false)
const customText = ref('')
// Track ownership separately from the draft: typing an already selected value
// must not let subsequent edits remove a legacy mixed selection.
const customEntry = ref<SelectValue>()
let pendingModel: SelectValue[] | undefined
let focusCustomAfterDismiss = false

const sameValues = (left: readonly SelectValue[], right: readonly SelectValue[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

const updateModel = (values: SelectValue[]) => {
  const next = [...new Set(values.filter(value => value !== ''))]
  if (sameValues(next, props.modelValue)) return
  pendingModel = next
  emit('update:modelValue', next)
}

watch([() => props.modelValue.slice(), normalizedOptions, () => props.allowCustom],
  ([values, options, allowCustom], previous) => {
    // Inline option arrays are recreated on parent renders. Equivalent options
    // must not reset the custom draft when the parent accepts our model update.
    const previousOptions = previous?.[1]
    const sameOptions = previousOptions && options.length === previousOptions.length
      && options.every((option, index) => option.value === previousOptions[index].value
        && option.label === previousOptions[index].label)
    const preserveDraft = sameOptions && allowCustom === previous?.[2]
      && ((pendingModel && sameValues(values, pendingModel)) || sameValues(values, previous[0] ?? []))
    pendingModel = undefined
    if (preserveDraft) return
    customEntry.value = allowCustom ? values.find(value => value !== '' && !isKnown(value)) : undefined
    isCustomMode.value = customEntry.value !== undefined
    customText.value = customEntry.value === undefined ? '' : String(customEntry.value)
  }, { immediate: true })

const openDialog = () => {
  isDialogOpen.value = true
}

const onDismiss = async () => {
  isDialogOpen.value = false
  await nextTick()
  if (focusCustomAfterDismiss) {
    focusCustomAfterDismiss = false
    customInput.value?.setFocus()
  } else {
    trigger.value?.focus()
  }
}

const resetCustom = () => {
  isCustomMode.value = false
  customText.value = ''
  customEntry.value = undefined
  focusCustomAfterDismiss = false
}

const toggleValue = (value: SelectValue) => {
  if (isCustomMode.value) {
    resetCustom()
    updateModel([value])
    return
  }
  const selected = selectedValues.value.includes(value)
  updateModel(selected ? selectedValues.value.filter(entry => entry !== value) : [...selectedValues.value, value])
}

const enterCustom = () => {
  resetCustom()
  isCustomMode.value = true
  updateModel([])
  focusCustomAfterDismiss = true
  isDialogOpen.value = false
}

const updateCustomText = (text: string) => {
  if (!isCustomMode.value) return
  const values = [...selectedValues.value]
  const index = customEntry.value === undefined ? -1 : values.indexOf(customEntry.value)
  if (index !== -1) values.splice(index, 1)
  customText.value = text
  customEntry.value = text !== '' && !values.includes(text) ? text : undefined
  if (customEntry.value !== undefined) values.splice(index === -1 ? values.length : index, 0, customEntry.value)
  updateModel(values)
}

const leaveEmpty = () => {
  if (customText.value.trim() !== '') return
  const values = selectedValues.value.filter(value => value !== customEntry.value)
  resetCustom()
  updateModel(values)
}
</script>

<style scoped>
.dd-input-select-chips {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  min-height: 3rem;
  padding: .5rem 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.dd-input-select-chips__label {
  flex: 1 1 40%;
  min-width: 0;
  overflow-wrap: anywhere;
}

.dd-input-select-chips__description {
  display: block;
  color: var(--ion-color-medium);
  font-size: .8em;
}

.dd-input-select-chips__summary {
  flex: 0 1 60%;
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: end;
}

.dd-input-select-chips > ion-icon {
  flex-shrink: 0;
  color: var(--ion-color-medium);
  font-size: 1rem;
  width: 0.8125rem;
}

.dd-input-select-chips-modal {
  --width: 22rem;
  --max-width: calc(100vw - 2rem);
  --height: auto;
  --max-height: calc(100dvh - 2rem);
  --border-radius: 14px;
  --backdrop-opacity: .4;
  --box-shadow: 0 12px 32px rgba(0, 0, 0, .2);
}

.dd-input-select-chips__dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 2rem);
}

.dd-input-select-chips__heading {
  flex-shrink: 0;
  padding: 1rem 1rem 0;
  overflow-wrap: anywhere;
}

.dd-input-select-chips__heading h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.dd-input-select-chips__heading p {
  margin: .5rem 0 0;
  color: var(--ion-color-medium);
  font-size: .875rem;
}

.dd-input-select-chips__cloud {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  padding: 1rem;
  min-height: 0;
  overflow-y: auto;
}

.dd-input-select-chips__row {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}

.dd-input-select-chips__chip {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  max-width: 100%;
  min-height: 2rem;
  padding: .4rem .75rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 1.5rem;
  background: transparent;
  color: var(--ion-text-color, #000);
  font: inherit;
  font-size: .875rem;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.dd-input-select-chips__actions {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  margin: 0;
  padding: .25rem .5rem;
  border-top: 1px solid var(--ion-background-color-step-150);
}

.dd-input-select-chips__chip[aria-pressed="true"] {
  background: var(--ion-text-color, #000);
  border-color: var(--ion-text-color, #000);
  color: var(--ion-background-color, #fff);
}

.dd-input-select-chips__chip ion-icon {
  flex-shrink: 0;
}

.dd-input-select-chips:focus-visible,
.dd-input-select-chips__chip:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: -2px;
}
</style>
