<template>
  <IonButtons slot="primary">
    <IonButton v-if="showReset"
      fill="solid" color="primary"
      @click="reset">Neu
    </IonButton>
    <IonButton v-if="!store.isDongleConnected"
      :fill="store.isDongleConnecting ? 'clear' : 'solid'" color="dark" :disabled="store.isDongleConnecting || store.connection.isSavingSettings"
      @click="connectDongle">
      <IonSpinner v-if="store.isDongleConnecting" name="crescent" slot="end" style="width:16px;margin-left:.5rem"></IonSpinner>
      Verbinden
    </IonButton>
    <IonButton v-else fill="solid" :color="isAvailable ? 'success' : 'medium'" :disabled="!isAvailable" @click="send">
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

withDefaults(defineProps<{
  showReset?: boolean
}>(), {
  showReset: false,
})

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
  && !store.connection.isSavingSettings
  && !isProcessing.value,
)

const OFFLINE_MESSAGE = 'Es besteht keine Internetverbindung. Das Protokoll konnte nicht geprüft werden.'
const CHECK_FAILED_MESSAGE = 'Das Protokoll konnte nicht geprüft werden. Prüfe die Internetverbindung oder versuche es erneut.'

const connectDongle = async () => {
  if (store.isDongleConnected || store.isDongleConnecting) return
  await store.connectDongle()
}

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

  const protocolText = pendingProtocolText.value
  isChecking.value = true
  checkResult.value = null
  checkError.value = false
  checkErrorMessage.value = ''

  try {
    const cachedResult = await protocolCheckService.getCachedResult(protocolText)
    if (cachedResult) {
      if (cachedResult.issues.length === 0) {
        await transmitProtocol()
        return
      }

      checkResult.value = cachedResult
      isCheckModalOpen.value = true
      return
    }

    isCheckModalOpen.value = true
    const networkStatus = await Network.getStatus()
    if (!networkStatus.connected) {
      checkErrorMessage.value = OFFLINE_MESSAGE
      checkError.value = true
      return
    }

    const result = await protocolCheckService.checkProtocol(protocolText)

    if (result.issues.length === 0) {
      await transmitProtocol()
      return
    }

    checkResult.value = result
  }
  catch {
    isCheckModalOpen.value = true
    checkErrorMessage.value = CHECK_FAILED_MESSAGE
    checkError.value = true
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
<style scoped>
ion-buttons {
  transform:none;
}
</style>
