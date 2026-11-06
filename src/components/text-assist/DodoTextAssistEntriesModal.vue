<template>
  <IonModal :is-open="isOpen" :can-dismiss="!busy" :aria-label="title" @did-dismiss="emit('close')">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton :disabled="busy" @click="editing ? cancel() : emit('close')" :aria-label="editing ? 'Abbrechen' : 'Zurück'" :title="editing ? 'Abbrechen' : 'Zurück'">
            <IonIcon slot="icon-only" :icon="editing ? closeOutline : chevronBackOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle>{{ title }}</IonTitle>
        <IonButtons slot="end">
          <IonButton v-if="editing" color="success" :disabled="busy || !ready || !canSave" @click="save">Speichern</IonButton>
          <IonButton v-else :disabled="busy || !ready" @click="reset">Zurücksetzen</IonButton>
        </IonButtons>
      </IonToolbar>
      <IonProgressBar v-if="busy" type="indeterminate" aria-label="Einträge werden gespeichert oder geladen" />
    </IonHeader>
    <IonContent class="ion-padding">
      <form v-if="editing" class="entry-form" @submit.prevent="save">
        <template v-if="kind === 'shortcuts'">
          <IonInput v-model="shortcut" label="Shortcut" label-placement="stacked" fill="solid" :disabled="busy" autocapitalize="off" :spellcheck="false" />
          <IonInput v-model="replacement" label="Ersetzung" label-placement="stacked" fill="solid" :disabled="busy" />
        </template>
        <template v-else>
          <IonInput v-model="label" label="Bezeichnung" label-placement="stacked" fill="solid" :disabled="busy" />
          <IonInput v-model="keywords" label="Suchbegriffe (optional)" helper-text="Durch Komma getrennt" label-placement="stacked" fill="solid" :disabled="busy" />
          <IonInput v-model="category" label="Kategorie (optional)" label-placement="stacked" fill="solid" :disabled="busy" />
        </template>
        <IonButton v-if="editingId !== null" class="delete-entry" type="button" fill="clear" color="danger" :disabled="busy" :aria-label="deleteLabel" :title="deleteLabel" @click="remove">
          <IonIcon slot="icon-only" :icon="trashOutline" aria-hidden="true" />
        </IonButton>
      </form>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <IonButton v-if="!ready && !busy" fill="clear" @click="load">Erneut laden</IonButton>
      <template v-if="!editing">
        <IonButton :disabled="busy || !ready" @click="startNew"
          expand="full" style="margin: 0 0 0.5rem"
          >{{ kind === 'shortcuts' ? 'Neuer Shortcut' : 'Neues Snippet' }}</IonButton>
        <template v-if="ready && rows.length">
          <IonAccordionGroup v-if="groups.length > 1" multiple>
            <IonAccordion v-for="group in groups" :key="group.category" :value="group.category">
              <IonItem slot="header"><IonLabel>{{ group.category || 'Ohne Kategorie' }}</IonLabel></IonItem>
              <DodoTextAssistEntryList slot="content" :entries="group.entries" :disabled="busy" @edit="edit" />
            </IonAccordion>
          </IonAccordionGroup>
          <DodoTextAssistEntryList v-else :entries="rows" :disabled="busy" @edit="edit" />
        </template>
        <template v-else-if="ready">
          <p>Noch keine {{ kind === 'shortcuts' ? 'Shortcuts' : 'Orts-Snippets' }}.</p>
          <IonButton class="restore" fill="clear" color="primary" :disabled="busy" @click="reset">{{ restoreLabel }}</IonButton>
        </template>
      </template>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { alertController } from '@ionic/core'
import { chevronBackOutline, closeOutline, trashOutline } from 'ionicons/icons'
import DodoTextAssistEntryList from './DodoTextAssistEntryList.vue'
import { textAssistService, type TextSnippet } from '@/services/text-assist'

const props = defineProps<{ isOpen: boolean; kind: 'shortcuts' | 'locations' }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const title = computed(() => props.kind === 'shortcuts' ? 'Shortcut-Ersetzungen' : 'Orts-Snippets')
const restoreLabel = computed(() => props.kind === 'shortcuts' ? 'Standard-Shortcuts wiederherstellen' : 'Standard-Orts-Snippets wiederherstellen')
const shortcuts = ref<Record<string, string>>({})
const locations = ref<TextSnippet[]>([])
const busy = ref(false)
const ready = ref(false)
const error = ref('')
const editing = ref(false)
const editingId = ref<string | null>(null)
const shortcut = ref('')
const label = ref('')
const replacement = ref('')
const keywords = ref('')
const category = ref('')
const canSave = computed(() => Boolean(props.kind === 'shortcuts' ? shortcut.value.trim() && replacement.value.trim() : label.value.trim()))
const rows = computed(() => props.kind === 'shortcuts'
  ? Object.entries(shortcuts.value).map(([key, value]) => ({ id: key, name: key, description: value, category: '' }))
  : locations.value.map(entry => ({ id: entry.id, name: entry.label, description: (entry.keywords ?? []).join(', '), category: entry.category?.trim() ?? '' })))
