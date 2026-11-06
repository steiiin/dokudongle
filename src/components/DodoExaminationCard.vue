<template>
  <IonCard>
    <IonCardHeader><IonCardTitle>{{ title }}</IonCardTitle></IonCardHeader>
    <IonCardContent><DodoExaminationList><slot /></DodoExaminationList></IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import DodoExaminationList from './DodoExaminationList.vue'

defineProps<{ title: string }>()
</script>
