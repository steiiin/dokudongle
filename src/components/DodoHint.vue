<template>
  <div class="dd-hint" :class="`dd-hint--${variant}`" :role="variant === 'error' ? 'alert' : undefined">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'info' | 'warning' | 'error' | 'none' }>(), {
  variant: 'info',
})
</script>

<style scoped>
.dd-hint {
  font-size: 0.9em;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border-left: 2px solid white;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.dd-hint--warning {
  border-left-color: var(--ion-color-warning);
}

.dd-hint--error {
  border-left-color: var(--ion-color-danger);
}

.dd-hint--none {
  border-left-color: transparent;
}
</style>
