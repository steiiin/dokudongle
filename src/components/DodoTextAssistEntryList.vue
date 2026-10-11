<template>
  <IonList class="text-assist-entry-list">
    <IonItem v-for="(entry,index) in entries" :key="entry.id" button detail :disabled="disabled" @click="emit('edit', entry.id)"
      :lines="(index+1)<entries.length ? 'full' : 'none'">
      <IonLabel class="ion-text-wrap">
        <h2>{{ entry.name }}</h2>
        <p v-if="entry.description">{{ entry.description }}</p>
      </IonLabel>
    </IonItem>
  </IonList>
</template>

<script setup lang="ts">
defineProps<{ entries: { id: string; name: string; description: string }[]; disabled: boolean }>()
const emit = defineEmits<{ (event: 'edit', id: string): void }>()
</script>

<style scoped>
p { text-transform: uppercase;}
</style>