<template>
  <IonModal :is-open="true||!!firmware.pendingUpdate || firmware.status.phase !== 'idle' || !!firmware.nativeError" :can-dismiss="!firmware.active && !firmware.nativeError"
    :backdrop-dismiss="false" aria-label="Dongle-Aktualisierung" @did-dismiss="firmware.dismiss()">
    <IonHeader>
      <IonToolbar>
        <IonButtons v-if="confirming" slot="start">
          <IonButton @click="firmware.cancelUpdate()">Abbrechen</IonButton>
        </IonButtons>
        <IonTitle :class="{ 'confirmation-title': confirming }">Dongle-Aktualisierung</IonTitle>
        <IonButtons v-if="confirming" slot="end">
          <IonButton :disabled="!firmware.canConfirmUpdate" color="success" @click="firmware.confirmUpdate()">Fortfahren</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">

      <div v-if="confirming" class="update-content">
        <h3>Jetzt starten?</h3>
        <DodoHint variant="none">
          Die Aktualisierung des Dongles dauert <b>1-3min</b>.<br>
          Die App ist während dieser Zeit nicht nutzbar.<br><br>
          Lass den Dongle angesteckt und dein Telefon in der Nähe und eingeschaltet, damit die Aktualisierung abgeschlossen werden kann.
        </DodoHint>
      </div>
      <div v-else class="update-content" role="status" aria-live="polite">

        <h3>{{ title }}<span v-if="firmware.status.phase === 'transferring'">&nbsp;• {{ firmware.status.progress ?? 0 }}%</span></h3>

        <IonProgressBar v-if="firmware.active" :type="firmware.status.phase === 'transferring' ? 'determinate' : 'indeterminate'"
          :value="(firmware.status.progress ?? 0) / 100" aria-label="Update-Fortschritt" />

        <DodoHint variant="none" v-if="firmware.active">
          Dongle angeschlossen lassen. Smartphone und Bildschirm eingeschaltet, diese App geöffnet und das Smartphone in der Nähe behalten.
        </DodoHint>

        <template v-if="firmware.status.phase === 'searching'">

          <DodoHint variant="none" v-if="firmware.manualRecovery">
            Den zuvor aus- und wieder eingesteckten Dongle auswählen. <br>
            Die Auswahl startet das Update.
          </DodoHint>

          <IonButton v-for="device in firmware.recoveryDevices" :key="device.deviceId"
            @click="firmware.selectRecoveryDevice(device.deviceId)">{{ device.name }} · {{ device.deviceId }}</IonButton>

          <br>
          <IonButton @click="firmware.cancelDiscovery()">Suche abbrechen</IonButton>

        </template>

        <DodoHint v-if="firmware.status.phase === 'done'" variant="success">
          Dongle-Version <b>v{{ firmware.status.version }}</b> wurde erfolgreich installiert.
        </DodoHint>

        <DodoHint v-if="firmware.status.error" variant="error">{{ firmware.status.error }}</DodoHint>
        <DodoHint v-if="firmware.nativeError" variant="error">{{ firmware.nativeError }}</DodoHint>
        <IonButton v-if="firmware.nativeError" @click="firmware.restore()" color="danger">Update-Status erneut laden</IonButton>

        <div v-else-if="!firmware.active" style="margin-top: .5rem">
          <IonButton v-if="firmware.status.phase === 'error'"
            :disabled="!firmware.canRecover"
            @click="firmware.requestUpdate('retry')">
            Update erneut versuchen
          </IonButton>
          <IonButton @click="firmware.dismiss()" :color="firmware.status.phase === 'done' ? 'success' : ''">
            Schließen
          </IonButton>
        </div>

      </div>
    </IonContent>
  </IonModal>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonProgressBar, IonTitle, IonToolbar } from '@ionic/vue'
import { useFirmwareStore } from '@/store/firmware'
import DodoHint from '@/components/DodoHint.vue'
const firmware = useFirmwareStore()
const confirming = computed(() => !!firmware.pendingUpdate && !firmware.active && !firmware.nativeError)
const title = computed(() => ({ idle: 'Update-Status', searching: 'Dongle suchen', preparing: 'Vorbereiten', transferring: 'Übertragen',
  restarting: 'Neustarten', transferred: 'Neustarten', verifying: 'Version prüfen', done: 'Fertig', error: 'Aktualisierung fehlgeschlagen',
})[firmware.status.phase])
onMounted(() => { void firmware.initialize() })
onUnmounted(() => { void firmware.dispose() })
</script>
<style lang="scss" scoped>

ion-modal { --width: 100%; --height: 100%; --border-radius: 0; }

.update-content
{
  max-width: 36rem;
  margin: 15vh auto 0;
  text-align: center;

  & h3 {
    text-transform: uppercase;
    font-size: 1rem; letter-spacing: 1px;
    font-weight: bold;
  }

  & .dd-hint {
    margin: 0 auto .25rem auto;
    max-width: 400px;
  }

}

@media (max-width: 540px) {
  .confirmation-title { display: none; }
}

</style>
