<template>
  <IonModal :is-open="firmware.status.phase !== 'idle' || !!firmware.nativeError" :can-dismiss="!firmware.active && !firmware.nativeError"
    :backdrop-dismiss="false" aria-label="Dongle-Aktualisierung" @did-dismiss="firmware.dismiss()">
    <IonHeader><IonToolbar><IonTitle>Dongle-Aktualisierung</IonTitle></IonToolbar></IonHeader>
    <IonContent class="ion-padding">
      <div class="update-content" role="status" aria-live="polite">
        <h2>{{ title }}</h2>
        <p v-if="firmware.active">Dongle angeschlossen lassen und das Smartphone in der Nähe behalten.</p>
        <IonProgressBar v-if="firmware.active" :type="firmware.status.phase === 'transferring' ? 'determinate' : 'indeterminate'"
          :value="(firmware.status.progress ?? 0) / 100" aria-label="Update-Fortschritt" />
        <p v-if="firmware.status.phase === 'transferring'">{{ firmware.status.progress ?? 0 }} %</p>
        <p v-if="firmware.status.phase === 'done'">Dongle-Version {{ firmware.status.version }} wurde installiert und bestätigt.</p>
        <p v-if="firmware.status.error" role="alert">{{ firmware.status.error }}</p>
        <p v-if="firmware.nativeError" role="alert">{{ firmware.nativeError }}</p>
        <IonButton v-if="firmware.nativeError" @click="firmware.restore()">Update-Status erneut laden</IonButton>
        <template v-else-if="!firmware.active">
          <IonButton v-if="firmware.status.phase === 'error'" @click="firmware.retry()">Erneut verbinden</IonButton>
          <IonButton @click="firmware.dismiss()">Schließen</IonButton>
        </template>
      </div>
    </IonContent>
  </IonModal>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { IonButton, IonContent, IonHeader, IonModal, IonProgressBar, IonTitle, IonToolbar } from '@ionic/vue'
import { useFirmwareStore } from '@/store/firmware'
const firmware = useFirmwareStore()
const title = computed(() => ({ idle: 'Update-Status', preparing: 'Vorbereiten', transferring: 'Übertragen',
  restarting: 'Neustarten', transferred: 'Neustarten', verifying: 'Version prüfen', done: 'Fertig', error: 'Aktualisierung fehlgeschlagen',
})[firmware.status.phase])
onMounted(() => { void firmware.initialize() })
onUnmounted(() => { void firmware.dispose() })
</script>
<style scoped>
ion-modal { --width: 100%; --height: 100%; --border-radius: 0; }
.update-content { max-width: 36rem; margin: 15vh auto 0; text-align: center; }
ion-progress-bar { margin-block: 2rem; }
</style>
