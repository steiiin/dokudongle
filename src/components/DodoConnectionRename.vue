<template>

  <IonButton v-if="store.isDongleConnected" @click="openRenameDialog">Dongle umbenennen
  </IonButton>

  <IonModal :is-open="isModalOpen || isRenaming" :can-dismiss="!isRenaming">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">Dongle umbenennen</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="isModalOpen = false" :disabled="isRenaming">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton @click="renameDongle" color="success" :disabled="!canSave">Speichern</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList lines="none" v-if="!isRenaming">
        <IonItem>
          <IonInput class="dd-input-donglename" ref="nameRef" v-model="newName" :counter="true" :maxlength="20"
            label="Name" :placeholder="currentName" @ionInput="handleNameInput">
          </IonInput>
        </IonItem>
      </IonList>
      <IonProgressBar type="indeterminate" class="progress" v-else></IonProgressBar>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue'
import { gainFocus } from '@/utils/input'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()


const isModalOpen = ref(false)
const currentName = ref('')
const newName = ref('')
const nameRef = ref<any|null>(null)

const isRenaming = computed(() => store.connection.isRenaming)
const canSave = computed(() => !isRenaming.value && newName.value.length > 0)

const sanitizeName = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '')

const setNativeValue = (inputRef: any, value: string) => {
  const inputCmp = inputRef?.value
  if (!inputCmp?.$el) return
  inputCmp.$el.value = value
}
const handleNameInput = (event: CustomEvent) => {
  const inputValue = String(event.detail?.value ?? '')
  newName.value = sanitizeName(inputValue)
  setNativeValue(nameRef, newName.value)
}

const openRenameDialog = async () => {

  const baseName = store.connectedDongleName.replace('DokuDongle-', '')
  currentName.value = baseName
  newName.value = sanitizeName(baseName)
  isModalOpen.value = true
  gainFocus(nameRef, true)

}

const renameDongle = async () => {
  if (!canSave.value) return
  await store.renameDongle(newName.value)
  isModalOpen.value = false
}

</script>
<style scoped>
ion-button {
  flex: 0;
}
</style>
<style>
ion-input.dd-input-donglename .native-input {
  text-align: right !important;
}
</style>
