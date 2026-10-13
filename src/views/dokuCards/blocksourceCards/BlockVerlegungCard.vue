<template>
  <IonCard class="decent-card">
    <IonCardHeader>
      <IonCardTitle>Verlegung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="with-list">
      <IonList>
        <IonItem lines="full">
          <DodoInputText v-model="store.doku.textAreaBlocks.verlegung.values.START"
            label="Start" placeholder="z.B. FKH Coswig"
            :ime-dictionary="{}" assist-context-id="quickie.verlegung.start" />
        </IonItem>
        <IonItem lines="none">
          <DodoInputText v-model="store.doku.textAreaBlocks.verlegung.values.ZIEL"
            label="Ziel" placeholder="z.B. FKH Coswig"
            :ime-dictionary="{}" assist-context-id="quickie.verlegung.ziel" />
        </IonItem>
      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonList, IonItem } from '@ionic/vue'
import DodoInputText from '@/components/DodoInputText.vue'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
</script>

<style scoped>

.decent-card {
  --card-bg: var(--decent-primary);
}

</style>