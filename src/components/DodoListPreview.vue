<template>
  <div v-if="text" class="dd-quickie-preview">
    {{ text }}
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  text: string
}>()

</script>

<style lang="scss" scoped>

  .dd-quickie-preview {
    white-space: pre-wrap;
    padding: 0.75rem;
    border: 1px solid var(--ion-color-medium-tint);
    border-radius: 8px;
    margin-bottom: 1rem;
    background: var(--ion-color-light);
  }

</style>
