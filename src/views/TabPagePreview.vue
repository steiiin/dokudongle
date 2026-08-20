<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Vorschau</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
        <DodoSendAction></DodoSendAction>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true">
      <textarea readonly :value="localPreview"></textarea>
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

import { onIonViewDidEnter } from '@ionic/vue'
import { shieldCheckmarkOutline } from 'ionicons/icons'

import protocolCheckService, {
  type ProtocolCheckResult,
} from '@/services/protocol-check'
import { useDokuStore } from '@/store/doku'
import { computed, ref } from 'vue'
const store = useDokuStore()

const localPreview = ref<string>(store.generatedProtocol)
const isCheckModalOpen = ref(false)
const isChecking = ref(false)
const checkResult = ref<ProtocolCheckResult | null>(null)
const checkError = ref(false)

onIonViewDidEnter(() => {
  localPreview.value = store.generatedProtocol
})

const checkProtocol = async () => {
  if (isChecking.value) return

  isCheckModalOpen.value = true
  isChecking.value = true
  checkResult.value = null
  checkError.value = false

  try {
    checkResult.value = await protocolCheckService.checkProtocol(localPreview.value)
  }
  catch {
    checkError.value = true
  }
  finally {
    isChecking.value = false
  }
}

const closeCheckModal = () => {
  if (isChecking.value) return
  isCheckModalOpen.value = false
}

const hasntPlaceholders = computed(() => !localPreview.value.includes('['))

</script>
<style scoped lang="scss">

  textarea {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: var(--ion-background-color);
    border: none;
    resize: none;
    margin: 0;
    padding: 1rem;
  }

  ion-fab {
    margin-bottom: 0.5rem;
  }

</style>
