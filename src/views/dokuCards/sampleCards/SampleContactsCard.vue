<template>
  <IonCard class="card-sample" v-if="lazy.sample.contacts">
    <IonCardHeader>
      <IonCardTitle>Angehörigenkontakte</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <DodoInputContacts v-model="store.doku.sampler.contacts" />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

import { useLazyStore } from '@/store/lazy'
const lazy = useLazyStore()

</script>

<style scoped>

  ion-card {
    --card-bg: #51287e;
  }

  ion-card-content {
    margin: 0;
    padding: 0 0 10px 0;
  }

  ion-card-content ion-item {
    --background: transparent;
  }

</style>
