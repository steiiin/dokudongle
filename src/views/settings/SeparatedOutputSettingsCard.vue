<template>
  <IonCard data-testid="separated-output-settings">
    <IonCardHeader><IonCardTitle>Getrennte Ausgabe</IonCardTitle></IonCardHeader>
    <IonCardContent class="with-list">
      <IonList lines="full">
        <IonItem>
          <IonToggle :checked="settings.config.enabled" :disabled="busy" @ionChange="toggle">Aktivieren</IonToggle>
        </IonItem>
        <IonItem button detail lines="none" :disabled="busy" @click="open">
          <IonLabel>Gliederung bearbeiten</IonLabel>
        </IonItem>
      </IonList>
      <IonText v-if="error && !isOpen" color="danger"><p role="alert">{{ error }}</p></IonText>
    </IonCardContent>
  </IonCard>

  <IonModal :is-open="isOpen" :can-dismiss="!settings.saving" @didDismiss="close">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton :disabled="settings.saving" aria-label="Abbrechen" @click="close">
            <IonIcon slot="icon-only" :icon="closeOutline" />
          </IonButton>
        </IonButtons>
        <IonTitle>Gliederung</IonTitle>
        <IonButtons slot="end">
          <IonButton color="success" :disabled="!valid || busy" @click="save">Speichern</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <p class="ion-padding-horizontal">Überschriften verschieben ihre ganze Gruppe. Einzelne Blöcke können zwischen den Gruppen verschoben werden.</p>
      <IonList>
        <IonReorderGroup :disabled="busy" @ionItemReorder="reorder">
          <IonItem v-for="row in rows" :key="row.kind === 'group' ? `group:${row.groupId}` : `block:${row.block}`"
            :class="{ 'group-header': row.kind === 'group' }" lines="full"
            :data-output-row="row.kind === 'group' ? `group:${row.groupId}` : row.block">
            <template v-if="row.kind === 'group'">
              <IonInput :value="group(row.groupId).name" aria-label="Überschrift" placeholder="Überschrift"
                :disabled="busy" @ionInput="group(row.groupId).name = $event.detail.value ?? ''" />
              <IonButton slot="end" fill="clear" color="danger" :disabled="draft.length === 1 || busy"
                :aria-label="`${group(row.groupId).name || 'Gruppe'} entfernen`" @click="remove(row.groupId)">
                <IonIcon slot="icon-only" :icon="trashOutline" />
              </IonButton>
            </template>
            <IonLabel v-else class="block-label">{{ OUTPUT_BLOCKS[row.block] }}</IonLabel>
            <IonReorder slot="end" :aria-label="row.kind === 'group' ? 'Gruppe verschieben' : 'Block verschieben'" />
          </IonItem>
        </IonReorderGroup>
      </IonList>
      <IonButton class="ion-margin" expand="block" fill="outline" :disabled="busy" @click="add">
        <IonIcon slot="start" :icon="addOutline" />Überschrift hinzufügen
      </IonButton>
      <p v-if="!valid" class="ion-padding-horizontal" role="status">Bitte eindeutige, nicht leere Überschriften vergeben.</p>
      <IonText v-if="error" color="danger"><p class="ion-padding-horizontal" role="alert">{{ error }}</p></IonText>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ItemReorderEventDetail, ToggleCustomEvent } from '@ionic/core'
import { addOutline, closeOutline, trashOutline } from 'ionicons/icons'
import { useDokuStore } from '@/store/doku'
import { useOutputSettingsStore } from '@/store/output-settings'
import { OUTPUT_BLOCKS, outputRows, removeOutputGroup, reorderOutputGroups, validOutputGroups, type OutputGroup } from '@/utils/separated-output'

const settings = useOutputSettingsStore()
const store = useDokuStore()
const isOpen = ref(false)
const draft = ref<OutputGroup[]>([])
const error = ref('')
const busy = computed(() => settings.saving || store.connection.isTransmitting || store.isProtocolChanging)
const valid = computed(() => validOutputGroups(draft.value))
const rows = computed(() => outputRows(draft.value))
const group = (id: string) => draft.value.find(item => item.id === id)!
function open() {
  draft.value = settings.config.groups.map(item => ({ ...item, blocks: [...item.blocks] }))
  error.value = ''
  isOpen.value = true
}
function close() {
  if (!settings.saving) isOpen.value = false
}
function add() {
  draft.value.push({ id: crypto.randomUUID(), name: '', blocks: [] })
}
function remove(id: string) {
  draft.value = removeOutputGroup(draft.value, id)
}
function reorder(event: CustomEvent<ItemReorderEventDetail>) {
  const next = reorderOutputGroups(draft.value, event.detail.from, event.detail.to)
  // Let Vue render the whole moved group instead of Ionic moving just its header.
  event.detail.complete(false)
  draft.value = next
}
async function toggle(event: ToggleCustomEvent) {
  const enabled = event.detail.checked
  if (busy.value || enabled === settings.config.enabled) return
  error.value = ''
  try {
    await settings.save({ ...settings.config, enabled })
  } catch {
    error.value = 'Die Einstellung konnte nicht gespeichert werden. Bitte erneut versuchen.'
  } finally {
    event.target.checked = settings.config.enabled
  }
}
async function save() {
  if (!valid.value || busy.value) return
  error.value = ''
  try {
    await settings.save({ ...settings.config, groups: draft.value })
    isOpen.value = false
  } catch {
    error.value = 'Die Gliederung konnte nicht gespeichert werden. Bitte erneut versuchen.'
  }
}
</script>

<style scoped>
.group-header { --background: var(--ion-color-light); font-weight: 600; }
.block-label { padding-inline-start: 1rem; }
</style>
