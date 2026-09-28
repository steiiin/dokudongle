<template>
  <IonCard v-if="store.isDongleConnected || firmware.showRecovery" data-testid="dongle-settings">
    <IonCardHeader>
      <IonCardTitle>Dongle</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <template v-if="store.isDongleConnected">
        <ul class="current-settings">
          <li><b>Name:</b> <i>{{ store.connectedDongleName }}</i></li>
          <li><b>Tastenabstand:</b> <i>{{ store.connection.config ? `${store.connection.config.keyGapMs} ms` : 'nicht verfügbar' }}</i></li>
          <li><b>Version:</b> <i>{{ versionLabel }}<template v-if="firmware.available"> (v{{ firmware.manifest?.version }} verfügbar)</template></i></li>
        </ul>
        <DodoHint v-if="store.connection.configStatus === 'unsupported'" variant="warning">Für diese Einstellungen bitte die aktuelle XIAO-Firmware über USB einrichten.</DodoHint>
        <template v-if="store.connection.configStatus === 'error'">
          <DodoHint variant="error">Die Dongle-Einstellungen konnten nicht gelesen werden.</DodoHint>
          <IonButton expand="block" color="danger" @click="store.refreshDongleConfig()">Einstellungen erneut laden</IonButton>
        </template>
        <template v-if="store.connection.firmwareStatus === 'error'">
          <DodoHint variant="error">Die Dongle-Version konnte nicht gelesen werden.</DodoHint>
          <IonButton expand="block" :disabled="store.connection.isUpdatingFirmware" @click="store.refreshDongleFirmware()">Version erneut laden</IonButton>
        </template>
        <DodoHint v-else-if="store.connection.firmwareStatus === 'unsupported' || (store.connection.firmwareStatus === 'ready' && !store.connection.hasDfu)" variant="warning">
          Dieser Dongle benötigt eine einmalige Einrichtung über USB, bevor Bluetooth-Updates möglich sind.
        </DodoHint>
        <DodoHint v-else-if="firmware.available && !firmware.android">Zum Installieren bitte die Android-App verwenden.</DodoHint>
        <IonButton v-if="showInstall" class="install-button" expand="block" :disabled="!firmware.canInstall" @click="firmware.requestUpdate('install')">Neue Dongle-Version installieren</IonButton>
        <IonButton v-else expand="block" :disabled="!canEdit" @click="openSettings">Einstellungen ändern</IonButton>
      </template>
      <template v-if="firmware.showRecovery">
        <template v-if="firmware.recovery">
          <DodoHint variant="warning">Ein Update für {{ firmware.recovery.deviceName }} wurde noch nicht bestätigt.</DodoHint>
          <IonButton :disabled="!firmware.canRecover" @click="firmware.requestUpdate('retry')">Update erneut versuchen</IonButton>
        </template>
        <DodoHint style="color: var(--ion-color-light-contrast);">Dongle nach einem unterbrochenen Update nicht erreichbar? Den betroffenen Dongle aus- und wieder einstecken und anschließend hier auswählen.</DodoHint>
        <IonButton :disabled="!firmware.canRecover" @click="firmware.requestUpdate('recoverManually')">Dongle wiederherstellen</IonButton>
      </template>
      <template v-if="firmware.manifestError">
        <DodoHint variant="error">{{ firmware.manifestError }}</DodoHint>
        <IonButton @click="firmware.loadManifest()">Firmware erneut laden</IonButton>
      </template>
      <template v-if="firmware.nativeError">
        <DodoHint variant="error">{{ firmware.nativeError }}</DodoHint>
        <IonButton @click="firmware.restore()">Update-Status erneut laden</IonButton>
      </template>
    </IonCardContent>
  </IonCard>

  <IonModal :is-open="isOpen" :can-dismiss="!isBusy" aria-label="Dongle-Einstellungen" @did-dismiss="closeSettings">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton :disabled="isBusy" data-testid="cancel-settings" @click="closeSettings" aria-label="Abbrechen" title="Abbrechen">
            <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle>Dongle</IonTitle>
        <IonButtons slot="end">
          <IonButton :disabled="!canSave" data-testid="save-settings" @click="saveSettings">Speichern</IonButton>
        </IonButtons>
      </IonToolbar>
      <IonProgressBar v-if="isBusy" type="indeterminate" aria-label="Einstellungen werden gespeichert" />
    </IonHeader>
    <IonContent>
      <IonCard>
        <IonCardHeader><IonCardTitle>Dongle-Name</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <div class="name-input">
            <span class="name-prefix">{{ DONGLE_NAME_PREFIX }}</span>
            <IonInput
              ref="nameRef"
              :value="newName"
              :counter="true"
              :maxlength="MAX_DONGLE_NAME_BYTES"
              :disabled="isBusy"
              label="Namenszusatz"
              label-placement="stacked"
              autocomplete="off"
              autocapitalize="off"
              :spellcheck="false"
              @ionInput="handleNameInput"
            />
          </div>
          <p>Bis zu 18 Buchstaben (A–Z, a–z) oder Ziffern (0–9).</p>
        </IonCardContent>
      </IonCard>
      <IonCard>
        <IonCardHeader><IonCardTitle>Tastenabstand</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p aria-live="polite">{{ newGapMs }} ms</p>
          <IonRange
            :value="newGapMs"
            :min="MIN_KEY_GAP_MS"
            :max="MAX_KEY_GAP_MS"
            :step="KEY_GAP_STEP_MS"
            :snaps="true"
            :ticks="true"
            :pin="true"
            :disabled="isBusy"
            aria-label="Tastenabstand in Millisekunden"
            @ionInput="handleGapInput"
          >
            <span slot="start">{{ MIN_KEY_GAP_MS }}</span>
            <span slot="end">{{ MAX_KEY_GAP_MS }} ms</span>
          </IonRange>
        </IonCardContent>
      </IonCard>
      <DodoHint v-if="saveError" class="save-error" variant="error">{{ saveError }}</DodoHint>
    </IonContent>
  </IonModal>

