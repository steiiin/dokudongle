<template>
  <div v-if="assessed && available" ref="row" tabindex="-1" class="examination-item" :data-examination="id">
    <div class="examination-control"><slot /></div>
    <IonButton fill="clear" color="medium" class="remove-examination"
      :aria-label="`${label || id}: Untersuchung entfernen`" @click="remove">
      <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
    </IonButton>
    <IonItem v-if="showLine" class="examination-separator"
      :lines="showLine === true ? 'full' : showLine" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { h, inject, onBeforeUnmount, ref, useSlots } from 'vue'
import { IonLabel } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { examinationCardKey, type ExaminationPreset } from './examination'

const props = withDefaults(defineProps<{
  id: string
  assessed: boolean
  available?: boolean
  label?: string
  showLine?: boolean | 'full' | 'inset'
  pickerSeparatorAfter?: boolean
  assessedPresets?: boolean
}>(), { available: true, label: '', showLine: false, pickerSeparatorAfter: false, assessedPresets: false })
const emit = defineEmits<{
  'update:assessed': [value: boolean]
  select: [preset?: ExaminationPreset]
  activate: []
  remove: []
}>()
const slots = useSlots()
const row = ref<HTMLElement | null>(null)
const card = inject(examinationCardKey)
if (!card) throw new Error('DodoExaminationItem requires DodoExaminationCard')

const unregister = card.register({
  id: props.id,
  get label() { return props.label || props.id },
  get assessed() { return props.assessed },
  get available() { return props.available },
  get assessedPresets() { return props.assessedPresets },
  get pickerSeparatorAfter() { return props.pickerSeparatorAfter },
  picker: () => slots.picker?.() ?? h(IonLabel, {}, () => props.label),
  select(preset) {
    emit('update:assessed', true)
    if (preset === undefined) emit('select')
    else emit('select', preset)
  },
  focus() {
    row.value?.focus()
  },
  activate() {
    emit('activate')
  },
})
onBeforeUnmount(unregister)

function remove() {
  emit('update:assessed', false)
  emit('remove')
  void card?.focusAddButton()
}
</script>

<style scoped>
.examination-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.examination-separator {
  flex: 0 0 100%;
  --min-height: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  --background: transparent;
  pointer-events: none;
}
.examination-item:last-child > .examination-separator {
  display: none;
}
.examination-control {
  flex: 1;
  min-width: 0;
}
.remove-examination {
  flex: 0 0 auto;
  min-width: 44px;
  margin: 0;
}
</style>
