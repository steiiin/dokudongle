<template>

  <div class="no-card">
    <DodoInputAge v-model="store.doku.ident.age" />
  </div>

</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
<style scoped>
.no-card {
  padding-block: 1rem;
  padding-inline: 14px;
}
</style>
