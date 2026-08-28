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

  <DodoProtocolCheckModal
    :is-open="isCheckModalOpen"
    :is-checking="isChecking"
    :result="checkResult"
    :check-error="checkError"
    :error-message="checkErrorMessage"
    allow-send-anyway
    @close="closeCheckModal"
    @retry="retryCheck"
    @send-anyway="sendAnyway"
  />
</template>

<script setup lang="ts">

import { computed, ref } from 'vue'
import { paperPlaneSharp } from 'ionicons/icons'
import { alertController } from '@ionic/core'
import { Network } from '@capacitor/network'

import { tryScrollingToTop } from '@/utils/input'
import protocolCheckService, { type ProtocolCheckResult } from '@/services/protocol-check'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

const isProcessing = ref(false)
const isSending = ref(false)
const isCheckModalOpen = ref(false)
const isChecking = ref(false)
const checkResult = ref<ProtocolCheckResult | null>(null)
const checkError = ref(false)
const checkErrorMessage = ref('')
const pendingProtocolText = ref<string | null>(null)

const isAvailable = computed(() =>
  store.connection.isConnected
  && !store.connection.isTransmitting
  && !isProcessing.value,
)

const OFFLINE_MESSAGE = 'Es besteht keine Internetverbindung. Das Protokoll konnte nicht geprüft werden.'
const CHECK_FAILED_MESSAGE = 'Das Protokoll konnte nicht geprüft werden. Prüfe die Internetverbindung oder versuche es erneut.'

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
          await store.newProtocol()
        }
      }
    ]
  });
  await alert.present();

}

const confirmMissingInputs = async (): Promise<boolean> => {
  const alert = await alertController.create({
    header: 'Fehlende Eingaben',
    message: 'Du hast noch fehlende Infos im Protokoll.\nDiese werden in [Klammern] gekennzeichnet.\n\nWillst du trotzdem senden?',
    buttons: [
      {
        text: 'Zurück',
        role: 'cancel',
      },
      {
        text: 'Ja',
        role: 'confirm',
      },
    ],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  return result.role === 'confirm'
}

const resetCheckState = () => {
  isCheckModalOpen.value = false
  isChecking.value = false
  checkResult.value = null
  checkError.value = false
  checkErrorMessage.value = ''
  pendingProtocolText.value = null
  isSending.value = false
  isProcessing.value = false
}

const transmitProtocol = async () => {
  if (isSending.value) return

  isSending.value = true
  isCheckModalOpen.value = false

  try {
    await tryScrollingToTop()
    const sent = await store.sendProtocol()
    if (sent) {
      await store.markProtocolSent()
    }
  }
  finally {
    resetCheckState()
  }
}

const checkBeforeSend = async () => {
  if (isChecking.value || pendingProtocolText.value === null) return

  isCheckModalOpen.value = true
  isChecking.value = true
  checkResult.value = null
  checkError.value = false
  checkErrorMessage.value = ''

  try {
    let isOnline = false

    try {
      const networkStatus = await Network.getStatus()
      isOnline = networkStatus.connected
    }
    catch {
      checkErrorMessage.value = CHECK_FAILED_MESSAGE
      checkError.value = true
      return
    }

    if (!isOnline) {
      checkErrorMessage.value = OFFLINE_MESSAGE
      checkError.value = true
      return
    }

    try {
      const result = await protocolCheckService.checkProtocol(pendingProtocolText.value)

      if (result.issues.length === 0) {
        await transmitProtocol()
        return
      }

      checkResult.value = result
    }
    catch {
      checkErrorMessage.value = CHECK_FAILED_MESSAGE
      checkError.value = true
    }
  }
  finally {
    isChecking.value = false
  }
}

const send = async () => {
  if (!isAvailable.value) return

  isProcessing.value = true
  pendingProtocolText.value = store.generatedProtocol

  try {
    if (
      pendingProtocolText.value.includes('[')
      && !await confirmMissingInputs()
    ) {
      resetCheckState()
      return
    }

    await checkBeforeSend()
  }
  catch {
    resetCheckState()
  }
}

const closeCheckModal = () => {
  if (isChecking.value) return
  resetCheckState()
}

const retryCheck = async () => {
  await checkBeforeSend()
}

const sendAnyway = async () => {
  if (isChecking.value || pendingProtocolText.value === null) return
  await transmitProtocol()
}

</script>
