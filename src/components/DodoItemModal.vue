<template>
  <IonItem :lines="lines" button :detail="detail" @click="isModalOpen = true">
    <template v-if="useStackedLayout">
      <IonLabel>
        <h2>{{ label }}</h2>
        <p>{{ stateText }}</p>
      </IonLabel>
    </template>
    <template v-else>
      <IonLabel>{{ label }}</IonLabel>
      <IonNote slot="end">{{ stateText }}</IonNote>
    </template>
  </IonItem>
  <IonModal :is-open="isModalOpen">
    <IonHeader>
      <IonToolbar>
        <IonTitle type="ios">{{ modalLabel }}</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="isModalOpen = false">Zurück</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList lines="none">
        <slot />
      </IonList>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  modalLabel: string
  state?: string
  lines?: 'full' | 'none' | 'inset'
  detail?: boolean
}>(), {
  state: '',
  detail: true,
  lines: 'full'
})

const isModalOpen = ref(false)

const stateText = computed(() => props.state ?? '')
const useStackedLayout = computed(() => stateText.value.length > 25)

</script>
<style scoped>
  ion-label p {
    font-size: 0.8em;
    line-height: 1;
  }
</style>