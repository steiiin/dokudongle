<template>
  <IonPage>
    <IonTabs :class="{ blurry: store.isDongleTransmitting }">
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
    <div class="transmission" v-show="store.isDongleTransmitting ">
      <div class="--abort">
        <h2>Übertragung läuft</h2>
        <IonProgressBar :value="store.transmissionProgress" color="medium" class="progress"></IonProgressBar>
        <br>
        <IonButton color="danger" @click="cancel">Abbrechen</IonButton>
      </div>
    </div>
  </IonPage>
</template>

<script setup lang="ts">
import { eye, flask, wifi } from 'ionicons/icons'
import { useDokuStore } from '@/store/doku'
import { IonProgressBar } from '@ionic/vue';
const store = useDokuStore()

const cancel = () => {
  store.cancelSend()
}

</script>
<style lang="scss" scoped>
.blurry {
  filter: blur(4px);
}
.transmission {

  height: 100%;
  width: 100%;
  position: absolute;
  background-color: #00000053;

  display: flex;
  justify-content: center;
  align-items: center;

  & .progress {
    margin-inline: -1rem;
    width: calc(100% + 2rem);
  }

}
</style>
