<template>
  <IonCard v-if="true">
    <IonCardHeader>
      <IonCardTitle>Dongle</IonCardTitle>
      <IonCardSubtitle>{{ store.connectedDongleName }}</IonCardSubtitle>
    </IonCardHeader>
    <IonCardContent>
      <IonInput
        ref="nameRef"
        :value="newName"
        :counter="true"
        :maxlength="18"
        :disabled="isBusy"
        label="Name"
        label-placement="stacked"
        autocomplete="off"
        autocapitalize="off"
        :spellcheck="false"
        @ionInput="handleNameInput"
      />
      <IonText v-if="saveError" color="danger">
        <p role="alert">{{ saveError }}</p>
      </IonText>
      <IonButton color="success" :disabled="!canSave" @click="saveSettings">
        Speichern
      </IonButton>
      <IonProgressBar v-if="isBusy" type="indeterminate" aria-label="Name wird gespeichert" />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDokuStore } from '@/store/doku'
import { setNativeValue } from '@/utils/input'

const store = useDokuStore()
const nameRef = ref<{ $el: HTMLIonInputElement } | null>(null)
const newName = ref('')
const isSaving = ref(false)
const saveError = ref('')

const currentName = computed(() => store.connectedDongleName.replace(/^DokuDongle-/, ''))
const isBusy = computed(() => isSaving.value || store.connection.isRenaming)
const canSave = computed(() =>
  store.isDongleConnected
  && !isBusy.value
  && newName.value.length > 0
  && newName.value !== currentName.value,
)

const sanitizeName = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18)

watch(
  () => [store.isDongleConnected, store.connection.device?.id, store.connectedDongleName],
  () => {
    newName.value = sanitizeName(currentName.value)
    saveError.value = ''
  },
  { immediate: true },
)

const handleNameInput = (event: CustomEvent) => {
  newName.value = sanitizeName(String(event.detail?.value ?? ''))
  setNativeValue(nameRef, newName.value)
  saveError.value = ''
}

const saveSettings = async () => {
  if (!canSave.value) return

  isSaving.value = true
  saveError.value = ''
  try {
    const result = await store.renameDongle(newName.value)
    if (result === false) {
      saveError.value = 'Der Name konnte nicht gespeichert werden. Bitte versuche es erneut.'
    }
  }
  catch {
    saveError.value = 'Der Name konnte nicht gespeichert werden. Bitte versuche es erneut.'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
ion-card-subtitle {
  overflow-wrap: anywhere;
}
</style>
