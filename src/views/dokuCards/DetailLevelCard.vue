<template>
  <IonCard>
    <IonCardContent>
      <DodoToggleGroup v-model="store.doku.course">
        <DodoToggleButton :value="ProtocolCourse.TRANSPORT" :expand="true">Behandlung / Transport</DodoToggleButton>
        <DodoToggleButton :value="ProtocolCourse.NEF_VOR_ORT" :expand="true">NEF vor Ort (keine Maßnahmen)</DodoToggleButton>
        <DodoToggleButton :value="ProtocolCourse.VERLEGUNG">Verlegung</DodoToggleButton>
        <DodoToggleButton :value="ProtocolCourse.EINWEISUNG">Einweisung</DodoToggleButton>
      </DodoToggleGroup>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { ProtocolCourse } from '@/types/protocol';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore()

</script>
