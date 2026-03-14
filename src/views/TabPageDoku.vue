<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="with-badge">
          <ion-title>Eingabe</ion-title>
          <connection-badge></connection-badge>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">

      <div id="container">

        <DetailLevelCard />

        <!-- SETTING -->
        <SettingCard></SettingCard>

      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';

import ConnectionBadge from '@/components/ConnectionBadge.vue';

import DetailLevelCard from './dokuCards/DetailLevelCard.vue';
import SettingCard from './dokuCards/SettingCard.vue';

</script>
<style lang="scss" scoped>

#container {
  position: relative;
}

</style>