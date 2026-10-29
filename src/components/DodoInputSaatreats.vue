<template>
  <div class="dodo-saatreats-input">
    <IonList v-if="selectedChips.length">
      <IonReorderGroup :disabled="false" @ionItemReorder="handleReorder">
        <IonItem v-for="chip in selectedChips" :key="chip.id" lines="none" button @click="openModal">
          <IonLabel>
            <h3>{{ chip.label }}</h3>
          </IonLabel>
          <IonReorder slot="end" />
        </IonItem>
      </IonReorderGroup>
    </IonList>
    <IonButton expand="block" fill="solid" color="light" @click="openModal">
      <IonIcon slot="start" :icon="addCircle" aria-hidden="true" />
      Invasives hinzufügen
    </IonButton>
  </div>

  <IonModal :is-open="isOpen" @did-present="gainFocus(searchbar)" @will-dismiss="closeModal">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton @click="closeModal" aria-label="Abbrechen" title="Abbrechen">
            <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle type="ios">Invasive Maßnahmen</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="save" color="success">Speichern</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonSearchbar ref="searchbar" v-model="searchQuery" placeholder="Maßnahme suchen" />
      <IonList>
        <template v-for="group in visibleGroups" :key="group.id">
          <IonItemDivider>
            <IonLabel class="saatreats-group">{{ group.name }}</IonLabel>
          </IonItemDivider>
          <div class="dodo-saatreats-chips">
            <button v-for="chip in group.chips" :key="chip.id"
              type="button" class="dodo-saatreats-chip"
              :aria-pressed="draftIds.has(chip.id)" @click="toggleChip(chip.id)">
              <IonIcon v-if="draftIds.has(chip.id)" :icon="checkmark" aria-hidden="true" />
              {{ chip.label }}
            </button>
          </div>
        </template>
      </IonList>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ItemReorderEventDetail } from '@ionic/core'
import { addCircle, checkmark, closeOutline } from 'ionicons/icons'
import { DATA_Saatreats, selectedSaatreatChips } from '@/data/lists/saatreats'
import { gainFocus } from '@/utils/input'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const isOpen = ref(false)
const searchQuery = ref('')
const searchbar = ref(null)
const draftIds = ref(new Set<string>())
const selectedChips = computed(() => selectedSaatreatChips(props.modelValue))

const handleReorder = (event: CustomEvent<ItemReorderEventDetail>) => {
  const updated = event.detail.complete(selectedChips.value.map(chip => chip.id)) as string[]
  if (updated) emit('update:modelValue', updated)
}

const fuzzyMatch = (search: string, target: string): boolean => {
  const query = search.trim().toLowerCase()
  let index = 0
  for (const character of target.toLowerCase()) {
    if (character === query[index]) index += 1
    if (index === query.length) return true
  }
  return index === query.length
}

const visibleGroups = computed(() => DATA_Saatreats.map(group => ({
  ...group,
  chips: group.chips.filter(chip => {
    const excluded = chip.exclusiveGroupId && group.chips.some(other => (
      other.id !== chip.id && other.exclusiveGroupId === chip.exclusiveGroupId && draftIds.value.has(other.id)
    ))
    return (!excluded || draftIds.value.has(chip.id))
      && fuzzyMatch(searchQuery.value, `${group.name} ${chip.label}`)
  }),
})).filter(group => group.chips.length))

const openModal = () => {
  draftIds.value = new Set(props.modelValue)
  searchQuery.value = ''
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  draftIds.value = new Set()
  searchQuery.value = ''
}

const toggleChip = (id: string) => {
  if (!visibleGroups.value.some(group => group.chips.some(chip => chip.id === id))) return
  if (draftIds.value.has(id)) draftIds.value.delete(id)
  else draftIds.value.add(id)
}

const save = () => {
  emit('update:modelValue', selectedSaatreatChips([...draftIds.value]).map(chip => chip.id))
  closeModal()
}
</script>

<style scoped>
.dodo-saatreats-input {
  margin: 4px;
}
.dodo-saatreats-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .5rem 1rem 1rem;
}
.dodo-saatreats-chip {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  max-width: 100%;
  min-height: 2rem;
  padding: .4rem .75rem;
  border: 1px solid var(--ion-background-color);
  border-radius: 1.5rem;
  background: var(--ion-background-color);
  color: var(--ion-text-color, #000);
  font: inherit;
  font-size: .875rem;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.dodo-saatreats-chip[aria-pressed="true"] {
  background: var(--ion-text-color, #000);
  border-color: var(--ion-text-color, #000);
  color: var(--ion-background-color, #fff);
}
.dodo-saatreats-chip ion-icon {
  flex-shrink: 0;
}
.dodo-saatreats-chip:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: -2px;
}
.saatreats-group {
  color: var(--ion-color-secondary);
  font-size: 1.2em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

ion-modal ion-list {
  padding-bottom: 0;
}

</style>
