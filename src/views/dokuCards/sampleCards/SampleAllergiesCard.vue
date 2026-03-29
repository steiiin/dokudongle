<template>
  <IonCard class="sample-allergies">
    <IonCardHeader>
      <IonCardTitle>Allergien</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>

        <DodoInputSelect label="Allergien" v-model="store.doku.sampler.allergies.level" lines="none"
          :options="[
            { value: '', label: 'Keine' },
            { value: 'unknown', label: 'Unklar' },
            { value: 'minor', label: 'Nicht-Medikamentös' },
            { value: 'major', label: 'Klinisch-Relevant' },
          ]">
        </DodoInputSelect>

        <IonItem lines="none" v-if="needInput">
          <DodoInputText ref="inputAllergiesDescription"
            v-model="store.doku.sampler.allergies.description"
            label="↳ Welche:" :placeholder="placeholder"
            :autocorrect-fn="basicCap">
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
const placeholder = computed(() => {
  if (store.doku.sampler.allergies.level == 'minor') { return 'z.B. Heuschnupfen' }
  else { return 'z.B. Metamizol' }
})

</script>
<style scoped>
ion-card {
  --card-bg: #865830;
}
</style>