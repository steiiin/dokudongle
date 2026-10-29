<template>
  <IonPage>
    <DodoFirmwareUpdate />
    <IonTabs :class="{ blurry: store.isDongleTransmitting }" :inert="store.isDongleTransmitting">
      <IonRouterOutlet></IonRouterOutlet>
      <IonTabBar id="main-tab-bar" slot="bottom">
        <IonTabButton tab="settings" href="/tabs/settings">
          <IonIcon aria-hidden="true" :icon="cog" />
          <IonLabel>Einstellungen</IonLabel>
        </IonTabButton>

        <IonTabButton tab="doku" href="/tabs/doku">
          <IonIcon aria-hidden="true" :icon="flask" />
          <IonLabel>Eingabe</IonLabel>
        </IonTabButton>

        <IonTabButton tab="preview" href="/tabs/preview">
          <IonIcon aria-hidden="true" :icon="eye" />
          <IonLabel>Vorschau</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
    <DodoTransmission />
  </IonPage>
</template>

<script setup lang="ts">

import DodoFirmwareUpdate from '@/views/settingsCards/DodoFirmwareUpdate.vue'
import DodoTransmission from '@/components/DodoTransmission.vue'
import { cog, eye, flask } from 'ionicons/icons'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
<style lang="scss" scoped>

  .blurry {
    filter: blur(4px);
  }
</style>
