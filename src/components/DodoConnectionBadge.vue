<template>
  <IonIcon v-if="store.connection.isConnected" class="badge"
    :src="checkmarkCircleOutline" color="success">
  </IonIcon>
  <IonIcon v-else-if="store.connection.isConnecting" class="badge"
    :src="ellipsisHorizontalCircleOutline">
  </IonIcon>
  <IonIcon v-else class="badge"
    :src="removeCircleOutline">
  </IonIcon>
</template>

<script setup lang="ts">

import { checkmarkCircleOutline, ellipsisHorizontalCircleOutline, removeCircleOutline } from 'ionicons/icons'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>