<template>
  <IonModal :is-open="isOpen" class="dd-dictionary-modal" @did-dismiss="emit('close')">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Eigenes Wörterbuch</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="emit('close')">Fertig</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <form class="dd-dictionary-form" @submit.prevent="addWord">
        <IonInput
          v-model="newWord"
          placeholder="Wort hinzufügen"
          autocomplete="off"
          autocapitalize="sentences"
          :disabled="busy"
          fill="solid"
        />
        <IonButton type="submit" :disabled="busy || !newWord.trim()">Hinzufügen</IonButton>
      </form>
      <p v-if="error" class="dd-dictionary-error" role="alert">{{ error }}</p>
      <IonList v-if="entries.length">
        <IonItem v-for="entry in entries" :key="entry.normalized">
          <IonLabel>
            {{ entry.word }}
            <small v-if="entry.source === 'learned'">gelernt</small>
          </IonLabel>
          <IonButton
            slot="end"
            fill="clear"
            color="danger"
            :disabled="busy"
            :aria-label="`${entry.word} entfernen`"
            @click="emit('remove', entry.word)"
          >
            Entfernen
          </IonButton>
        </IonItem>
      </IonList>
      <p v-else class="dd-dictionary-empty">Noch keine eigenen Wörter.</p>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserDictionaryEntry } from '@/services/text-assist'

const props = defineProps<{
  isOpen: boolean
  entries: UserDictionaryEntry[]
  busy?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'add', word: string): void
  (event: 'remove', word: string): void
}>()

const newWord = ref('')

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) newWord.value = ''
})

watch(() => props.entries.length, () => {
  newWord.value = ''
})

const addWord = () => {
  const word = newWord.value.trim()
  if (!word) return
  emit('add', word)
}
</script>

<style scoped>
.dd-dictionary-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dd-dictionary-error {
  color: var(--ion-color-danger);
}

.dd-dictionary-empty,
small {
  color: var(--ion-color-medium);
}

small {
  margin-left: 0.35rem;
}
</style>
