<template>

  <div class="dodo-saamed-input">
    <IonList v-if="modelValue.length > 0">
      <IonReorderGroup :disabled="false" @ionItemReorder="handleReorder">
        <IonItem v-for="(item, index) in modelValue"
          :key="`${item.MedId}-${item.MedIndication}-${index}`"
          @click="editItem(index)" lines="none" button>
          <IonLabel>
            <h3>{{ getMedName(item) }}</h3>
            <p>{{ getIndicationName(item) }}</p>
          </IonLabel>
          <IonReorder slot="end" />
        </IonItem>
      </IonReorderGroup>
    </IonList>
    <IonButton expand="block" fill="solid" color="light" @click="openSelectModal">
      <IonIcon slot="start" :icon="addCircle"></IonIcon>
        Medikament hinzufügen
    </IonButton>
  </div>

  <IonModal :is-open="isSelectModalOpen" @did-present="gainFocus(selectSearchbar)" @will-dismiss="closeSelectModal">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton @click="closeSelectModal" aria-label="Abbrechen" title="Abbrechen">
            <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle type="ios">Medikament auswählen</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonSearchbar v-model="searchQuery"
        ref="selectSearchbar" placeholder="Medikament suchen">
      </IonSearchbar>
      <IonList>
        <template v-for="group in groupedOptions" :key="group.indicationId">
          <IonItemDivider>
            <IonLabel class="saamed-indication">{{ group.indication.name }}</IonLabel>
          </IonItemDivider>
          <IonItem v-for="option in group.options" :key="`${group.indicationId}-${option.med.id}`"
            lines="none" button
            @click="selectOption(option)">
            <IonLabel>{{ option.med.Name }}</IonLabel>
          </IonItem>
        </template>
      </IonList>
    </IonContent>
  </IonModal>

  <IonModal :is-open="isEditModalOpen" @did-present="focusEmptyDosage" @will-dismiss="cancelEdit">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton @click="cancelEdit" aria-label="Abbrechen" title="Abbrechen">
            <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle type="ios">{{ modalTitle }}</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="saveItem" color="success" :disabled="!currentOption">Speichern</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItemDivider>
          <IonLabel>Indikation</IonLabel>
        </IonItemDivider>
        <IonItem lines="none">
          <IonLabel>{{ currentOptionLabel }}</IonLabel>
        </IonItem>

        <IonItemDivider>
          <IonLabel>Dosierung</IonLabel>
        </IonItemDivider>
        <IonItem lines="none">
          <DodoInputText v-model="currentTask.dosageText"
            ref="dosageInput"
            label="Dosierung" :placeholder="currentOption?.indication.dosageHint">
          </DodoInputText>
        </IonItem>

        <div v-if="visibleDosageChips.length > 0" class="dodo-saamed-dosage-chips">
          <IonChip v-for="chip in visibleDosageChips" :key="chip.id" :color="chip.color"
            role="button" tabindex="0" @click="appendDosageChip(chip)"
            @keydown.enter.prevent="appendDosageChip(chip)"
            @keydown.space.prevent="appendDosageChip(chip)">
            {{ chip.text }}
          </IonChip>
        </div>

        <template v-if="requiresContraCheck">
          <IonItemDivider>
            <IonLabel>Kontraindikationen</IonLabel>
          </IonItemDivider>
          <DodoInputToggle lines="none" v-model="currentTask.contraOk">
            {{ currentTask.contraOk ? 'Kontraindikationen ausgeschlossen?' : 'Relative Kontraindikationen' }}
          </DodoInputToggle>
          <IonItem v-if="currentTask.contraOk === false" lines="none">
            <DodoInputText v-model="currentTask.contraText"
              label="Warum trotzdem?" :placeholder="currentOption?.indication.contraReason ?? 'Begründung eingeben …'">
            </DodoInputText>
          </IonItem>
        </template>

      </IonList>

      <IonButton @click="deleteItem" v-if="!currentNew"
        expand="block" fill="outline" color="danger" style="margin: 1rem;">Entfernen
      </IonButton>
    </IonContent>
  </IonModal>

</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { closeOutline, addCircle } from 'ionicons/icons'

import type { ItemReorderEventDetail } from '@ionic/core'
import { DATA_SaamedOptions } from '@/data/lists/saamed'
import { ConsentMedTask } from '@/types/lists/saamed'
import type { ConsentMedOption } from '@/types/lists/saamed'
import { gainFocus } from '@/utils/input';

// ############################################################################

const props = defineProps<{ modelValue: Array<ConsentMedTask> }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<ConsentMedTask>): void
}>()

// ############################################################################

const isSelectModalOpen = ref(false)
const isEditModalOpen = ref(false)

const searchQuery = ref('')
const selectSearchbar = ref<any | null>(null)

// ############################################################################

const isSelectedOption = (option: ConsentMedOption): boolean => {
  return props.modelValue.some((task) => (
    task.MedId === option.med.id && task.MedIndication === option.indicationId
  ))
}

const groupedOptions = computed(() => {
  const search = searchQuery.value
  const options = DATA_SaamedOptions().filter((option) => (
    !isSelectedOption(option) && fuzzyMatch(
      search,
      `${option.med.Name} ${option.med.alternativeName ?? ''}`
    )
  ))
  const groups = new Map<string, { indicationId: ConsentMedOption['indicationId'], indication: ConsentMedOption['indication'], options: Array<ConsentMedOption> }>()
  for (const option of options) {
    if (!groups.has(option.indicationId)) {
      groups.set(option.indicationId, { indicationId: option.indicationId, indication: option.indication, options: [] })
    }
    groups.get(option.indicationId)?.options.push(option)
  }
  return Array.from(groups.values())
})

