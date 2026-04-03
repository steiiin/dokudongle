<template>

  <IonCard class="dodo-saamed-input">
    <IonCardContent class="dodo-saamed-input-content">
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
    </IonCardContent>
  </IonCard>

  <IonModal :is-open="isSelectModalOpen" @did-present="gainFocus(selectSearchbar)" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">Medikament auswählen</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="closeSelectModal">Zurück</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonSearchbar v-model="searchQuery"
        ref="selectSearchbar" placeholder="Medikament suchen">
      </IonSearchbar>
      <IonList>
        <template v-for="group in groupedOptions" :key="group.indication.Id">
          <IonItemDivider>
            <IonLabel class="saamed-indication">{{ group.indication.Name }}</IonLabel>
          </IonItemDivider>
          <IonItem v-for="option in group.options" :key="`${group.indication.Id}-${option.med.id}`"
            lines="none" button
            @click="selectOption(option)">
            <IonLabel>{{ option.med.Name }}</IonLabel>
          </IonItem>
        </template>
      </IonList>
    </IonContent>
  </IonModal>

  <IonModal :is-open="isEditModalOpen" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">{{ modalTitle }}</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="cancelEdit">Zurück</IonButton>
        </IonButtons>
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
            label="Dosierung" placeholder="z.B. 1g KI">
          </DodoInputText>
        </IonItem>

        <template v-if="requiresContraCheck">
          <IonItemDivider>
            <IonLabel>Kontraindikationen</IonLabel>
          </IonItemDivider>
          <IonItem lines="full">
            <IonToggle v-model="currentTask.contraOk" label-placement="end">
              Kontraindikationen ausgeschlossen?
            </IonToggle>
          </IonItem>
          <IonItem v-if="currentTask.contraOk === false" lines="none">
            <DodoInputText v-model="currentTask.contraText"
              label="Kontraindikationen" placeholder="z.B. Schwangerschaft">
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

import { computed, ref } from 'vue'
import { addCircle } from 'ionicons/icons'

import type { ItemReorderEventDetail } from '@ionic/core'
import { ConsentMedOption, ConsentMedTask, DATA_SaamedOptions } from '@/data/meds'
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
    task.MedId === option.med.id && task.MedIndication === option.indication.Id
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
  const groups = new Map<string, { indication: ConsentMedOption['indication'], options: Array<ConsentMedOption> }>()
  for (const option of options) {
    if (!groups.has(option.indication.Id)) {
      groups.set(option.indication.Id, { indication: option.indication, options: [] })
    }
    groups.get(option.indication.Id)?.options.push(option)
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
  return `${currentOption.value.indication.Name} · ${currentOption.value.med.Name}`
})

const requiresContraCheck = computed(() => {
  if (!currentOption.value) {
    return false
  }
  return currentOption.value.med.requiresContraCheck?.has(currentOption.value.indication.Id) ?? false
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
const currentTask = ref<ConsentMedTask>(new ConsentMedTask('', '', '', true, '', ''))
const currentIndex = ref<number>(-1)
const currentOption = ref<ConsentMedOption | null>(null)

const selectOption = (option: ConsentMedOption) => {
  closeSelectModal()
  startNewTask(option)
}

const startNewTask = (option: ConsentMedOption) => {
  currentNew.value = true
  currentIndex.value = -1
  currentOption.value = option
  currentTask.value = new ConsentMedTask(
    option.med.id,
    option.indication.Id,
    option.med.defaultDosage,
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
  return DATA_SaamedOptions().find(option => option.med.id === medId && option.indication.Id === indicationId) ?? null
}

const getMedName = (task: ConsentMedTask): string => {
  return findOption(task.MedId, task.MedIndication)?.med.Name ?? task.MedId
}

const getIndicationName = (task: ConsentMedTask): string => {
  return findOption(task.MedId, task.MedIndication)?.indication.Name ?? task.MedIndication
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
  --card-bg: transparent;
  margin: .25rem;
}
.dodo-saamed-input-content {
  padding: 0;
}

.dodo-saamed-input-dosage {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.saamed-indication  {
  color: var(--ion-color-secondary);
  font-size: 1.2em;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
