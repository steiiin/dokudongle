<template>

  <IonCard class="dodo-redflag-input" v-if="hasAny">
    <IonCardContent class="dodo-redflag-input-content">
      <div class="chip-container" v-if="hasScenarios">
        <IonChip color="success" v-for="scenario in modelValue.choosenScenarios" :key="scenario.id" @click="removeScenario(scenario)">
          <IonLabel>{{ scenario.name }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>
      <div class="chip-container" v-if="hasSignals">
        <IonChip color="danger" v-for="signal in modelValue.choosenSignals" :key="signal.id" @click="removeSignal(signal)">
          <IonLabel>{{ signal.text }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>
    </IonCardContent>
  </IonCard>
  <IonCard class="dodo-redflag-input" style="margin-bottom:0">
    <IonCardContent class="dodo-redflag-input-content dodo-redflag-input-actions">
      <IonButton fill="solid" color="light" @click="showModal" >
        <IonIcon slot="start" :icon="addCircle"></IonIcon>
        RedFlags hinzufügen
      </IonButton>
    </IonCardContent>
  </IonCard>
  <IonModal :is-open="isModalOpen" @did-present="focusRedSearchbar" @did-dismiss="closeModal">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">RedFlag-Szenarien & Warnzeichen hinzufügen</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="closeModal">Zurück</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonSearchbar v-model="currentSearchQuery"
          ref="redSearchbar" placeholder="z.B. Synkope, ACS, Kopfschmerzen">
        </IonSearchbar>
        <DodoToggleGroup v-model="currentFilter" style="margin:0 8px 8px 8px">
          <DodoToggleButton value="scenario">Szenarien</DodoToggleButton>
          <DodoToggleButton value="signal">Redflags</DodoToggleButton>
        </DodoToggleGroup>
        <template v-if="currentModalSections.length > 0">
          <template v-for="section in currentModalSections" :key="section.type">
            <template v-for="category in section.categories" :key="category.name">
              <IonItemDivider class="category-divider">
                <IonLabel>{{ category.name }}</IonLabel>
              </IonItemDivider>
              <IonItem v-for="entry in category.items" :key="entry.key" lines="full" button
                @click="addEntry(entry)">
                <IonLabel>
                  <h3>{{ entry.name }}</h3>
                  <p v-if="entry.subtitle">{{ entry.subtitle }}</p>
                </IonLabel>
              </IonItem>
            </template>
          </template>
        </template>
        <IonItemDivider v-else>
          <IonLabel>Keine Ergebnisse gefunden</IonLabel>
        </IonItemDivider>
      </IonList>
    </IonContent>
  </IonModal>

</template>

<script setup lang="ts">


import { computed, ref } from 'vue'
import type { UnwrapRef } from 'vue'

import { addCircle, closeCircle } from 'ionicons/icons'

import { RedflagApplication, RedflagScenario, RedflagSignal, DATA_Scenarios, DATA_Signals } from '@/data/redflags'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'

type TreatmentRedflagsModel = TreatmentRedflags | UnwrapRef<TreatmentRedflags>

const props = defineProps<{ modelValue: TreatmentRedflagsModel }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: TreatmentRedflagsModel): void
}>()

const allScenarios = DATA_Scenarios
const allSignals = DATA_Signals

const cloneModelValue = (): TreatmentRedflagsModel => {
  const clone = Object.assign(new TreatmentRedflags(), props.modelValue)
  clone.choosenScenarios = [...props.modelValue.choosenScenarios]
  clone.choosenSignals = [...props.modelValue.choosenSignals]
  return clone
}

const hasScenarios = computed(() => props.modelValue.choosenScenarios.length > 0)
const hasSignals = computed(() => props.modelValue.choosenSignals.length > 0)
const hasAny = computed(() => hasScenarios.value || hasSignals.value)

type RedEntryType = 'scenario' | 'signal'

type RedEntry = {
  key: string
  id: string
  name: string
  subtitle: string
  groupName: string
  type: RedEntryType
}

type RedSectionCategory = {
  name: string
  items: RedEntry[]
}

type RedSection = {
  type: RedEntryType
  label: string
  categories: RedSectionCategory[]
}

const isModalOpen = ref(false)
const currentSearchQuery = ref('')
const currentFilter = ref<RedEntryType>('scenario')
const redSearchbar = ref<any | null>(null)

const focusRedSearchbar = async () => {
  setTimeout(() => { redSearchbar.value?.$el?.setFocus() }, 300)
}

const typeLabels: Record<RedEntryType, string> = {
  scenario: 'Szenarien',
  signal: 'Warnzeichen'
}

