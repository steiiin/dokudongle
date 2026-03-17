<template>
  <IonCard  v-show="ctx.isTrauma">
    <IonCardHeader>
      <IonCardTitle>c - Blutung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none">

        <IonItem>
          <IonToggle v-model="store.doku.Xabcde.hasCriticalBleeding" label-placement="end">
            Gab es kritische Blutungen?
          </IonToggle>
        </IonItem>

        <DodoInputTextArea v-model="store.doku.Xabcde.bleeding" v-if="hasBleedings"
          ref="bleedingInput"
          title="Blutung" placeholder="z.B. Schnittverletzung Arm: Tourniquet"
          :enhance-fn="enhanceBleeding" mandatory>
          Beschreibe ganz kurz die <b>kritischen Blutungen</b>
          und deine <b>Behandlung</b>.
        </DodoInputTextArea>

      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { enhanceBleeding } from '@/utils/gpt/bleeding'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

const hasBleedings = computed(() => store.doku.Xabcde.hasCriticalBleeding)

const bleedingInput = ref<any|null>(null)

watch(hasBleedings, (v) => {
  if (v) {
    setTimeout(() => bleedingInput.value?.openModal(), 300)
  } else {
    store.doku.Xabcde.bleeding.clear()
  }
})

</script>

<style scoped>

ion-card {
  --card-bg: #e41a1d71;
}

</style>
