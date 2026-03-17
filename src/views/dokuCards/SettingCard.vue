<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Umgebung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="with-list">
      <IonList lines="full">

        <DodoInputSelect label="Einsatzort" v-model="store.doku.setting.location" lines="full"
          empty-label="Keine Angabe"
          :options="[
            'Häuslichkeit',
            'Betreutes Wohnen',
            'Pflegeheim',
            'Werkhalle',
            'Büro',
            'Bahnhof',
          ]"
          allow-custom custom-label="Wo?" custom-placeholder="z.B. Fußweg"
          :autocorrect-fn="basicCap">
        </DodoInputSelect>

        <IonItem>
          <IonToggle v-model="store.doku.setting.isAlone" label-placement="end">
            Lebt allein?
          </IonToggle>
        </IonItem>

        <IonItem lines="full">
          <IonToggle v-model="store.doku.setting.isForcedEntry" label-placement="end">
            Türöffnung?
          </IonToggle>
        </IonItem>


        <DodoInputSelect label="Mobilität" v-model="store.doku.setting.mobility" lines="full"
          empty-label="Normal / k.A."
          :options="[
            { value: 'am Stock mobil', label: 'Am Stock' },
            { value: 'rollatormobil', label: 'Rollator' },
            { value: 'rollstuhlmobil', label: 'Rollstuhl' },
            { value: 'bettlägerig', label: 'Bettlägerig' },
          ]">
        </DodoInputSelect>


        <DodoInputSelect label="Vor Ort" v-model="store.doku.setting.helpers" lines="none"
          empty-label="Keiner / k.A."
          :options="[
            'Pflegedienst',
            'Angehörige',
            'Ehepartner',
            'Lebenspartner',
            'Kinder',
          ]"
          allow-custom custom-label="Wer?" custom-placeholder="z.B. Tochter & Nachbarin"
          :autocorrect-fn="basicCap">
        </DodoInputSelect>

      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { ref, watch } from 'vue'
import { basicCap } from '@/utils/autocorrect/basic';

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
