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
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
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

    <IonModal :is-open="isCheckModalOpen" class="protocol-check-modal" @did-dismiss="closeCheckModal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Protokollprüfung</IonTitle>
          <IonButtons slot="end">
            <IonButton :disabled="isChecking" @click="closeCheckModal">Schließen</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonProgressBar v-if="isChecking" type="indeterminate"></IonProgressBar>
      </IonHeader>

      <IonContent class="ion-padding">
        <div v-if="isChecking" class="check-state" role="status" aria-live="polite">
          <IonSpinner name="crescent"></IonSpinner>
          <p>Das Protokoll wird geprüft …</p>
        </div>

        <div v-else-if="checkError" class="check-state check-error" role="alert">
          <IonIcon :src="alertCircleOutline"></IonIcon>
          <h2>Prüfung fehlgeschlagen</h2>
          <p>Das Protokoll konnte nicht geprüft werden. Bitte versuche es erneut.</p>
          <IonButton @click="checkProtocol">Erneut versuchen</IonButton>
        </div>

        <div v-else-if="isSuccessfulCheck" class="check-state check-success" role="status">
          <IonIcon :src="checkmarkCircleOutline"></IonIcon>
          <h2>Keine Auffälligkeiten gefunden.</h2>
        </div>

        <template v-else-if="checkResult">
          <IonList v-if="checkResult.issues.length" lines="none">
            <IonItem v-for="(issue, index) in checkResult.issues" :key="index" class="protocol-issue">
              <IonLabel class="ion-text-wrap" style="margin: .5rem 0 .25rem 0">
                <div class="issue-labels">
                  <IonBadge :color="severityColor(issue.severity)">
                    {{ severityLabel(issue.severity) }}
                  </IonBadge>
                  <IonBadge color="medium">{{ issueTypeLabel(issue.type) }}</IonBadge>
                </div>
                <h2>{{ issue.message }}</h2>
                <p><strong>Konfidenz:</strong> {{ issue.confidence }}</p>
                <div v-if="issue.evidence.length" class="issue-details">
                  <strong>Evidenz:</strong>
                  <ul>
                    <li v-for="(evidence, evidenceIndex) in issue.evidence" :key="evidenceIndex">
                      {{ evidence }}
                    </li>
                  </ul>
                </div>
                <p class="issue-details"><strong>Prüfung:</strong> {{ issue.check }}</p>
              </IonLabel>
            </IonItem>
          </IonList>
          <p v-else class="warning-without-issues">
            Die Prüfung hat eine Warnung gemeldet, aber keine Details zurückgegeben.
          </p>
        </template>
      </IonContent>
    </IonModal>
  </IonPage>
</template>
<script setup lang="ts">

import { onIonViewDidEnter } from '@ionic/vue'
import { alertCircleOutline, checkmarkCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons'

import protocolCheckService, {
  type ProtocolCheckIssueSeverity,
  type ProtocolCheckIssueType,
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

const isSuccessfulCheck = computed(() =>
  checkResult.value?.status === 'ok' && checkResult.value.issues.length === 0,
)

const issueTypeLabels: Record<ProtocolCheckIssueType, string> = {
  contradiction: 'Widerspruch',
  possible_default_value: 'Möglicher Standardwert',
  context_gap: 'Kontextlücke',
  incomplete_protocol: 'Unvollständiges Protokoll',
}

const severityLabels: Record<ProtocolCheckIssueSeverity, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
}

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

const issueTypeLabel = (type: ProtocolCheckIssueType) => issueTypeLabels[type]
const severityLabel = (severity: ProtocolCheckIssueSeverity) => severityLabels[severity]

const severityColor = (severity: ProtocolCheckIssueSeverity) => {
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'medium'
}

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

  .check-state {
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .check-state > ion-icon {
    font-size: 4rem;
  }

  .check-success > ion-icon {
    color: var(--ion-color-success);
  }

  .check-error > ion-icon {
    color: var(--ion-color-danger);
  }

  .issues-heading {
    margin: 0 0 1rem;
  }

  .protocol-issue + .protocol-issue {
    margin-top: 0.5rem;
  }

  .issue-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }

  .issue-details {
    white-space: normal;
  }

  .issue-details ul {
    margin: 0.25rem 0 0.75rem;
    padding-left: 1.25rem;
  }

  .warning-without-issues {
    color: var(--ion-color-warning-shade);
  }

</style>
