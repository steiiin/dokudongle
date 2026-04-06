<template>
  <IonCard v-show="ctx.isTrauma">
    <IonCardHeader>
      <IonCardTitle>c - Blutung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <DodoInputTextArea v-model="store.doku.Xabcde.description"
          ref="bleedingInput" inherit-style
          title="Kritische Blutung" placeholder="z.B. Schnittverletzung Arm: Tourniquet"
          :enhance-fn="enhanceBleeding">
          Beschreibe ganz kurz die <b>kritischen Blutungen</b>
          und deine <b>Behandlung</b>.
        </DodoInputTextArea>

      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { enhanceBleeding } from '@/utils/gpt/bleeding'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>

<style scoped>

  ion-card {
    --card-bg: #e41a1d71;
  }

</style>
