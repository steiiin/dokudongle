<template>

  <IonCard class="dd-med-input">
    <IonCardContent class="dd-med-input-content">

      <IonList v-if="modelValue.length>0">
        <IonItem v-for="item in modelValue" :key="item.Name" @click="editItem(item)"
          lines="none" button>
          <IonLabel>{{ item.Name }}</IonLabel>
          <IonNote slot="end">{{ item.getTimesLabel }}</IonNote>
        </IonItem>
      </IonList>

      <IonButton fill="solid" color="light" @click="addNew">
        <IonIcon slot="start" :icon="addCircle"></IonIcon>
        Exakte Angabe
      </IonButton>
      <br>
      <IonButton fill="solid" color="light" @click="addFuzzyNew">
        <IonIcon slot="start" :icon="addCircle"></IonIcon>
        Ungefähr
      </IonButton>

    </IonCardContent>
  </IonCard>

  <IonModal :is-open="isModalOpen">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">{{ modalTitle }}</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="cancelEdit">Zurück</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton @click="saveItem" color="success" :disabled="!modalValid">{{ modalSaveLabel }}</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>

        <IonItemDivider>
          <IonLabel>Name</IonLabel>
        </IonItemDivider>
        <IonItem lines="none">

          <DodoInputText ref="inputName"
            v-model="currentItem.Name"
            label="" placeholder="z.B. ASS"
            :autocorrect-fn="correctMedName">
          </DodoInputText>

        </IonItem>
        <template v-if="!currentItem.isFuzzy">
          <IonItemDivider>
            <IonLabel>Einnahme</IonLabel>
          </IonItemDivider>
          <IonItem lines="full">
            <IonToggle v-model="currentItem.isRegularly"
              label-placement="end">Regelmäßige Einnahme?
            </IonToggle>
          </IonItem>
          <IonItem lines="none" v-if="currentItem.isRegularly">
            <IonSelect interface="popover" :multiple="true" v-model="currentItem.Times"
              label="Einnahmezeiten:" placeholder="Wann?">
              <IonSelectOption value="morgens">Morgens</IonSelectOption>
              <IonSelectOption value="mittags">Mittags</IonSelectOption>
              <IonSelectOption value="abends">Abends</IonSelectOption>
              <IonSelectOption value="nachts">Nachts</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem v-else lines="none">

            <DodoInputText ref="inputCustom"
              v-model="currentItem.TimesCustom"
              label="Einnahmezeiten: " placeholder="z.B. 2x/Monat">
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
import { addCircle } from 'ionicons/icons'

import { SampleMedicationItem } from '@/types/protocol/sample'
import { correctMedName } from '@/utils/autocorrect/medications'

// ############################################################################

const props = defineProps<{ modelValue: Array<SampleMedicationItem> }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<SampleMedicationItem>): void
}>()

// ############################################################################

const isModalOpen = ref(false)

const addNew = () => {
  currentNew.value = true
  currentItem.value = new SampleMedicationItem()
  isModalOpen.value = true
  setTimeout(() => { inputName.value.$el.setFocus() }, 300)
}

const addFuzzyNew = () => {
  addNew()
  currentItem.value = new SampleMedicationItem({ isFuzzy: true })
}

const cancelEdit = () => {
  currentItem.value = new SampleMedicationItem()
  currentNew.value = true
  currentIndex.value = -1
  isModalOpen.value = false
}

const editItem = (item: SampleMedicationItem) => {
  currentNew.value = false
  currentItem.value = new SampleMedicationItem(item)
  currentIndex.value = props.modelValue.indexOf(item)
  isModalOpen.value = true
}

const saveItem = () => {
  if (!modalValid.value) { return }

  if (currentNew.value) {
    emit('update:modelValue', [...props.modelValue, currentItem.value])
  }
  else {
    const updatedList = [...props.modelValue]
    updatedList[currentIndex.value] = currentItem.value
    emit('update:modelValue', updatedList)
  }
  isModalOpen.value = false
}

const deleteItem = () => {
  const updatedList = [...props.modelValue]
  updatedList.splice(currentIndex.value, 1)
  emit('update:modelValue', updatedList)
  isModalOpen.value = false
}

const currentNew = ref(false)
const currentItem = ref<SampleMedicationItem>(new SampleMedicationItem())
const currentIndex = ref<number>(-1)

const modalTitle = computed(() => {
  return currentNew.value
    ? 'Neues Medikament'
    : (currentItem.value.Name.trim().length>0 ? currentItem.value.Name : 'Medikament')
})
const modalValid = computed(() => {
  if (currentItem.value.Name.trim().length==0) { return false }
  if (props.modelValue.some(e =>
    e.Name.trim().toLowerCase() == currentItem.value.Name.trim().toLowerCase()
    && (currentNew.value || currentIndex.value != props.modelValue.indexOf(e)))) { return false }

  if (currentItem.value.isFuzzy) { return true }

  if (currentItem.value.isRegularly) {
    return currentItem.value.Times.length>0
  }
  else {
    return currentItem.value.TimesCustom.trim().length>0
  }
})
const modalSaveLabel = computed(() => currentNew.value ? 'Hinzufügen' : 'Speichern')

const inputName = ref<any | null>(null)
const inputCustom = ref<any | null>(null)

// ############################################################################

watch(() => currentItem.value.isRegularly, (v) => {
  currentItem.value.TimesCustom = ''
  if (!v) {
    setTimeout(() => { inputCustom.value.$el.setFocus() }, 300)
  }
})

</script>

<style scoped>

  .dd-med-input {
    --card-bg: transparent;
    margin-top: 0;
    margin-bottom: 0;
  }
  .dd-med-input-content {
    padding: 0;
  }

</style>
