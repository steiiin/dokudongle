<template>
  <IonCard data-testid="protocol-history-settings">
    <IonCardHeader><IonCardTitle>Protokolle wiederherstellen</IonCardTitle></IonCardHeader>
    <IonCardContent class="with-list">
      <IonList v-if="store.protocolHistory.length">
        <IonItem v-for="entry in store.protocolHistory" :key="entry.id" button detail
          :disabled="busy || store.isProtocolChanging" @click="restore(entry.id)">
          <IonLabel>
            <h2>{{ formatDate(entry.archivedAt) }}</h2>
            <p class="situation-preview">{{ entry.doku.situation._text.trim() || 'Ohne Situationsbeschreibung' }}</p>
          </IonLabel>
        </IonItem>
      </IonList>
      <p v-else>Keine Protokolle zum Wiederherstellen vorhanden.</p>
      <IonText v-if="error" color="danger"><p role="alert">{{ error }}</p></IonText>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
const router = useRouter()
const busy = ref(false)
const error = ref('')
const formatDate = (value: string) => new Date(value).toLocaleString('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

async function restore(id: string) {
  if (busy.value || store.isProtocolChanging) return
  busy.value = true
  error.value = ''
  try {
    if (!await store.restoreProtocolFromHistory(id)) throw new Error('Protocol unavailable')
    await router.push('/tabs/doku')
  } catch {
    error.value = 'Das Protokoll konnte nicht wiederhergestellt werden. Bitte versuche es erneut.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.situation-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
