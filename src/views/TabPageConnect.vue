<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Verbindung</IonTitle>
        <IonProgressBar v-if="store.isDongleTransmitting" type="indeterminate"></IonProgressBar>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">

      <div id="container">

        <DodoConnectionBadge class="symbol"></DodoConnectionBadge>

        <h1>{{ stateText.title }}</h1>
        <p>{{ stateText.description }}</p>

        <IonButton v-if="!store.isDongleConnected"
          :disabled="store.isDongleConnecting"
          @click="connect"
          >Dongle suchen
        </IonButton>

      </div>

    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">

import { ellipsisHorizontalCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { computed, nextTick } from 'vue';

import { useDokuStore } from '@/store/doku';
import router from '@/router';
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

const connect = async () => {
  await store.connectDongle
  if (store.isDongleConnected) {
    setTimeout(() => router.push('/tabs/doku'), 1000)
  }
}

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