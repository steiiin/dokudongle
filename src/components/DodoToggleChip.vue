<template>
  <IonChip
    :color="color"
    :outline="!modelValue"
    :disabled="disabled"
    :class="[
      { 'DdToggleChip--inactive': !modelValue, 'DdToggleChip--bold': modelValue },
    ]"
    @click="toggle"
  >
    <slot />
  </IonChip>
</template>

<script setup lang="ts">

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    color?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// ############################################################################

const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}

</script>

<style scoped>

  ion-chip {
    margin-left: 0;
  }
  .DdToggleChip--inactive {
    outline: 1px solid transparent;
  }
  .DdToggleChip--bold {
    border: 1px solid var(--ion-color-base, transparent);
    background-color: var(--ion-color-base);
    color: var(--ion-color-contrast);
  }


</style>
