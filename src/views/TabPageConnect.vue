<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Verbindung</ion-title>
        <ion-progress-bar v-if="store.isDongleTransmitting" type="indeterminate"></ion-progress-bar>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">

      <div id="container">

        <connection-badge class="symbol"></connection-badge>

        <h1>{{ stateText.title }}</h1>
        <p>{{ stateText.description }}</p>

        <ion-button v-if="!store.isDongleConnected"
          :disabled="store.isDongleConnecting"
          @click="store.connectDongle"
          >Dongle suchen
        </ion-button>

      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonProgressBar } from '@ionic/vue';
import { ellipsisHorizontalCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import ConnectionBadge from '@/components/ConnectionBadge.vue';

import { computed } from 'vue';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore();

interface StateText {
  title: string;
  description: string;
}
const stateText = computed(() => {

  if (store.isDongleConnecting)
  {
    return {
      title: "Suche ...",
      description: "Es wird nach einem Dongle gesucht bzw. versucht das letzte zu verbinden.",
    } as StateText
  }
  else if (store.isDongleConnected)
  {
    return {
      title: "Dongle verbunden",
      description: `${store.connectedDongleName}`,
    } as StateText
  }
  else
  {
    return {
      title: "Keine Verbindung",
      description: "Es ist kein DokuDongle mit diesem Telefon verbunden.",
    } as StateText
  }

})

</script>
<style lang="scss" scoped>

#container
{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;

  & .symbol {
    font-size: 5em;
  }

  & h1 {
    font-size: 1.25em;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: center;
    margin: .5rem 0 0 0;
    padding: 0;
  }

  & p {
    max-width: 60%; text-align: center;
    margin: 0 0 .5rem 0; padding: 0;
  }

  & ion-button {
    flex: unset;
  }

}



</style>