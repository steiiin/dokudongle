<template>
  <IonCard class="card-sample">
    <IonCardHeader>
      <IonCardTitle>P / L / E / (R)</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.sampler.pler.PLER"
        title="PLER" :enhance-fn="enhanceSituation" style="padding: 0 16px">
        <p><b>(P)</b> Beschreibung von:</p>
        <ul>
          <li>Vorerkrankungen</li>
          <li>Operationen</li>
          <li>sonstige medizinische Vorgeschichte</li>
        </ul>
        <p><b>(L)</b> Letzte Nahrungsaufnahme</p>
        <p><b>(E)</b> Eventuell auslösende Ereignisse</p>
        <p><b>(R)</b> Risikofaktoren, wie Raucher, Diabetiker, Schwanger, Süchte</p>
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