const typeSortOrder: Record<RedEntryType, number> = {
  scenario: 1,
  signal: 2
}

const buildEntries = (): RedEntry[] => [
  ...allScenarios.map((entry) => ({
    key: `scenario-${entry.id}`,
    id: entry.id,
    name: entry.name,
    subtitle: entry.requirements,
    groupName: entry.category,
    type: 'scenario' as const,
  })),
  ...allSignals.map((entry) => ({
    key: `signal-${entry.id}`,
    id: entry.id,
    name: entry.text,
    subtitle: '',
    groupName: '',
    type: 'signal' as const,
  }))
]

const currentEntries = computed(() => buildEntries())
const currentModalSections = computed<RedSection[]>(() => {

  const currentApplication: RedflagApplication = props.modelValue.noTransportType === 'BvO' ? 'BvO' : 'Verweigerung'
  const search = currentSearchQuery.value
  const visibleEntries = currentEntries.value.filter((entry) => {
    if (entry.type === 'scenario') {
      if (currentFilter.value != 'scenario') { return false }
      const scenario = allScenarios.find((candidate) => candidate.id === entry.id)
      if (!scenario || scenario.application !== currentApplication) { return false }
      if (!filterExisting(entry.id, props.modelValue.choosenScenarios)) { return false }
    }
    if (entry.type === 'signal') {
      if (currentFilter.value != 'signal') { return false }
      if (!filterExisting(entry.id, props.modelValue.choosenSignals)) { return false }
    }

    return fuzzyMatch(search, `${entry.name} ${entry.groupName}`)
  })

  const grouped = new Map<RedEntryType, Map<string, RedEntry[]>>()
  visibleEntries.forEach((entry) => {
    if (!grouped.has(entry.type)) grouped.set(entry.type, new Map())
    const typeGroup = grouped.get(entry.type) as Map<string, RedEntry[]>
    if (!typeGroup.has(entry.groupName)) typeGroup.set(entry.groupName, [])
    typeGroup.get(entry.groupName)?.push(entry)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => typeSortOrder[a[0]] - typeSortOrder[b[0]])
    .map(([type, categories]) => ({
      type,
      label: typeLabels[type],
      categories: Array.from(categories.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, items]) => ({
          name,
          items: items.sort((a, b) => a.name.localeCompare(b.name))
        }))
    }))
})

const showModal = () => {
  currentSearchQuery.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const addEntry = (entry: RedEntry) => {
  closeModal()
  const updated = cloneModelValue()
  if (entry.type === 'scenario') {
    const scenario = allScenarios.find((item) => item.id === entry.id)
    if (scenario) updated.choosenScenarios = [...updated.choosenScenarios, scenario]
  }
  if (entry.type === 'signal') {
    const signal = allSignals.find((item) => item.id === entry.id)
    if (signal) updated.choosenSignals = [...updated.choosenSignals, signal]
  }
  emit('update:modelValue', updated)
}

const removeSignal = (signal: RedflagSignal) => {
  closeModal()
  const updated = cloneModelValue()
  updated.choosenSignals = updated.choosenSignals.filter(e => e.id !== signal.id)
  emit('update:modelValue', updated)
}

const removeScenario = (scenario: RedflagScenario) => {
  closeModal()
  const updated = cloneModelValue()
  updated.choosenScenarios = updated.choosenScenarios.filter(e => e.id !== scenario.id)
  emit('update:modelValue', updated)
}

// #region Filters

const filterExisting = (search: string, source: Array<{ id: string }>) => {
  return !source.some(i => i.id === search)
}

const fuzzyMatch = (search: string, target: string): boolean => {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return true
  const normalizedTarget = target.toLowerCase()
  if (normalizedTarget.includes(normalizedSearch)) return true
  let searchIndex = 0
  for (let i = 0; i < normalizedTarget.length; i += 1) {
    if (normalizedTarget[i] === normalizedSearch[searchIndex]) {
      searchIndex += 1
    }
    if (searchIndex === normalizedSearch.length) return true
  }
  return false
}

// #endregion

</script>

<style scoped>

  .dodo-redflag-input {
    --card-bg: transparent;
    margin: 0;
  }
  .dodo-redflag-input-content {
    padding: 0;
    margin: .25rem;
  }

  .chip-container {
    padding: .5rem;
  }

  .dodo-redflag-input-actions {
    display: flex;
    justify-content: flex-start;
  }

  .type-divider {
    --background: var(--ion-color-primary-contrast);
    --color: var(--ion-color-secondary);
    font-size: 1.2em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .category-divider {
    --background: var(--ion-background-color, #fff);
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

</style>