const modalTitle = computed(() => {
  if (!currentOption.value) {
    return 'Medikament'
  }
  return currentOption.value.med.Name
})

const currentOptionLabel = computed(() => {
  if (!currentOption.value) {
    return ''
  }
  return `${currentOption.value.indication.name} · ${currentOption.value.med.Name}`
})

const requiresContraCheck = computed(() => {
  if (!currentOption.value) {
    return false
  }
  return currentOption.value.indication.requiresContracheck
})

// ############################################################################

const openSelectModal = () => {
  searchQuery.value = ''
  isSelectModalOpen.value = true
}

const closeSelectModal = () => {
  isSelectModalOpen.value = false
}

// ############################################################################

const currentNew = ref(false)
const dosageInput = ref<{ setFocus: () => void } | null>(null)
const currentTask = ref<ConsentMedTask>(new ConsentMedTask('', '', '', true, '', ''))
const currentIndex = ref<number>(-1)
const currentOption = ref<ConsentMedOption | null>(null)
type DosageChip = { id: string, groupIndex: number, text: string, color: string }
const dosageChipPalette = ['primary', 'tertiary', 'success', 'warning', 'secondary']
const usedDosageGroups = ref(new Set<number>())
const dosageChipsLocked = ref(false)
watch(() => currentTask.value.dosageText, (dosage) => {
  if (!dosage.trim()) dosageChipsLocked.value = false
})
const visibleDosageChips = computed(() => (
  dosageChipsLocked.value ? [] : currentOption.value?.indication.dosageChips ?? []
).flatMap((entry, groupIndex): DosageChip[] => {
  if (usedDosageGroups.value.has(groupIndex)) return []
  return (Array.isArray(entry) ? entry : [entry]).map((text, chipIndex) => ({
    id: `${groupIndex}-${chipIndex}`,
    groupIndex,
    text,
    color: dosageChipPalette[groupIndex % dosageChipPalette.length],
  }))
}))

const focusEmptyDosage = () => {
  if (currentNew.value && !currentTask.value.dosageText.trim()) {
    dosageInput.value?.setFocus()
  }
}

const appendDosageChip = (chip: DosageChip) => {
  if (!visibleDosageChips.value.some(visibleChip => visibleChip.id === chip.id)) return
  const dosage = currentTask.value.dosageText.trimEnd()
  currentTask.value.dosageText = dosage ? `${dosage} ${chip.text}` : chip.text
  usedDosageGroups.value.add(chip.groupIndex)
}

const selectOption = (option: ConsentMedOption) => {
  closeSelectModal()
  startNewTask(option)
}

const startNewTask = (option: ConsentMedOption) => {
  dosageChipsLocked.value = false
  currentNew.value = true
  currentIndex.value = -1
  currentOption.value = option
  usedDosageGroups.value = new Set()
  currentTask.value = new ConsentMedTask(
    option.med.id,
    option.indicationId,
    '',
    true,
    '',
    ''
  )
  isEditModalOpen.value = true
}

const editItem = (index: number) => {
  const task = props.modelValue[index]
  const option = findOption(task.MedId, task.MedIndication)
  if (!option) {
    return
  }
  currentNew.value = false
  currentIndex.value = index
  currentOption.value = option
  usedDosageGroups.value = new Set()
  dosageChipsLocked.value = Boolean(task.dosageText.trim())
  currentTask.value = new ConsentMedTask(
    task.MedId,
    task.MedIndication,
    task.dosageText,
    task.contraOk,
    task.contraText ?? '',
    task.noteText ?? ''
  )
  isEditModalOpen.value = true
}

const cancelEdit = () => {
  currentNew.value = false
  currentIndex.value = -1
  currentOption.value = null
  usedDosageGroups.value = new Set()
  dosageChipsLocked.value = false
  currentTask.value = new ConsentMedTask('', '', '', false, '', '')
  isEditModalOpen.value = false
}

const saveItem = () => {
  if (!currentOption.value) {
    return
  }

  if (currentNew.value) {
    emit('update:modelValue', [...props.modelValue, currentTask.value])
  } else {
    const updated = [...props.modelValue]
    updated[currentIndex.value] = currentTask.value
    emit('update:modelValue', updated)
  }
  isEditModalOpen.value = false
}

const deleteItem = () => {
  const updated = [...props.modelValue]
  updated.splice(currentIndex.value, 1)
  emit('update:modelValue', updated)
  isEditModalOpen.value = false
}

// ############################################################################

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

const findOption = (medId: string, indicationId: string): ConsentMedOption | null => {
  return DATA_SaamedOptions().find(option => option.med.id === medId && option.indicationId === indicationId) ?? null
}

const getMedName = (task: ConsentMedTask): string => {
  return findOption(task.MedId, task.MedIndication)?.med.Name ?? task.MedId
}

const getIndicationName = (task: ConsentMedTask): string => {
  return findOption(task.MedId, task.MedIndication)?.indication.name ?? task.MedIndication
}

const handleReorder = (event: CustomEvent<ItemReorderEventDetail>) => {
  const updated = event.detail.complete([...props.modelValue]) as Array<ConsentMedTask>
  if (updated) {
    emit('update:modelValue', updated)
  }
}

</script>

<style scoped>
.dodo-saamed-input {
  margin: 4px;
}

.dodo-saamed-dosage-chips {
  display: flex;
  flex-wrap: wrap;
  padding: 0 16px 8px 16px;
  margin-inline: -6px;
}

.saamed-indication  {
  color: var(--ion-color-secondary);
  font-size: 1.2em;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
