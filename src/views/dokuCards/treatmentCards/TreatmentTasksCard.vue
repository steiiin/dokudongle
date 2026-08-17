<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Maßnahmen</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.treatment"
        assist-context-id="treatment.tasks"
        title="Maßnahmen" placeholder="Beschreibe ..." :enhance-fn="enhanceGeneral" :mandatory="!(ctx.isEinweisung || ctx.isVerlegung)">
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

import { enhanceGeneral } from '@/utils/gpt/general';
import { computed } from 'vue';

import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
<style scoped>

  p { margin:0; }
  p b { font-family: monospace; font-size: 1.3em; }
  ul { margin:0; padding-left: 3rem; }

</style>
