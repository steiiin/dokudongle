<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Vorschau</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
        <DodoSendAction></DodoSendAction>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true">
      <textarea readonly>{{ localPreview }}</textarea>
    </IonContent>

  </IonPage>
</template>
<script setup lang="ts">

import { onIonViewDidEnter } from '@ionic/vue'

import { useDokuStore } from '@/store/doku'
import { ref } from 'vue'
const store = useDokuStore()

const localPreview = ref<string>('')
onIonViewDidEnter(() => {
  localPreview.value = store.generatedProtocol
})

</script>
<style scoped lang="scss">

  textarea {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: var(--ion-background-color);
    border: none;
    resize: none;
    margin: 0;
    padding: 1rem;
  }

</style>