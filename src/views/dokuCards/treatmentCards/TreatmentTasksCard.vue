<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Maßnahmen</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.treatment"
        title="Maßnahmen" :enhance-fn="enhanceSituation">
        <p><b>Arbeitsdiagnose</b></p>
        <p><b>Maßnahmen</b></p>
        <p>Ergriffene Maßnahmen + Begründung <i>(außer Medis)</i></p>
        <p><b>Weiterbehandlung</b></p>
        <p>Zielklink, Hausarzt, u.a.</p>
      </DodoInputTextArea>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { enhanceSituation } from '@/utils/gpt/situation'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
<style scoped>
  p { margin:0; }
  p b { font-family: monospace; font-size: 1.3em; }
  ul { margin:0; padding-left: 3rem; }
</style>
