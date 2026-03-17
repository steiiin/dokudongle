<template>
  <IonCard class="card-sample">
    <IonCardHeader>
      <IonCardTitle>Angehörigenkontakte</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <pb-contact-input v-model="store.doku.sampler.contacts" />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import PbContactInput from '@/components/pb-contact-input.vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>

<style scoped>
  ion-card-content {
    margin: 0;
    padding: 0 0 10px 0;
  }

  ion-card-content ion-item {
    --background: transparent;
  }
</style>
