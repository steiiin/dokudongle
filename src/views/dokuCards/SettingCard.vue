<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Umgebung</ion-card-title>
    </ion-card-header>
    <ion-card-content class="with-list">
      <ion-list lines="full">

        <dd-input-option label="Einsatzort" v-model="store.doku.setting.location" lines="full"
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
        </dd-input-option>

        <ion-item>
          <ion-toggle v-model="store.doku.setting.isAlone" label-placement="end">
            Lebt allein?
          </ion-toggle>
        </ion-item>

        <ion-item lines="full">
          <ion-toggle v-model="store.doku.setting.isForcedEntry" label-placement="end">
            Türöffnung?
          </ion-toggle>
        </ion-item>


        <dd-input-option label="Mobilität" v-model="store.doku.setting.mobility" lines="full"
          empty-label="Normal / k.A."
          :options="[
            'am Stock mobil',
            'rollatormobil',
            'rollstuhlmobil',
            'bettlägerig',
          ]">
        </dd-input-option>


        <dd-input-option label="Vor Ort" v-model="store.doku.setting.helpers" lines="none"
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
        </dd-input-option>

      </ion-list>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">

import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonSelect, IonSelectOption, IonToggle } from '@ionic/vue'

import DdInputOption from '@/components/DdInputOption.vue'

import { ref, watch } from 'vue'
import { basicCap } from '@/utils/autocorrect/basic';

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

</script>
