<template>
  <IonList>

    <hr>

    <template v-if="!hasTreatment">
      <IonButton class="add-treatment"
        fill="clear" expand="block" color="dark"
        size="small" @click="addTreatment">
        Sofortmaßnahmen hinzufügen
      </IonButton>
    </template>

    <IonItem v-else lines="none">
      <IonIcon slot="start" :src="pulseOutline" color="primary"></IonIcon>
      <DodoInputText
        ref="treatInput" label=""
        v-model="treatmentValue"
        :placeholder="'z.B. ' + placeholder"
        :autocorrectFn="autocorrectFn"
        @leaved-empty="clearTreatment"
      />
      <IonButton v-if="hasTreatmentInput" size="default" fill="clear" color="dark" @click="clearTreatment">
        <IonIcon slot="icon-only" :icon="closeOutline"></IonIcon>
      </IonButton>
    </IonItem>

  </IonList>
</template>

<script setup lang="ts">

import { ref, computed, watch } from 'vue'

import { closeOutline, pulseOutline } from 'ionicons/icons'

const props = defineProps<{
  modelValue: string
  placeholder: string
  autocorrectFn?: (draft: string) => string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const hasTreatment = ref(false)
const treatInput = ref<any|null>(null)
const hasTreatmentInput = computed(() => hasTreatment.value && treatmentValue.value.length>0)

const addTreatment = () => {
  hasTreatment.value = true
  setTimeout(() => treatInput.value?.setFocus(), 300)
}
const clearTreatment = () => {
  hasTreatment.value = false
  treatmentValue.value = ''
}

const textInput = ref<any|null>(null)

const treatmentValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
  },
})

</script>
<style scoped>

ion-list {
  padding-top:0
}

hr {

  margin: 0;
  padding: 0;
  padding-top: .25rem;
  border-top: 1px solid var(--card-bg);

}

.add-treatment {
  margin: .25rem .5rem 0 .5rem;
  background-color: var(--card-bg);
}

</style>