<template>
  <IonIcon v-if="store.connection.isConnected" class="badge"
    :src="checkmarkCircleOutline" color="success">
  </IonIcon>
  <IonIcon v-else class="badge"
    :src="ellipsisHorizontalCircleOutline">
  </IonIcon>
</template>

<script setup lang="ts">

import { checkmarkCircleOutline, ellipsisHorizontalCircleOutline } from 'ionicons/icons'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>