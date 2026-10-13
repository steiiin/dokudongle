<template>
  <IonCard class="decent-card">
    <IonCardHeader>
      <IonCardTitle>Einweisung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="with-list">
      <IonList>
        <IonItem lines="full">
          <DodoInputText v-model="store.doku.textAreaBlocks.einweisung.values.ARZT"
            label="Arzt" placeholder="z.B. HA Wegner"
            :ime-dictionary="{}" assist-context-id="quickie.einweisung.arzt" />
        </IonItem>
        <IonItem lines="full">
          <DodoInputText v-model="store.doku.textAreaBlocks.einweisung.values.ZIEL"
            label="Ziel" placeholder="z.B. FKH Coswig"
            :ime-dictionary="{}" assist-context-id="quickie.einweisung.ziel" />
        </IonItem>
        <IonItem lines="none">
          <DodoInputText v-model="store.doku.textAreaBlocks.einweisung.values.KRANKHEIT"
            label="Grund" placeholder="z.B. Thrombose"
            :ime-dictionary="{}" assist-context-id="quickie.einweisung.krankheit" />
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
  --card-bg: var(--decent-primary)
}

</style>