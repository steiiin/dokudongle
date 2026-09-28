<template>
  <IonCard data-testid="spellchecker-settings">
    <IonCardHeader><IonCardTitle>Rechtschreibprüfung</IonCardTitle></IonCardHeader>
    <IonCardContent class="with-list">
      <IonList>
        <IonItem button detail @click="openDictionary">
          <IonIcon slot="start" :icon="bookOutline" /><IonLabel>Eigenes Wörterbuch</IonLabel>
        </IonItem>
        <IonItem button detail @click="activeModal = 'shortcuts'">
          <IonIcon slot="start" :icon="swapHorizontalOutline" /><IonLabel>Shortcut-Ersetzungen</IonLabel>
        </IonItem>
        <IonItem button detail @click="activeModal = 'locations'">
          <IonIcon slot="start" :icon="locationOutline" /><IonLabel>Orts-Snippets</IonLabel>
        </IonItem>
      </IonList>
    </IonCardContent>
  </IonCard>
  <DodoUserDictionaryModal :is-open="activeModal === 'dictionary'" :entries="entries" :busy="busy" :error="error"
    @close="activeModal = null" @add="addWord" @remove="removeWord" />
  <DodoTextAssistEntriesModal kind="shortcuts" :is-open="activeModal === 'shortcuts'" @close="activeModal = null" />
  <DodoTextAssistEntriesModal kind="locations" :is-open="activeModal === 'locations'" @close="activeModal = null" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { bookOutline, locationOutline, swapHorizontalOutline } from 'ionicons/icons'
import DodoUserDictionaryModal from '@/components/DodoUserDictionaryModal.vue'
import DodoTextAssistEntriesModal from '@/components/DodoTextAssistEntriesModal.vue'
import { textAssistService, type UserDictionaryEntry } from '@/services/text-assist'

const activeModal = ref<'dictionary' | 'shortcuts' | 'locations' | null>(null)
const entries = ref<UserDictionaryEntry[]>([])
const busy = ref(false)
const error = ref('')
const run = async (action: () => Promise<unknown>) => {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await action()
    entries.value = await textAssistService.getUserDictionaryEntries()
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Das Wörterbuch konnte nicht gespeichert oder geladen werden.' }
  finally { busy.value = false }
}
const openDictionary = () => {
  activeModal.value = 'dictionary'
  void run(async () => undefined)
}
const addWord = (word: string) => run(() => textAssistService.addUserWord(word))
const removeWord = (word: string) => run(() => textAssistService.removeUserWord(word))
</script>
