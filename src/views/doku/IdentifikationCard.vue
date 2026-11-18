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
  padding-block: .5rem;
  padding-inline: 11px;
}
</style>