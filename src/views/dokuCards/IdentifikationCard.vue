<template>
  <IonCard>
    <IonCardContent class="">

      <DodoInputAge v-model="store.doku.ident.age" />

      <!-- <DodoToggleGroup v-model="store.doku.ident.Sex">
        <DodoToggleButton value="männlich">Männlich</DodoToggleButton>
        <DodoToggleButton value="weiblich">Weiblich</DodoToggleButton>
      </DodoToggleGroup> -->

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

import { computed, ref, watch } from 'vue'


</script>
