<template>
  <IonCard>
    <IonCardContent class="">

      <DodoInputAge v-model="store.doku.ident.age" />

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
