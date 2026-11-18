<template>
  <div class="no-card">

    <DodoToggleGroup v-model="store.doku.course">
      <DodoToggleButton :value="ProtocolCourse.TRANSPORT" :expand="true">Behandlung / Transport</DodoToggleButton>
      <DodoToggleButton :value="ProtocolCourse.NEF_VOR_ORT" :expand="true">NEF vor Ort (keine Maßnahmen)</DodoToggleButton>
    </DodoToggleGroup>

  </div>
</template>

<script setup lang="ts">

import { ProtocolCourse } from '@/types/protocol';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore()

</script>
<style scoped>
  .no-card {
    padding-block: 1rem;
    padding-inline: 14px;
  }
</style>