const deleteLabel = computed(() => `${rows.value.find(entry => entry.id === editingId.value)?.name ?? ''} entfernen`)
const groups = computed(() => {
  const grouped = new Map<string, typeof rows.value>()
  for (const row of rows.value) {
    const entries = grouped.get(row.category) ?? []
    entries.push(row)
    grouped.set(row.category, entries)
  }
  return Array.from(grouped, ([category, entries]) => ({ category, entries }))
})

const clearForm = () => {
  shortcut.value = label.value = replacement.value = keywords.value = category.value = ''
  editingId.value = null
  editing.value = false
}
const cancel = () => {
  if (busy.value) return
  clearForm()
  error.value = ''
}
const startNew = () => {
  if (busy.value || !ready.value) return
  cancel()
  editing.value = true
}
const edit = (id: string) => {
  if (busy.value || !ready.value) return
  startNew()
  editingId.value = id
  if (props.kind === 'shortcuts') {
    shortcut.value = id
    replacement.value = shortcuts.value[id]
  } else {
    const entry = locations.value.find(entry => entry.id === id)!
    label.value = entry.label
    keywords.value = (entry.keywords ?? []).join(', ')
    category.value = entry.category ?? ''
  }
}
const refresh = async () => {
  if (props.kind === 'shortcuts') shortcuts.value = await textAssistService.getShortcutReplacements()
  else locations.value = await textAssistService.getLocationSnippets()
}
const run = async (action: () => Promise<void>) => {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try { await action() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Die Einträge konnten nicht gespeichert oder geladen werden.' }
  finally { busy.value = false }
}
const load = () => run(async () => { await refresh(); ready.value = true })
const confirm = async (header: string, message: string, confirmText: string, subHeader?: string) => {
  const alert = await alertController.create({
    header,
    subHeader,
    message,
    buttons: [
      { text: 'Abbrechen', role: 'cancel' },
      { text: confirmText, role: 'confirm' },
    ],
  })
  await alert.present()
  return (await alert.onDidDismiss()).role === 'confirm'
}
const save = () => {
  if (!editing.value || !ready.value || !canSave.value) return
  return run(async () => {
    if (props.kind === 'shortcuts') {
      if (editingId.value !== null) await textAssistService.updateShortcutReplacement(editingId.value, shortcut.value, replacement.value)
      else await textAssistService.addShortcutReplacement(shortcut.value, replacement.value)
    } else {
      const entry = { trigger: '@', label: label.value, replacement: label.value, keywords: keywords.value.split(','), category: category.value }
      if (editingId.value !== null) await textAssistService.updateLocationSnippet(editingId.value, entry)
      else await textAssistService.addLocationSnippet(entry)
    }
    clearForm()
    ready.value = false
    await refresh()
    ready.value = true
  })
}
const remove = () => {
  if (!ready.value || !editing.value || editingId.value === null) return
  const id = editingId.value
  const name = rows.value.find(entry => entry.id === id)?.name ?? id
  return run(async () => {
    if (!await confirm(
      props.kind === 'shortcuts' ? 'Shortcut löschen?' : 'Orts-Snippet löschen?',
      'Soll dieser Eintrag wirklich gelöscht werden?',
      'Löschen',
      name,
    )) return
    if (props.kind === 'shortcuts') await textAssistService.removeShortcutReplacement(id)
    else await textAssistService.removeLocationSnippet(id)
    clearForm()
    ready.value = false
    await refresh()
    ready.value = true
  })
}
const reset = () => {
  if (!ready.value || editing.value) return
  return run(async () => {
    if (!await confirm(
      props.kind === 'shortcuts' ? 'Shortcuts zurücksetzen?' : 'Orts-Snippets zurücksetzen?',
      'Alle eigenen Einträge und Änderungen werden durch die Standardwerte ersetzt. Möchtest du fortfahren?',
      'Zurücksetzen',
    )) return
    if (props.kind === 'shortcuts') await textAssistService.resetShortcutReplacements()
    else await textAssistService.resetLocationSnippets()
    await refresh()
  })
}
watch(() => [props.isOpen, props.kind], () => {
  if (props.isOpen) {
    ready.value = false
    clearForm()
    void load()
  }
}, { immediate: true })
</script>

<style scoped>
.entry-form { display: grid; gap: 0.75rem; margin-bottom: 1rem; }
.entry-form ion-input { min-width: 0; }
.delete-entry { justify-self: start; }
.error { color: var(--ion-color-danger); }
.restore { height: auto; min-height: 44px; white-space: normal; }
</style>
