<template>
  <ion-icon v-if="store.connection.isConnected" class="badge"
    :src="checkmarkCircleOutline" color="success">
  </ion-icon>
  <ion-icon v-else class="badge"
    :src="ellipsisHorizontalCircleOutline">
  </ion-icon>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { checkmarkCircleOutline, ellipsisHorizontalCircleOutline } from 'ionicons/icons';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore();

</script>