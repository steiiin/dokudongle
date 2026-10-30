<template>

  <IonCard class="dodo-redflag-input" v-if="hasAny">
    <IonCardContent class="dodo-redflag-input-content">
      <div class="chip-container" v-if="hasScenarios">
        <div class="chip-container-label">Szenarien</div>
        <IonChip color="success" v-for="scenario in modelValue.choosenScenarios" :key="`legacy-${scenario.id}`" @click="removeLegacyScenario(scenario.id)">
          <IonLabel>{{ scenario.name }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
        <div v-for="(group, index) in selectedGroups" :key="index" class="selected-scenario">
          <IonChip color="success" class="scenario-chip" @click="removeScenario(index)">
            <IonLabel>{{ group.name }}{{ group.allSubscenarios ? ' (alle Unterfälle)' : '' }}</IonLabel>
            <IonIcon :icon="closeCircle" />
          </IonChip>
          <div v-if="group.children.length" class="subscenario-chips">
            <DodoToggleChip v-for="child in group.children" :key="child.id" color="success"
              class="subscenario-chip" :model-value="child.active" :disabled="!!group.error"
              role="button" :tabindex="group.error ? -1 : 0" :aria-pressed="child.active"
              :aria-label="child.name"
              @update:model-value="setSubscenarioActive(index, child.id, $event)"
              @keydown.enter.prevent="setSubscenarioActive(index, child.id, !child.active)"
              @keydown.space.prevent="setSubscenarioActive(index, child.id, !child.active)">
              <IonLabel>{{ child.name }}</IonLabel>
              <IonIcon v-if="child.active" :icon="checkmark" aria-hidden="true" />
            </DodoToggleChip>
          </div>
          <IonChip v-for="child in group.invalidChildren" :key="child.id" color="danger"
            class="invalid-subscenario-chip" @click="removeInvalidSubscenario(index, child.id)">
            <IonLabel>{{ child.name }}</IonLabel>
            <IonIcon :icon="closeCircle" />
          </IonChip>
          <p v-if="group.error" role="alert" class="selection-error">{{ group.error }}</p>
          <div v-if="group.requirements.length" class="scenario-requirements">
            <div>Voraussetzungen / Abgrenzung der einbezogenen Szenarien:</div>
            <p v-for="requirement in group.requirements" :key="requirement">{{ requirement }}</p>
          </div>
        </div>
      </div>
      <div class="chip-container" v-if="hasMajorSignals">
        <div class="chip-container-label">Redflags (dringlich)</div>
        <IonChip color="danger" v-for="signal in visibleMajorSignals" :key="signal.key" @click="removeRedflag(signal)">
          <IonLabel>{{ signal.text }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>
      <template v-if="hasMinorSignals">
        <div class="chip-container" v-show="!modelValue.disableMinorBlock">
          <div class="chip-container-label">Redflags (nichtdringlich)</div>
          <IonChip color="warning" v-for="signal in visibleMinorSignals" :key="signal.key" @click="removeRedflag(signal)">
            <IonLabel>{{ signal.text }}</IonLabel>
            <IonIcon :icon="closeCircle"></IonIcon>
          </IonChip>
        </div>
      </template>
      <IonItem v-if="hasScenarios" lines="full" class="minor-block-toggle">
        <IonCheckbox justify="space-between" label-placement="start"
          :checked="modelValue.disableMinorBlock"
          @ionChange="setDisableMinorBlock($event.detail.checked)">
          Nichtdringliche Redflags weglassen
        </IonCheckbox>
      </IonItem>
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
  <IonModal :is-open="isModalOpen" @did-present="focusRedSearchbar" @will-dismiss="closeModal">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton @click="closeModal" aria-label="Abbrechen" title="Abbrechen">
            <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle type="ios">RedFlag-Szenarien & Warnzeichen hinzufügen</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <p v-if="selectionError" role="alert" class="selection-error">{{ selectionError }}</p>
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
import { closeOutline, addCircle, closeCircle, checkmark } from 'ionicons/icons'
import { DATA_Redflags, DATA_Scenarios, DATA_Signals, DATA_Subscenarios } from '@/data/redflags'
import type { RedflagApplication } from '@/types/redflags'
import { selectRedflagTarget } from '@/utils/redflags'
import { TreatmentRedflags, type VisibleRedflag } from '@/types/protocol/treatment/treatmentRedflags'

type TreatmentRedflagsModel = TreatmentRedflags | UnwrapRef<TreatmentRedflags>
const props = defineProps<{ modelValue: TreatmentRedflagsModel }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: TreatmentRedflagsModel): void
}>()

