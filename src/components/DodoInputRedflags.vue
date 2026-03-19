<template>

  <IonCard class="pb-redflag-input" v-if="hasAny">
    <IonCardContent class="pb-redflag-input-content">

      <div class="chip-container" v-if="hasCases">
        <IonChip color="success" v-for="redcase in modelValue.RedCases" :key="redcase.id" @click="removeCase(redcase)">
          <IonLabel>{{ redcase.Name }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>
      <div class="chip-container" v-if="hasDiagnoses">
        <IonChip color="warning" v-for="reddiagnose in modelValue.RedDiagnoses" :key="reddiagnose.id"
          @click="removeDiagnose(reddiagnose)">
          <IonLabel>{{ reddiagnose.Name }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>
      <div class="chip-container" v-if="hasFlags">
        <IonChip color="danger" v-for="redflag in modelValue.RedFlags" :key="redflag.id" @click="removeFlag(redflag)">
          <IonLabel>{{ redflag.Name }}</IonLabel>
          <IonIcon :icon="closeCircle"></IonIcon>
        </IonChip>
      </div>

    </IonCardContent>
  </IonCard>
  <IonCard class="pb-redflag-input" style="margin-bottom:0">
    <IonCardContent class="pb-redflag-input-content pb-redflag-input-actions">
      <IonButton fill="solid" color="light" @click="showRedModal">
        <IonIcon slot="start" :icon="addCircle"></IonIcon>
        RedFlags hinzufügen
      </IonButton>
    </IonCardContent>
  </IonCard>
  <IonModal :is-open="isRedModalOpen" @did-present="focusRedSearchbar">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">RedFlags, Diagnosen & Fälle hinzufügen</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="closeRedModal">Zurück</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonSearchbar
          ref="redSearchbar"
          v-model="redModalSearch"
          placeholder="z.B. Synkope, ACS, Kopfschmerzen"></IonSearchbar>
        <template v-if="redModalSections.length > 0">
          <template v-for="section in redModalSections" :key="section.type">
            <IonItemDivider class="type-divider">
              <IonLabel>{{ section.label }}</IonLabel>
            </IonItemDivider>
            <template v-for="category in section.categories" :key="category.name">
              <IonItemDivider class="category-divider">
                <IonLabel>{{ category.name }}</IonLabel>
              </IonItemDivider>
              <IonItem v-for="entry in category.items" :key="entry.key" lines="full" button
                @click="addRedEntry(entry)">
                <IonLabel>{{ entry.name }}</IonLabel>
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

import { addCircle, closeCircle } from 'ionicons/icons';

import { getAllRedCases, getAllRedDiagnoses, getAllRedFlags, RedCase, RedDiagnose, RedFlag } from '@/data/redflags';
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags';

type InformedConsentModel = TreatmentRedflags | UnwrapRef<TreatmentRedflags>

const props = defineProps<{ modelValue: InformedConsentModel }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: InformedConsentModel): void
}>()

const allRedFlags = getAllRedFlags()
const allRedDiagnoses = getAllRedDiagnoses()
const allRedCases = getAllRedCases()

const cloneModelValue = (): InformedConsentModel => {
  const clone = Object.assign(new TreatmentRedflags(), props.modelValue)
  clone.RedFlags = [...props.modelValue.RedFlags]
  clone.RedDiagnoses = [...props.modelValue.RedDiagnoses]
  clone.RedCases = [...props.modelValue.RedCases]
  return clone
}

const hasFlags = computed(() => props.modelValue.RedFlags.length > 0)
const hasDiagnoses = computed(() => props.modelValue.RedDiagnoses.length > 0)
const hasCases = computed(() => props.modelValue.RedCases.length > 0)
const hasAny = computed(() => hasFlags.value || hasDiagnoses.value || hasCases.value)

type RedEntryType = 'case' | 'diagnose' | 'flag'

