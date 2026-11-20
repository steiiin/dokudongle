<template>
  <IonButtons slot="primary">
    <IonButton v-if="showReset"
      fill="solid" color="primary"
      :disabled="store.isProtocolChanging" @click="reset">Neu
    </IonButton>
    <IonButton v-if="!store.isDongleConnected"
      :fill="store.isDongleConnecting ? 'clear' : 'solid'" color="dark" :disabled="store.isDongleConnecting || store.connection.isSavingSettings || store.connection.isTransmitting"
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
  <IonPopover ref="groupPopover" :is-open="isGroupPopoverOpen" :event="sendEvent" :dismiss-on-select="false"
    aria-label="Getrennte Ausgabe" @didDismiss="dismissGroups">
    <IonList class="group-list">
      <IonItem v-for="group in pendingGroups" :key="group.id" button
        :disabled="isSending || !group.text.trim() || !store.isDongleConnected || store.connection.isTransmitting"
        :data-output-group="group.id" @click="sendGroup(group)"
        :aria-label="`${group.name}: ${!group.text.trim() ? 'Kein Inhalt' : store.sentOutputGroupIds.includes(group.id) ? 'Gesendet' : 'Noch nicht gesendet'}`">
        <IonIcon slot="start" :icon="store.sentOutputGroupIds.includes(group.id) ? checkmarkCircle : ellipseOutline"
          :color="store.sentOutputGroupIds.includes(group.id) ? 'success' : 'medium'" />
        <IonLabel class="ion-text-wrap">{{ group.name }}<p v-if="!group.text.trim()">Kein Inhalt</p></IonLabel>
      </IonItem>
      <IonItem v-if="groupSendError" lines="none"><IonLabel color="danger" class="ion-text-wrap" role="alert">{{ groupSendError }}</IonLabel></IonItem>
    </IonList>
  </IonPopover>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { paperPlaneSharp, checkmarkCircle, ellipseOutline } from 'ionicons/icons'
import { alertController } from '@ionic/core'
import { Network } from '@capacitor/network'

import { tryScrollingToTop } from '@/utils/input'
import protocolCheckService, { type ProtocolCheckResult } from '@/services/protocol-check'

import { useDokuStore } from '@/store/doku'
import type { OutputGroupText } from '@/utils/separated-output'

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
let pendingProtocol: typeof store.doku | null = null
let pendingRevision: string | undefined
let pendingSeparated = false
const pendingGroups = ref<OutputGroupText[]>([])
const isGroupPopoverOpen = ref(false)
const groupPopover = ref<{ $el: HTMLIonPopoverElement }>()
const sendEvent = ref<Event>()
const groupSendError = ref('')

const isAvailable = computed(() =>
  store.connection.isConnected
  && !store.connection.isTransmitting
  && !store.connection.isSavingSettings
  && !store.isProtocolChanging
  && !!store.effectiveProtocolText.trim()
  && !isProcessing.value,
)

const OFFLINE_MESSAGE = 'Es besteht keine Internetverbindung. Das Protokoll konnte nicht geprüft werden.'
const CHECK_FAILED_MESSAGE = 'Das Protokoll konnte nicht geprüft werden. Prüfe die Internetverbindung oder versuche es erneut.'
const CHANGED_MESSAGE = 'Der Text wurde während der Prüfung geändert. Bitte prüfe die Vorschau und tippe erneut auf Senden.'

const pendingChanged = () => pendingProtocol !== store.doku || pendingProtocolText.value !== store.effectiveProtocolText
  || pendingRevision !== store.outputRevision
watch(() => [store.effectiveProtocolText, store.doku, store.outputRevision], () => {
  if (!isProcessing.value || !pendingChanged()) return
  checkResult.value = null
  checkError.value = true
  checkErrorMessage.value = CHANGED_MESSAGE
  if (isGroupPopoverOpen.value) {
    resetCheckState()
    void showChangedAlert()
  }
})

const connectDongle = async () => {
  if (store.isDongleConnected || store.isDongleConnecting) return
  await store.connectDongle()
  if (!store.isDongleConnected && store.connection.lastError) {
    const alert = await alertController.create({
      header: 'Dongle-Verbindung fehlgeschlagen',
      message: store.connection.lastError,
      buttons: ['OK'],
    })
    await alert.present()
  }
}

