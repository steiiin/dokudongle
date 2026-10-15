<template>
  <DodoContainerCard>
    <DodoInputAge v-model="store.doku.ident.age" />
  </DodoContainerCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
