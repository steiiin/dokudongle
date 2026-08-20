<template>
  <IonModal :is-open="isOpen" class="protocol-check-modal" @did-dismiss="handleDidDismiss">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Protokollprüfung</IonTitle>
        <IonButtons slot="end">
          <IonButton :disabled="isChecking" @click="emitClose">Schließen</IonButton>
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
        <h2>Prüfung nicht verfügbar</h2>
        <p>{{ errorMessage }}</p>
        <IonButton v-if="!allowSendAnyway" @click="$emit('retry')">
          Erneut prüfen
        </IonButton>
      </div>

      <div v-else-if="isSuccessfulCheck" class="check-state check-success" role="status">
        <IonIcon :src="checkmarkCircleOutline"></IonIcon>
        <h2>Keine Auffälligkeiten gefunden.</h2>
      </div>

      <template v-else-if="result">
        <IonList v-if="result.issues.length" lines="none">
          <IonItem v-for="(issue, index) in result.issues" :key="index" class="protocol-issue">
            <IonLabel class="ion-text-wrap issue-content">
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
      </template>
    </IonContent>

    <IonFooter v-if="showSendActions">
      <IonToolbar>
        <div class="send-actions">
          <IonButton v-if="checkError" fill="outline" @click="$emit('retry')">
            Erneut prüfen
          </IonButton>
          <IonButton color="success" @click="$emit('send-anyway')">
            Trotzdem senden
          </IonButton>
        </div>
      </IonToolbar>
    </IonFooter>
  </IonModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons'

import type {
  ProtocolCheckIssueSeverity,
  ProtocolCheckIssueType,
  ProtocolCheckResult,
} from '@/services/protocol-check'

const props = withDefaults(defineProps<{
  isOpen: boolean
  isChecking: boolean
  result: ProtocolCheckResult | null
  checkError: boolean
  errorMessage?: string
  allowSendAnyway?: boolean
}>(), {
  errorMessage: 'Das Protokoll konnte nicht geprüft werden. Bitte versuche es erneut.',
  allowSendAnyway: false,
})

const emit = defineEmits<{
  close: []
  retry: []
  'send-anyway': []
}>()

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

const isSuccessfulCheck = computed(() =>
  props.result !== null && props.result.issues.length === 0,
)

const showSendActions = computed(() =>
  props.allowSendAnyway
  && !props.isChecking
  && (props.checkError || (props.result?.issues.length ?? 0) > 0),
)

const emitClose = () => {
  if (!props.isChecking) emit('close')
}

const handleDidDismiss = () => {
  if (props.isOpen) emitClose()
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

.protocol-issue + .protocol-issue {
  margin-top: 0.5rem;
}

.issue-content {
  margin: 0.5rem 0 0.25rem;
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

.send-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0 0.5rem;
}
</style>
