<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="with-badge">
          <ion-title>Vorschau</ion-title>
          <connection-badge></connection-badge>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <textarea readonly>{{ store.generatedProtocol }}</textarea>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">

import { IonPage, IonHeader, IonToolbar, IonContent, IonTitle } from '@ionic/vue';

import ConnectionBadge from '@/components/ConnectionBadge.vue';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore();

</script>
<style scoped lang="scss">

textarea {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: var(--ion-background-color);
  border: none;
  resize: none;
  margin: 0;
  padding: 1rem;
}
</style>