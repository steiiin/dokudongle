<template>
  <IonCard class="sample-allergies">
    <IonCardHeader>
      <IonCardTitle>Allergien</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>

        <IonItem lines="none">
          <IonSelect label="Allergien" interface="popover" v-model="store.doku.sampler.allergies.level">
            <IonSelectOption value="">Keine</IonSelectOption>
            <IonSelectOption value="unknown">Unklar</IonSelectOption>
            <IonSelectOption value="minor">Nicht-Medikamentös</IonSelectOption>
            <IonSelectOption value="major">Klinisch-Relevant</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="none" v-if="needInput">
          <DodoInputText ref="inputAllergiesDescription"
            v-model="store.doku.sampler.allergies.description"
            label="Beschreibung:" :placeholder="getAllergiesHint"
            :beautify-fn="basicCap">
          </DodoInputText>
        </IonItem>

      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { basicCap } from '@/utils/autocorrect/basic'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()

const inputAllergiesDescription = ref<any|null>(null)

watch(() => store.doku.sampler.allergies.level, async (v) => {
  store.doku.sampler.allergies.description = ''
  if (v == 'minor' || v == 'major') {
    setTimeout(() => { inputAllergiesDescription.value?.$el.setFocus() }, 300)
  }
})

const needInput = computed(() => store.doku.sampler.allergies.level == 'minor' || store.doku.sampler.allergies.level == 'major')
const getAllergiesHint = computed(() => {
  if (store.doku.sampler.allergies.level == 'minor') { return 'z.B. Heuschnupfen' }
  else { return 'z.B. Metamizol' }
})
</script>
