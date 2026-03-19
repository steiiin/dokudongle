<template>
  <ion-item button :detail="true" @click="isOpen = true" :lines="lines">
    <ion-label>{{ label }}</ion-label>
    <ion-note slot="end">{{ model.text }}</ion-note>
  </ion-item>

  <ion-modal :is-open="isOpen">
    <ion-header>
      <ion-toolbar>
        <ion-title type="ios">{{ label }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="isOpen = false">Zurück</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list lines="none">
        <ion-item lines="none">
          <ion-toggle v-model="model.isInjured" label-placement="end">
            Verletzt?
          </ion-toggle>
        </ion-item>

        <template v-if="model.isInjured">

          <ion-item-divider>
            <ion-label>pDMS</ion-label>
          </ion-item-divider>

          <ion-item lines="none">
            <ion-select
              label="Typ"
              interface="popover"
              v-model="model.dms.state"
            >
              <ion-select-option value="">Nicht Anwendbar</ion-select-option>
              <ion-select-option value="iO">In Ordnung</ion-select-option>
              <ion-select-option value="gestoert">Gestört</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item lines="none" v-if="model.dms.state === 'gestoert'">
            <DodoInputText ref="inputRef"
              v-model="model.dms.deficit"
              label="Beschreibung" placeholder="z.B. Taubheit">
            </DodoInputText>
          </ion-item>

        </template>

      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">

import DodoInputText from './DodoInputText.vue'

import { computed, ref, watch } from 'vue'
import { gainFocus } from '@/utils/input'
import { SstLimb } from '@/types/protocol/sample'

const props = defineProps<{
  modelValue: SstLimb
  label: string
  lines?: 'full' | 'inset' | 'none'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SstLimb): void
}>()

// two-way binding helper
const model = computed<SstLimb>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// local UI state
const isOpen = ref(false)
const inputRef = ref<any | null>(null)

// watchers mimic original behavior
watch(() => model.value.isInjured, () => {
    model.value.dms.state = 'iO'
})
watch(() => model.value.dms.state, (v) => {
  model.value.dms.deficit = ''
  if (v === 'gestoert') { gainFocus(inputRef) }
})

</script>

<style scoped>
/* optional: tighten spacing if desired */
</style>
