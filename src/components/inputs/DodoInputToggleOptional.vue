<template>
  <DodoExaminationItem ref="examination" :id="id" :label="label"
    :assessed="modelValue" :removable="false" :show-line="lines === 'none' ? false : lines"
    @update:assessed="onChange">
    <DodoInputToggle :model-value="modelValue" lines="none" @update:model-value="onChange">
      {{ label }}
    </DodoInputToggle>
  </DodoExaminationItem>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import DodoExaminationItem from '../examination/DodoExaminationItem.vue'
import DodoInputToggle from './DodoInputToggle.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  id: string
  label: string
  lines?: 'full' | 'inset' | 'none'
}>(), { lines: 'none' })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
const examination = ref<InstanceType<typeof DodoExaminationItem> | null>(null)

async function onChange(value: boolean) {
  emit('update:modelValue', value)
  if (!value) {
    await nextTick()
    if (!props.modelValue) examination.value?.focusActivation()
  }
}
</script>
