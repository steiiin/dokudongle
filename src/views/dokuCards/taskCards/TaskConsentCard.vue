<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Einwilligung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputSelect v-model="store.doku.redflags.consent"
        label="Einwilligung" lines="full"
        :options="[
          { value: '', label: 'Nicht Notwendig' },
          { value: 'Fähig', label: 'Einwilligungsfähig' },
          { value: 'Unfähig', label: 'Einwilligungsunfähig' },
          { value: 'Zeitkritisch', label: 'Zeitkritisch' },
        ]">
      </DodoInputSelect>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
