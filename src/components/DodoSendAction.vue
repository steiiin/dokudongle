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

import { computed, watch } from 'vue'
import { paperPlaneSharp } from 'ionicons/icons'
import { alertController } from '@ionic/core'

import { tryScrollingToTop } from '@/utils/input'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

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
          await tryScrollingToTop()
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

  await tryScrollingToTop()

}

</script>
