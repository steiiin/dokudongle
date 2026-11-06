<template>
  <div class="dd-hint" :class="`dd-hint--${variant}`" :role="variant === 'error' ? 'alert' : undefined">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'info' | 'warning' | 'error' | 'success' | 'none' }>(), {
  variant: 'info',
})
</script>

<style scoped>
.dd-hint {
  font-size: 0.9em;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border-left: 2px solid var(--ion-color-light-contrast);
  background-color: rgba(var(--ion-color-light-contrast-rgb),.05);
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.dd-hint--warning {
  border-left-color: var(--ion-color-warning);
  background-color: rgba(var(--ion-color-warning-rgb),.2);
}

.dd-hint--error {
  border-left-color: var(--ion-color-danger);
  background-color: rgba(var(--ion-color-danger-rgb),.2);
}

.dd-hint--success {
  border-left-color: var(--ion-color-success);
  background-color: rgba(var(--ion-color-success-rgb),.2);
}

.dd-hint--none {
  border-left-color: transparent;
  background-color: transparent;
}
</style>