const cloneModelValue = (): TreatmentRedflags => Object.assign(new TreatmentRedflags(), props.modelValue)
const content = computed(() => props.modelValue.getResolvedContent())
const selectedGroups = computed(() => content.value.resolutions.map(({ selection, resolved, error }) => {
  const scenario = DATA_Scenarios.find(entry => entry.id === selection?.scenarioId)
  const subIds = Array.isArray(selection?.subscenarioIds) ? selection.subscenarioIds : []
  const children = DATA_Subscenarios.filter(entry => entry.parentId === scenario?.id)
    .map(entry => ({ id: entry.id, name: entry.name, active: resolved?.includedSubscenarioIds.includes(entry.id) ?? false }))
  return {
    name: scenario?.name ?? selection?.scenarioId ?? 'Ungültige Auswahl',
    allSubscenarios: children.length > 0 && children.every(child => child.active),
    children,
    invalidChildren: [...new Set(subIds)].filter(id => !children.some(child => child.id === id))
      .map(id => ({ id, name: DATA_Subscenarios.find(entry => entry.id === id)?.name ?? id })),
    requirements: resolved?.requirements ?? [],
    error,
  }
}))
const hasScenarios = computed(() => props.modelValue.choosenScenarios.length > 0 || selectedGroups.value.length > 0)
const visibleMajorSignals = computed(() => content.value.majorSignals)
const visibleMinorSignals = computed(() => content.value.minorSignals)
const hasMajorSignals = computed(() => visibleMajorSignals.value.length > 0)
const hasMinorSignals = computed(() => visibleMinorSignals.value.length > 0)
const hasAny = computed(() => hasScenarios.value || hasMajorSignals.value || hasMinorSignals.value)

type RedEntryType = 'scenario' | 'signal'
type RedEntry = {
  key: string
  id: string
  name: string
  subtitle: string
  groupName: string
  type: 'scenario' | 'subscenario' | 'signal'
  parentId?: string
  application?: RedflagApplication
}

const isModalOpen = ref(false)
const currentSearchQuery = ref('')
const currentFilter = ref<RedEntryType>('scenario')
const selectionError = ref('')
const redSearchbar = ref<{ $el?: { setFocus: () => void } } | null>(null)
const focusRedSearchbar = () => {
  setTimeout(() => { redSearchbar.value?.$el?.setFocus() }, 300)
}

const entries: RedEntry[] = [
  ...DATA_Scenarios.map(entry => ({
    key: `scenario-${entry.id}`, id: entry.id, name: entry.name,
    subtitle: entry.requirements, groupName: entry.category,
    type: 'scenario' as const, application: entry.application,
  })),
  ...DATA_Subscenarios.map(entry => {
    const parent = DATA_Scenarios.find(scenario => scenario.id === entry.parentId)!
    return {
      key: `subscenario-${entry.id}`, id: entry.id, name: entry.name,
      subtitle: `Unterfall von ${parent.name}${entry.requirements ? ' · ' + entry.requirements : ''}`,
      groupName: parent.category, type: 'subscenario' as const,
      parentId: parent.id, application: parent.application,
    }
  }),
  ...DATA_Signals.map(entry => ({
    key: `signal-${entry.id}`, id: entry.id, name: entry.text,
    subtitle: '', groupName: '', type: 'signal' as const,
  })),
]

const currentModalSections = computed(() => {
  const application: RedflagApplication = props.modelValue.noTransportType === 'BvO' ? 'BvO' : 'Verweigerung'
  const visible = entries.filter(entry => {
    if (entry.type === 'signal') {
      if (currentFilter.value !== 'signal' || props.modelValue.choosenSignals.some(signal => signal.id === entry.id)) return false
    } else {
      if (currentFilter.value !== 'scenario' || entry.application !== application) return false
      const selected = content.value.resolutions.find(({ selection }) => selection?.scenarioId === (entry.parentId ?? entry.id))?.resolved
      if (entry.type === 'scenario' && selected?.aggregationMode === 'all-subscenarios') return false
      if (entry.type === 'subscenario' && selected?.aggregationMode === 'selected-subscenarios'
        && selected.includedSubscenarioIds.includes(entry.id)) return false
    }
    return fuzzyMatch(currentSearchQuery.value, `${entry.name} ${entry.groupName} ${entry.subtitle}`)
  })
  if (!visible.length) return []
  const categories = new Map<string, RedEntry[]>()
  for (const entry of visible) {
    const items = categories.get(entry.groupName) ?? []
    items.push(entry)
    categories.set(entry.groupName, items)
  }
  return [{
    type: currentFilter.value,
    categories: [...categories].sort(([a], [b]) => a.localeCompare(b, 'de'))
      .map(([name, items]) => ({ name, items: items.sort((a, b) => a.name.localeCompare(b.name, 'de')) })),
  }]
})

