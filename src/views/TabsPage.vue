<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet></IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="connect" href="/tabs/connect">
          <IonIcon aria-hidden="true" :icon="wifi" />
          <IonLabel>Dongle</IonLabel>
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
  </IonPage>
</template>

<script setup lang="ts">
import { eye, flask, wifi } from 'ionicons/icons';
</script>
