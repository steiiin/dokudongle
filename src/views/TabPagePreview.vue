<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Vorschau</IonTitle>
        </div>
        <DodoSendAction show-reset></DodoSendAction>
      </IonToolbar>
    </IonHeader>

    <IonContent
      :fullscreen="true"
      :class="{ 'dongle-connecting': store.isDongleConnecting }"
    >
      <DodoPreviewEditor :document="store.previewDocument"
        :readonly="store.isProtocolChanging || store.connection.isTransmitting"
        @edit="store.editPreview" @resolve="store.resolvePreviewConflict" />
      <IonFab slot="fixed" vertical="bottom" horizontal="end" v-if="hasntPlaceholders">
        <IonFabButton
          color="primary"
          aria-label="Protokoll prüfen"
          :disabled="isChecking"
          @click="checkProtocol"
        >
          <IonSpinner v-if="isChecking" name="crescent"></IonSpinner>
          <IonIcon v-else :src="shieldCheckmarkOutline"></IonIcon>
        </IonFabButton>
      </IonFab>
    </IonContent>

    <DodoProtocolCheckModal
      :is-open="isCheckModalOpen"
      :is-checking="isChecking"
      :result="checkResult"
      :check-error="checkError"
      @close="closeCheckModal"
      @retry="checkProtocol"
    />
  </IonPage>
</template>
<script setup lang="ts">

import { shieldCheckmarkOutline } from 'ionicons/icons'
import DodoPreviewEditor from '@/components/protocol/DodoPreviewEditor.vue'

import protocolCheckService, {
  type ProtocolCheckResult,
} from '@/services/protocol-check'
import { useDokuStore } from '@/store/doku'
import { computed, ref, watch } from 'vue'
const store = useDokuStore()

const localPreview = computed(() => store.effectiveProtocolText)
const isCheckModalOpen = ref(false)
const isChecking = ref(false)
const checkResult = ref<ProtocolCheckResult | null>(null)
const checkError = ref(false)

let checkVersion = 0
watch(localPreview, () => {
  checkVersion++
  isCheckModalOpen.value = false
  isChecking.value = false
  checkResult.value = null
  checkError.value = false
})

const checkProtocol = async () => {
  if (isChecking.value) return

  const protocolText = localPreview.value
  const version = ++checkVersion
  isCheckModalOpen.value = true
  isChecking.value = true
  checkResult.value = null
  checkError.value = false

  try {
    const result = await protocolCheckService.getCachedResult(protocolText)
      ?? await protocolCheckService.checkProtocol(protocolText)
    if (version === checkVersion) checkResult.value = result
  }
  catch {
    if (version === checkVersion) checkError.value = true
  }
  finally {
    if (version === checkVersion) isChecking.value = false
  }
}

const closeCheckModal = () => {
  if (isChecking.value) return
  isCheckModalOpen.value = false
}

const hasntPlaceholders = computed(() => !!localPreview.value.trim() && !localPreview.value.includes('['))

</script>
<style scoped lang="scss">

  ion-fab {
    margin-bottom: 0.5rem;
  }

  .dongle-connecting {
    filter: blur(4px);
  }

</style>
