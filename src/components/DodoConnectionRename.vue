<template>

  <IonButtons slot="primary">
    <IonButton v-if="store.isDongleConnected" @click="openSettingsDialog" size="large">
      <IonIcon :icon="cog" slot="icon-only"></IonIcon>
    </IonButton>
  </IonButtons>

  <IonModal :is-open="isModalOpen || isRenaming" :can-dismiss="false">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">Dongle-Einstellungen</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="isModalOpen = false" :disabled="isRenaming">Abbrechen</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton @click="saveSettings" color="success" :disabled="!canSave">Speichern</IonButton>
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
import { cog } from 'ionicons/icons'

import { gainFocus, setNativeValue } from '@/utils/input'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

// ############################################################################

const isModalOpen = ref(false)

const openSettingsDialog = async () => {

  const baseName = store.connectedDongleName.replace('DokuDongle-', '')
  currentName.value = baseName
  newName.value = sanitizeName(baseName)
  isModalOpen.value = true
  gainFocus(nameRef, true)

}

const saveSettings = async () => {
  if (!canSave.value) return
  await store.renameDongle(newName.value)
  isModalOpen.value = false
}

// ############################################################################

const currentName = ref('')
const newName = ref('')
const nameRef = ref<any|null>(null)

const isRenaming = computed(() => store.connection.isRenaming)
const canSave = computed(() => !isRenaming.value && newName.value.length > 0)

const sanitizeName = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '')

const handleNameInput = (event: CustomEvent) => {
  const inputValue = String(event.detail?.value ?? '')
  newName.value = sanitizeName(inputValue)
  setNativeValue(nameRef, newName.value)
}

</script>
<style>
  ion-input.dd-input-donglename .native-input {
    text-align: right !important;
  }
</style>
