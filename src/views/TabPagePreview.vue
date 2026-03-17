<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Vorschau</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true">
      <textarea readonly>{{ store.generatedProtocol }}</textarea>
    </IonContent>
  </IonPage>
</template>
<script setup lang="ts">

import { useDokuStore } from '@/store/doku';
const store = useDokuStore();

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