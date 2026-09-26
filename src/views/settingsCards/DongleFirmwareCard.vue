<template>
  <IonCard v-if="store.isDongleConnected" data-testid="dongle-firmware">
    <IonCardHeader><IonCardTitle>Dongle-Firmware</IonCardTitle></IonCardHeader>
    <IonCardContent>
      <p v-if="store.connection.firmware">Installierte Version: {{ store.connection.firmware.version }}</p>
      <p v-if="store.connection.firmwareStatus === 'loading'">Version wird gelesen …</p>
      <template v-else-if="store.connection.firmwareStatus === 'error'">
        <p>Die Dongle-Version konnte nicht gelesen werden.</p>
        <IonButton :disabled="store.connection.isUpdatingFirmware" @click="store.refreshDongleFirmware()">Erneut laden</IonButton>
      </template>
      <p v-else-if="store.connection.firmwareStatus === 'unsupported' || (store.connection.firmwareStatus === 'ready' && !store.connection.hasDfu)">
        Dieser Dongle benötigt eine einmalige Einrichtung über USB, bevor Bluetooth-Updates möglich sind.
      </p>
      <template v-else-if="firmware.available">
        <p>Neue Dongle-Version verfügbar.</p>
        <p>Verfügbare Version: {{ firmware.manifest?.version }}</p>
        <IonButton v-if="firmware.android" :disabled="!firmware.canInstall" @click="firmware.install()">Installieren</IonButton>
        <p v-else>Zum Installieren bitte die Android-App verwenden.</p>
      </template>
      <p v-else-if="store.connection.firmwareStatus === 'ready' && firmware.manifest">Die Dongle-Firmware ist aktuell.</p>
      <template v-if="firmware.manifestError">
        <p role="alert">{{ firmware.manifestError }}</p>
        <IonButton @click="firmware.loadManifest()">Firmware erneut laden</IonButton>
      </template>
      <template v-if="firmware.nativeError">
        <p role="alert">{{ firmware.nativeError }}</p>
        <IonButton @click="firmware.restore()">Update-Status erneut laden</IonButton>
      </template>
    </IonCardContent>
  </IonCard>
</template>
<script setup lang="ts">
import { IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/vue'
import { useDokuStore } from '@/store/doku'
import { useFirmwareStore } from '@/store/firmware'
const store = useDokuStore()
const firmware = useFirmwareStore()
</script>
