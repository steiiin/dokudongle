<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Patient</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <!-- <DodoToggleGroup v-model="store.doku.ident.Sex">
        <DodoToggleButton value="männlich">Männlich</DodoToggleButton>
        <DodoToggleButton value="weiblich">Weiblich</DodoToggleButton>
      </DodoToggleGroup> -->
      <DodoInputAge v-model="store.doku.ident.age" />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
