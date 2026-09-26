<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Einstellungen</IonTitle>
        </div>
        <DodoSendAction />
      </IonToolbar>
    </IonHeader>
    <IonContent
      :fullscreen="true"
      :class="{ 'dongle-connecting': store.isDongleConnecting }"
    >
      <DongleSettingsCard />
      <DongleFirmwareCard />
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import DongleFirmwareCard from '@/views/settingsCards/DongleFirmwareCard.vue'
import DongleSettingsCard from '@/views/settingsCards/DongleSettingsCard.vue'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
</script>

<style scoped>
.with-badge ion-title {
  flex: 0 1 auto;
  min-width: 0;
}

.with-badge :deep(.badge) {
  flex-shrink: 0;
}

@media (max-width: 360px) {
  .with-badge ion-title {
    font-size: 1rem;
    padding-inline-start: 12px;
  }
}

.dongle-connecting {
  filter: blur(4px);
}
</style>