</template>

<script setup lang="ts">
import { closeOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useDokuStore } from '@/store/doku'
import { useFirmwareStore } from '@/store/firmware'
import DodoHint from '@/components/DodoHint.vue'
import { setNativeValue } from '@/utils/input'
import { isValidDongleConfig } from '@/utils/dongle-config'
import {
  DONGLE_NAME_PREFIX, MAX_DONGLE_NAME_BYTES, DEFAULT_KEY_GAP_MS,
  MIN_KEY_GAP_MS, MAX_KEY_GAP_MS, KEY_GAP_STEP_MS,
} from '@/types/dongle'

const store = useDokuStore()
const firmware = useFirmwareStore()
const versionLabel = computed(() => {
  if (store.connection.firmwareStatus === 'loading') return 'wird gelesen …'
  return store.connection.firmware ? `v${store.connection.firmware.version}` : 'nicht verfügbar'
})
const showInstall = computed(() => firmware.android && firmware.available
  && store.connection.firmwareStatus === 'ready' && store.connection.hasDfu)
const nameRef = ref<{ $el: HTMLIonInputElement } | null>(null)
const isOpen = ref(false)
const newName = ref('')
const newGapMs = ref(DEFAULT_KEY_GAP_MS)
const isSaving = ref(false)
const saveError = ref('')
const isBusy = computed(() => isSaving.value || store.connection.isSavingSettings)
const canEdit = computed(() => store.isDongleConnected && !!store.connection.config
  && !showInstall.value && !isBusy.value && !store.connection.isTransmitting && !store.connection.isUpdatingFirmware)
const canSave = computed(() => isOpen.value && canEdit.value
  && isValidDongleConfig({ name: newName.value, keyGapMs: newGapMs.value })
  && (newName.value !== store.connection.config?.name || newGapMs.value !== store.connection.config?.keyGapMs))

const openSettings = () => {
  if (!canEdit.value || !store.connection.config) return
  newName.value = store.connection.config.name
  newGapMs.value = store.connection.config.keyGapMs
  saveError.value = ''
  isOpen.value = true
}

const closeSettings = () => {
  if (isBusy.value) return
  isOpen.value = false
  newName.value = ''
  newGapMs.value = DEFAULT_KEY_GAP_MS
  saveError.value = ''
}

watch(
  () => [store.connection.isConnected, store.connection.device?.id],
  () => {
    if (!isBusy.value) closeSettings()
  },
  { flush: 'sync' },
)

const handleNameInput = (event: CustomEvent) => {
  if (isBusy.value) return
  newName.value = String(event.detail?.value ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, MAX_DONGLE_NAME_BYTES)
  setNativeValue(nameRef, newName.value)
  saveError.value = ''
}

const handleGapInput = (event: CustomEvent) => {
  if (isBusy.value || typeof event.detail?.value !== 'number' || !Number.isFinite(event.detail.value)) return
  newGapMs.value = Math.min(MAX_KEY_GAP_MS, Math.max(MIN_KEY_GAP_MS,
    Math.round(event.detail.value / KEY_GAP_STEP_MS) * KEY_GAP_STEP_MS))
  saveError.value = ''
}

const saveSettings = async () => {
  if (!canSave.value) return
  isSaving.value = true
  saveError.value = ''
  let saved = false
  try {
    saved = await store.updateDongleConfig({ name: newName.value, keyGapMs: newGapMs.value })
  } catch {
    // Keep the draft open on validation, write, or reconnect errors.
  } finally {
    isSaving.value = false
  }
  if (saved) closeSettings()
  else saveError.value = 'Die Einstellungen konnten nicht gespeichert oder bestätigt werden. Bitte prüfe die Verbindung und versuche es erneut.'
}
</script>

<style lang="scss" scoped>

ion-card-subtitle {
  overflow-wrap: anywhere;
}

.name-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.name-prefix {
  flex: 0 0 auto;
}
.name-input ion-input {
  flex: 1 1 130px;
  min-width: 0;
}
.save-error {
  margin: 1rem;
}

.install-button {
  white-space: normal;
  height: auto;
  min-height: 36px;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
}

.current-settings
{

  margin: 0;
  padding: 0 0 .5rem 0;
  list-style: none;

  & li i
  {
    font-style: normal;
    color: var(--ion-text-color)
  }
}

</style>