type RedEntry = {
  key: string
  id: string
  name: string
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

const isRedModalOpen = ref(false)
const redModalSearch = ref('')
const redSearchbar = ref<any | null>(null)

const focusRedSearchbar = async () => {
  setTimeout(() => { redSearchbar.value?.$el?.setFocus() }, 300)
}

const typeLabels: Record<RedEntryType, string> = {
  case: 'Fälle',
  diagnose: 'Diagnosen',
  flag: 'RedFlags'
}

const typeSortOrder: Record<RedEntryType, number> = {
  case: 1,
  diagnose: 2,
  flag: 3
}

const buildRedEntries = (): RedEntry[] => [
  ...allRedCases.map((entry) => ({
    key: `case-${entry.id}`,
    id: entry.id,
    name: entry.Name,
    groupName: entry.Group.Name,
    type: 'case' as const
  })),
  ...allRedDiagnoses.map((entry) => ({
    key: `diagnose-${entry.id}`,
    id: entry.id,
    name: entry.Name,
    groupName: entry.Group.Name,
    type: 'diagnose' as const
  })),
  ...allRedFlags.map((entry) => ({
    key: `flag-${entry.id}`,
    id: entry.id,
    name: entry.Name,
    groupName: entry.Group.Name,
    type: 'flag' as const
  }))
]

const redEntries = computed(() => buildRedEntries())

const redModalSections = computed<RedSection[]>(() => {
  const search = redModalSearch.value
  const visibleEntries = redEntries.value.filter((entry) => {
    if (entry.type === 'case' && !filterExisting(entry.id, props.modelValue.RedCases)) return false
    if (entry.type === 'diagnose' && !filterExisting(entry.id, props.modelValue.RedDiagnoses)) return false
    if (entry.type === 'flag' && !filterExisting(entry.id, props.modelValue.RedFlags)) return false
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

const showRedModal = () => {
  redModalSearch.value = ''
  isRedModalOpen.value = true
}

const closeRedModal = () => {
  isRedModalOpen.value = false
}

const addRedEntry = (entry: RedEntry) => {
  closeRedModal()
  const updated = cloneModelValue()
  if (entry.type === 'flag') {
    const flag = allRedFlags.find((item) => item.id === entry.id)
    if (flag) updated.RedFlags = [...updated.RedFlags, flag]
  }
  if (entry.type === 'diagnose') {
    const diagnose = allRedDiagnoses.find((item) => item.id === entry.id)
    if (diagnose) updated.RedDiagnoses = [...updated.RedDiagnoses, diagnose]
  }
  if (entry.type === 'case') {
    const redcase = allRedCases.find((item) => item.id === entry.id)
    if (redcase) updated.RedCases = [...updated.RedCases, redcase]
  }
  emit('update:modelValue', updated)
}

const removeFlag = (redflag: RedFlag) => {
  closeRedModal()
  const updated = cloneModelValue()
  updated.RedFlags = updated.RedFlags.filter(e => e.id !== redflag.id)
  emit('update:modelValue', updated)
}

const removeDiagnose = (diagnose: RedDiagnose) => {
  closeRedModal()
  const updated = cloneModelValue()
  updated.RedDiagnoses = updated.RedDiagnoses.filter(e => e.id !== diagnose.id)
  emit('update:modelValue', updated)
}

const removeCase = (redcase: RedCase) => {
  closeRedModal()
  const updated = cloneModelValue()
  updated.RedCases = updated.RedCases.filter(e => e.id !== redcase.id)
  emit('update:modelValue', updated)
}

// #region Filters

const filterExisting = (search: string, source: Array<RedFlag | RedCase | RedDiagnose>) => {
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
.pb-redflag-input {
  --card-bg: transparent;
  margin: 0;
}
.pb-redflag-input-content {
  padding: 0;
  margin: .25rem;
}

.chip-container {
  padding: .5rem;
}

.pb-redflag-input-actions {
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