const reset = async () => {

  const alert = await alertController.create({
    header: 'Neues Protokoll',
    message: 'Ein neues Protokoll beginnen? Deine bisherigen Eingaben findest du in den Einstellungen unter „Protokolle wiederherstellen“. Dort werden die letzten drei Protokolle gespeichert.',
    buttons: [
      {
        text: 'Abbrechen',
        role: 'cancel'
      },
      {
        text: 'Ja',
        handler: async () => {
          try {
            await store.newProtocol()
          } catch {
            const error = await alertController.create({
              header: 'Zurücksetzen fehlgeschlagen',
              message: 'Das Protokoll konnte nicht gespeichert und zurückgesetzt werden. Deine Eingaben bleiben erhalten.',
              buttons: ['OK'],
            })
            await error.present()
          }
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
  isGroupPopoverOpen.value = false
  pendingGroups.value = []
  groupSendError.value = ''
  isCheckModalOpen.value = false
  isChecking.value = false
  checkResult.value = null
  checkError.value = false
  checkErrorMessage.value = ''
  pendingProtocolText.value = null
  pendingProtocol = null
  pendingRevision = undefined
  isSending.value = false
  isProcessing.value = false
}

const showChangedAlert = async () => {
  const alert = await alertController.create({ header: 'Protokoll geändert', message: CHANGED_MESSAGE, buttons: ['OK'] })
  await alert.present()
}

const dismissGroups = () => {
  // Programmatic dismissal for a transmission retains the checked session.
  if (isGroupPopoverOpen.value) resetCheckState()
}

const sendGroup = async (group: OutputGroupText) => {
  if (isSending.value || !group.text.trim() || !store.isDongleConnected || store.connection.isTransmitting) return
  isSending.value = true
  groupSendError.value = ''
  try {
    if (pendingChanged()) { await showChangedAlert(); resetCheckState(); return }
    if (store.sentOutputGroupIds.includes(group.id)) {
      const alert = await alertController.create({
        header: 'Erneut senden?', message: 'Diese Gruppe wurde bereits gesendet.',
        buttons: [{ text: 'Abbrechen', role: 'cancel' }, { text: 'Erneut senden', role: 'confirm' }],
      })
      await alert.present()
      if ((await alert.onDidDismiss()).role !== 'confirm') return
    }
    isGroupPopoverOpen.value = false
    await groupPopover.value?.$el.dismiss?.()
    await tryScrollingToTop()
    if (pendingChanged()) { await showChangedAlert(); resetCheckState(); return }
    const sent = await store.sendProtocol(group.text, { markComplete: false, groupId: group.id, revision: pendingRevision })
    if (!sent) groupSendError.value = 'Die Gruppe wurde nicht vollständig gesendet oder der Sendestatus konnte nicht gespeichert werden.'
  } catch {
    groupSendError.value = 'Die Gruppe konnte nicht gesendet werden. Bitte erneut versuchen.'
  } finally {
    isSending.value = false
    if (isProcessing.value && !pendingChanged()) isGroupPopoverOpen.value = true
    else resetCheckState()
  }
}

const transmitProtocol = async () => {
  if (isSending.value) return

  if (pendingSeparated && !pendingChanged()) {
    isCheckModalOpen.value = false
    isGroupPopoverOpen.value = true
    return
  }

  isSending.value = true
  isCheckModalOpen.value = false

  try {
    await tryScrollingToTop()
    if (pendingChanged()) {
      const alert = await alertController.create({
        header: 'Protokoll geändert',
        message: CHANGED_MESSAGE,
        buttons: ['OK'],
      })
      await alert.present()
      return
    }
    await store.sendProtocol(pendingProtocolText.value!)
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
    if (pendingChanged()) { await transmitProtocol(); return }
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
    if (pendingChanged()) { await transmitProtocol(); return }

    if (result.issues.length === 0) {
      await transmitProtocol()
      return
    }

    checkResult.value = result
  }
  catch {
    if (pendingChanged()) { await transmitProtocol(); return }
    isCheckModalOpen.value = true
    checkErrorMessage.value = CHECK_FAILED_MESSAGE
    checkError.value = true
  }
  finally {
    isChecking.value = false
  }
}

const send = async (event?: Event) => {
  if (!isAvailable.value) return

  isProcessing.value = true
  pendingProtocolText.value = store.effectiveProtocolText
  pendingProtocol = store.doku
  pendingRevision = store.outputRevision
  pendingSeparated = store.separatedOutputEnabled
  pendingGroups.value = pendingSeparated ? store.outputGroups.map(group => ({ ...group, blocks: [...group.blocks] })) : []
  sendEvent.value = event

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
  if (isChecking.value || !isCheckModalOpen.value) return
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
.group-list { padding-block: 0.5rem; }
</style>