const showModal = () => {
  currentSearchQuery.value = ''
  selectionError.value = ''
  isModalOpen.value = true
}
const closeModal = () => { isModalOpen.value = false }
const addEntry = (entry: RedEntry) => {
  const updated = cloneModelValue()
  if (entry.type === 'signal') {
    const signal = DATA_Signals.find(item => item.id === entry.id)!
    updated.choosenSignals = [...updated.choosenSignals.filter(item => item.id !== signal.id), signal]
    updated.removedMajorSignalIds = updated.removedMajorSignalIds.filter(id => id !== signal.id)
    updated.removedMinorSignalIds = updated.removedMinorSignalIds.filter(id => id !== signal.id)
    updated.removedMajorSignals = updated.removedMajorSignals.filter(text => text !== signal.text)
    updated.removedMinorSignals = updated.removedMinorSignals.filter(text => text !== signal.text)
  } else {
    try {
      updated.scenarioSelections = selectRedflagTarget(DATA_Redflags, updated.scenarioSelections, { type: entry.type, id: entry.id })
    } catch (error) {
      selectionError.value = error instanceof Error ? error.message : 'Ungültige RedFlags-Auswahl'
      return
    }
  }
  selectionError.value = ''
  closeModal()
  emit('update:modelValue', updated)
}
const removeRedflag = (signal: VisibleRedflag) => {
  const updated = cloneModelValue()
  updated.removeVisibleSignal(signal)
  emit('update:modelValue', updated)
}
const removeLegacyScenario = (id: string) => {
  const updated = cloneModelValue()
  updated.choosenScenarios = updated.choosenScenarios.filter(entry => entry.id !== id)
  emit('update:modelValue', updated)
}
const removeScenario = (index: number) => {
  const updated = cloneModelValue()
  updated.scenarioSelections = updated.scenarioSelections.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}
const setSubscenarioActive = (index: number, id: string, active: boolean) => {
  const group = selectedGroups.value[index]
  if (!group || group.error || !group.children.some(child => child.id === id)) return
  const updated = cloneModelValue()
  const subscenarioIds = group.children.filter(child => child.id === id ? active : child.active).map(child => child.id)
  updated.scenarioSelections = updated.scenarioSelections.map((selection, i) => i !== index ? selection
    : { ...selection, subscenarioMode: 'selected', subscenarioIds })
  emit('update:modelValue', updated)
}
const removeInvalidSubscenario = (index: number, id: string) => {
  const updated = cloneModelValue()
  updated.scenarioSelections = updated.scenarioSelections.map((selection, i) => i !== index ? selection
    : { ...selection, subscenarioMode: 'selected', subscenarioIds: selection.subscenarioIds.filter(childId => childId !== id) })
  emit('update:modelValue', updated)
}
const setDisableMinorBlock = (checked: boolean) => {
  const updated = cloneModelValue()
  updated.disableMinorBlock = checked
  emit('update:modelValue', updated)
}

const fuzzyMatch = (search: string, target: string): boolean => {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return true
  const normalizedTarget = target.toLowerCase()
  if (normalizedTarget.includes(normalizedSearch)) return true
  let searchIndex = 0
  for (let i = 0; i < normalizedTarget.length; i += 1) {
    if (normalizedTarget[i] === normalizedSearch[searchIndex]) searchIndex += 1
    if (searchIndex === normalizedSearch.length) return true
  }
  return false
}
</script>

<style scoped>

  .dodo-redflag-input {
    --card-bg: transparent;
    margin: 0;
  }
  .dodo-redflag-input-content {
    padding: 0;
    margin: 4px;
  }

  .chip-container {
    padding: .5rem;
  }

  .chip-container-label {
    color: var(--ion-color-medium);
    font-size: .75rem;
    font-weight: 600;
    letter-spacing: .04em;
    margin: 0 0 4px 0;
    text-transform: uppercase;
  }

  .minor-block-toggle {
    --padding-start: .75rem;
    --inner-padding-end: .75rem;
  }

  .scenario-requirements {
    margin: 4px 8px 12px;
    color: var(--ion-color-medium);
    font-size: .8rem;
  }

  .subscenario-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 4px 8px;
  }

  .subscenario-chip {
    max-width: 100%;
    min-width: 0;
    min-height: 32px;
    height: auto;
    margin: 0;
    white-space: normal;
  }

  .subscenario-chip ion-label {
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .subscenario-chip ion-icon {
    flex-shrink: 0;
  }

  .subscenario-chip.DdToggleChip--inactive {
    color: var(--ion-text-color);
  }

  .subscenario-chip:focus-visible {
    outline: 2px solid var(--ion-color-success);
    outline-offset: 2px;
  }

  .selection-error {
    color: var(--ion-color-danger);
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
