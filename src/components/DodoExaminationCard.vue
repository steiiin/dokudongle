<template>
  <IonCard>
    <IonCardHeader><IonCardTitle>{{ title }}</IonCardTitle></IonCardHeader>
    <IonCardContent><IonList lines="none"><slot /></IonList></IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style scoped>
ion-card-content ion-list {
  padding: 0;
}
</style>
