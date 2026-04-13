<template>

    <template v-if="!hasQuick">
      <IonItem :lines="lines" :button="true" @click="addQuick">
        <IonIcon slot="start" :src="icon" color="primary"></IonIcon>
        <IonLabel>{{ label }} hinzufügen</IonLabel>
      </IonItem>
    </template>

    <IonItem v-else :lines="lines">
      <IonIcon slot="start" :src="icon" color="primary"></IonIcon>
      <DodoInputText
        ref="treatInput"
        v-model="quickValue"
        :placeholder="'z.B. ' + placeholder"
        :autocorrectFn="autocorrectFn"
        @leaved-empty="clearQuick"
      />
      <IonButton v-if="hasQuickInput" size="default" fill="clear" color="dark" @click="clearQuick">
        <IonIcon slot="icon-only" :icon="closeOutline"></IonIcon>
      </IonButton>
    </IonItem>

</template>

<script setup lang="ts">

import { computed, ref } from 'vue'
import { closeOutline, pulseOutline } from 'ionicons/icons'

import { notEmpty } from '@/utils/filter'

// ############################################################################

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    lines?: string
    icon: string
    placeholder: string
    autocorrectFn?: (draft: string) => string
  }>(),
  {
    icon: pulseOutline,
    lines: 'full'
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// ############################################################################

const hasQuick = ref(false)
const treatInput = ref<any | null>(null)
const hasQuickInput = computed(() => hasQuick.value && notEmpty(quickValue.value))

const addQuick = () => {
  hasQuick.value = true
  setTimeout(() => treatInput.value?.setFocus(), 300)
}
const clearQuick = () => {
  hasQuick.value = false
  quickValue.value = ''
}

const quickValue = computed({
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
    border-top: 1px solid var(--card-bg);

  }

  .add-quick {
    text-align: left;
  }

</style>
