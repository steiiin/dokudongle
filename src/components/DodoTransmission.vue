<template>
  <div v-if="store.isDongleTransmitting" class="transmission" role="dialog" aria-modal="true" aria-labelledby="transmission-title">
    <div class="transmission-content">
      <h2 id="transmission-title" aria-live="polite">{{ title }}</h2>
      <p v-if="store.connection.transmissionWaitingForDongle" role="status">
        Dongle nicht gefunden. Übertragung pausiert. Die Verbindung wird automatisch wiederhergestellt.
      </p>
      <IonProgressBar :value="store.transmissionProgress" color="medium" aria-label="Sendefortschritt" />
      <div class="transmission-actions">
        <IonButton v-if="store.connection.transmissionPaused" :disabled="!canResume" @click="store.resumeSend()">Fortsetzen</IonButton>
        <IonButton v-else @click="store.pauseSend()">Pause</IonButton>
        <IonButton color="danger" @click="store.cancelSend()">Abbrechen</IonButton>
      </div>
    </div>
  </div>
  <IonToast :key="noticeId" :is-open="noticeOpen" :message="notice" :duration="4000" position="top" @didDismiss="noticeOpen = false" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonButton, IonProgressBar, IonToast } from '@ionic/vue'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
const canResume = computed(() => store.isDongleConnected && !store.connection.transmissionWaitingForDongle)
const title = computed(() => {
  if (store.connection.transmissionWaitingForDongle) return 'Verbindung unterbrochen'
  if (store.connection.transmissionPaused) {
    return store.connection.transmissionBlockPending ? 'Wird pausiert …' : 'Übertragung pausiert'
  }
  return 'Übertragung läuft'
})
const notice = ref('')
const noticeOpen = ref(false)
const noticeId = ref(0)
watch(() => store.connection.transmissionReconnectCount, () => {
  notice.value = store.connection.transmissionPaused
    ? 'Dongle wieder gefunden. Übertragung bleibt pausiert.'
    : 'Dongle wieder gefunden. Übertragung wird fortgesetzt.'
  ++noticeId.value
  noticeOpen.value = true
}, { flush: 'sync' })
</script>

<style scoped lang="scss">
.transmission {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #00000053;
  padding: 1rem;
}
.transmission-content {
  width: min(100%, 30rem);
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--ion-background-color, #fff);
  text-align: center;
}
.transmission-actions {
  margin-top: 1rem;
}
</style>
