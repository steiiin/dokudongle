<template>
  <ion-card>
    <ion-card-content>
      <dd-toggle-group v-model="store.doku.course">
        <dd-toggle-button :value="ProtocolCourse.TRANSPORT" :expand="true">Behandlung / Transport</dd-toggle-button>
        <dd-toggle-button :value="ProtocolCourse.NEF_VOR_ORT" :expand="true">NEF vor Ort (keine Maßnahmen)</dd-toggle-button>
        <dd-toggle-button :value="ProtocolCourse.VERLEGUNG">Verlegung</dd-toggle-button>
        <dd-toggle-button :value="ProtocolCourse.EINWEISUNG">Einweisung</dd-toggle-button>
      </dd-toggle-group>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">

import { IonCard, IonCardContent } from '@ionic/vue'

import DdToggleButton from '@/components/DdToggleButton.vue'
import DdToggleGroup from '@/components/DdToggleGroup.vue'

import { ProtocolCourse } from '@/types/protocol';

import { useDokuStore } from '@/store/doku';
const store = useDokuStore()

</script>
