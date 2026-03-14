<template>
  <div class="dd-toggle-group">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue';

const props = defineProps<{ modelValue: string|number }>();
const emit  = defineEmits<{
  (e: 'update:modelValue', v: string|number): void
}>();

const toggleValue = ref<string|number>(props.modelValue);

watch(() => props.modelValue, v => {
  toggleValue.value = v;
});

watch(toggleValue, v => {
  emit('update:modelValue', v);
});

provide('toggleValue', toggleValue);
provide('setToggleValue', (v: string|number) => {
  toggleValue.value = v;
});
</script>

<style scoped>
.dd-toggle-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
