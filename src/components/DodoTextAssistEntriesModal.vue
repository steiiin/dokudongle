<template>
  <IonModal :is-open="isOpen" :can-dismiss="!busy" :aria-label="title" @did-dismiss="emit('close')">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton :disabled="busy" @click="emit('close')" aria-label="Zurück" title="Zurück">
            <IonIcon slot="icon-only" :icon="chevronBackOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle>{{ title }}</IonTitle>
        <IonButtons slot="end">
          <IonButton :disabled="busy || !ready" @click="reset">Zurücksetzen</IonButton>
        </IonButtons>
      </IonToolbar>
      <IonProgressBar v-if="busy" type="indeterminate" aria-label="Einträge werden gespeichert oder geladen" />
    </IonHeader>
    <IonContent class="ion-padding">
      <form class="entry-form" @submit.prevent="add">
        <template v-if="kind === 'shortcuts'">
          <IonInput v-model="shortcut" label="Shortcut" label-placement="stacked" fill="solid" :disabled="busy || !ready" autocapitalize="off" :spellcheck="false" />
        </template>
        <template v-else>
          <IonInput v-model="trigger" label="Auslöser" label-placement="stacked" fill="solid" :disabled="busy || !ready" autocapitalize="off" :spellcheck="false" />
          <IonInput v-model="label" label="Bezeichnung" label-placement="stacked" fill="solid" :disabled="busy || !ready" />
        </template>
        <IonInput v-model="replacement" label="Ersetzung" label-placement="stacked" fill="solid" :disabled="busy || !ready" />
        <template v-if="kind === 'locations'">
          <IonInput v-model="keywords" label="Suchbegriffe (optional)" helper-text="Durch Komma getrennt" label-placement="stacked" fill="solid" :disabled="busy || !ready" />
          <IonInput v-model="category" label="Kategorie (optional)" label-placement="stacked" fill="solid" :disabled="busy || !ready" />
        </template>
        <IonButton type="submit" :disabled="busy || !ready || !canAdd">Hinzufügen</IonButton>
      </form>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <IonButton v-if="!ready && !busy" fill="clear" @click="load">Erneut laden</IonButton>
      <div v-if="ready && rows.length" class="table-scroll" role="region" :aria-label="title" tabindex="0">
        <table>
          <thead><tr><th v-for="heading in headings" :key="heading" scope="col">{{ heading }}</th><th scope="col">Aktion</th></tr></thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="(cell, index) in row.cells" :key="index">{{ cell }}</td>
              <td><IonButton fill="clear" color="danger" :disabled="busy" :aria-label="`${row.name} entfernen`" :title="`${row.name} entfernen`" @click="remove(row.id)"><IonIcon slot="icon-only" :icon="trashOutline" /></IonButton></td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-else-if="ready">
        <p>Noch keine {{ kind === 'shortcuts' ? 'Shortcuts' : 'Orts-Snippets' }}.</p>
        <IonButton class="restore" fill="clear" color="primary" :disabled="busy" @click="reset">{{ restoreLabel }}</IonButton>
      </template>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { chevronBackOutline, trashOutline } from 'ionicons/icons'
import { textAssistService, type TextSnippet } from '@/services/text-assist'

const props = defineProps<{ isOpen: boolean; kind: 'shortcuts' | 'locations' }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const title = computed(() => props.kind === 'shortcuts' ? 'Shortcut-Ersetzungen' : 'Orts-Snippets')
const restoreLabel = computed(() => props.kind === 'shortcuts' ? 'Standard-Shortcuts wiederherstellen' : 'Standard-Orts-Snippets wiederherstellen')
const headings = computed(() => props.kind === 'shortcuts' ? ['Shortcut', 'Ersetzung'] : ['Auslöser', 'Bezeichnung', 'Ersetzung', 'Suchbegriffe', 'Kategorie'])
const shortcuts = ref<Record<string, string>>({})
const locations = ref<TextSnippet[]>([])
const busy = ref(false)
const ready = ref(false)
const error = ref('')
const shortcut = ref('')
const trigger = ref('@')
const label = ref('')
const replacement = ref('')
const keywords = ref('')
const category = ref('')
const canAdd = computed(() => replacement.value.trim() && (props.kind === 'shortcuts' ? shortcut.value.trim() : trigger.value.trim() && label.value.trim()))
const rows = computed(() => props.kind === 'shortcuts'
  ? Object.entries(shortcuts.value).map(([key, value]) => ({ id: key, name: key, cells: [key, value] }))
  : locations.value.map(entry => ({ id: entry.id, name: entry.label, cells: [entry.trigger, entry.label, entry.replacement, (entry.keywords ?? []).join(', '), entry.category ?? ''] })))

const clearForm = () => {
  shortcut.value = label.value = replacement.value = keywords.value = category.value = ''
  trigger.value = '@'
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
const add = () => run(async () => {
  if (props.kind === 'shortcuts') await textAssistService.addShortcutReplacement(shortcut.value, replacement.value)
  else await textAssistService.addLocationSnippet({ trigger: trigger.value, label: label.value, replacement: replacement.value, keywords: keywords.value.split(','), category: category.value })
  await refresh()
  clearForm()
})
const remove = (id: string) => run(async () => {
  if (props.kind === 'shortcuts') await textAssistService.removeShortcutReplacement(id)
  else await textAssistService.removeLocationSnippet(id)
  await refresh()
})
const reset = () => run(async () => {
  if (props.kind === 'shortcuts') await textAssistService.resetShortcutReplacements()
  else await textAssistService.resetLocationSnippets()
  await refresh()
})
watch(() => props.isOpen, open => {
  if (open) {
    ready.value = false
    clearForm()
    void load()
  }
}, { immediate: true })
</script>

<style scoped>
.entry-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
.entry-form ion-input { min-width: 0; }
.entry-form ion-button { align-self: end; }
.table-scroll { max-width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 0.5rem; border-bottom: 1px solid var(--ion-color-medium); vertical-align: top; }
td { overflow-wrap: anywhere; }
td:not(:last-child) { min-width: 5rem; }
th:last-child, td:last-child { white-space: nowrap; overflow-wrap: normal; }
td ion-button { min-width: max-content; white-space: nowrap; }
.error { color: var(--ion-color-danger); }
.restore { height: auto; min-height: 44px; white-space: normal; }
@media (max-width: 480px) { .entry-form { grid-template-columns: minmax(0, 1fr); } }
</style>
