<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="connect" href="/tabs/connect">
          <ion-icon aria-hidden="true" :icon="wifi" />
          <ion-label>Dongle</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="doku" href="/tabs/doku">
          <ion-icon aria-hidden="true" :icon="flask" />
          <ion-label>Eingabe</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="preview" href="/tabs/preview">
          <ion-icon aria-hidden="true" :icon="eye" />
          <ion-label>Vorschau</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { eye, flask, wifi } from 'ionicons/icons';
</script>
