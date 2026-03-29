<template>
  <IonButtons slot="primary">
    <IonButton fill="solid" color="primary" @click="reset">
      Neu
    </IonButton>
    <IonButton fill="solid" :color="isAvailable ? 'success' : 'medium'" :disabled="!isAvailable" @click="send">
      Senden
      <IonIcon :src="paperPlaneSharp" slot="end"></IonIcon>
    </IonButton>
  </IonButtons>
</template>

<script setup lang="ts">

import { paperPlaneSharp, powerSharp } from 'ionicons/icons'

import { computed, nextTick } from 'vue'

import { useDokuStore } from '@/store/doku'
import { alertController } from '@ionic/core'
const store = useDokuStore()

const isAvailable = computed(() => store.connection.isConnected)

const reset = async () => {

  const alert = await alertController.create({
    header: 'Neues Protokoll',
    message: 'Du verlierst alle Eingaben, die du bisher getätigt hast. \nBist du sicher?',
    buttons: [
      {
        text: 'Abbrechen',
        role: 'cancel'
      },
      {
        text: 'Ja',
        handler: async () => {
          store.newProtocol()
          await nextTick()
          setTimeout(tryScrollingToTop, 200)
        }
      }
    ]
  });
  await alert.present();

}
const send = async () => {

  if (store.generatedProtocol.includes('[')) {

    const alert = await alertController.create({
      header: 'Fehlende Eingaben',
      message: 'Du hast noch fehlende Infos im Protokoll.\nDiese werden in [Klammern] gekennzeichnet.\n\nWillst du trotzdem senden?',
      buttons: [
        {
          text: 'Zurück',
          role: 'cancel'
        },
        {
          text: 'Ja',
          handler: () => {
            store.sendProtocol()
          }
        }
      ]
    });
    await alert.present()

  }
  else
  {
    store.sendProtocol()
  }

  setTimeout(tryScrollingToTop, 200)

}

const tryScrollingToTop = () => {
  const ionContents = document.getElementsByTagName('ion-content')
  if (ionContents.length>0) {
    ionContents[0].scrollToTop?.(200)
  }
}

</script>