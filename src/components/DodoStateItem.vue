<template>

  <IonItem v-if="title || description" :lines="props.lines">
    <IonLabel>
      <h3>{{ title ?? description }}</h3>
      <p v-if="description">{{ description }}</p>
    </IonLabel>
  </IonItem>

</template>

<script setup lang="ts">

import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  lines?: 'full' | 'inset' | 'none'
}>(), {
  lines: 'none',
})

</script>
<style scoped>

h3 { margin: 0; padding: 0; }
p { margin: 0; padding: 0; }

</style>