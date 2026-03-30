<template>
  <IonButton
    :fill="isActive ? 'solid' : 'outline'" size="small"
    :class="{ expand: expand }"
    @click="() => setToggleValue(props.value)"
  >
    <slot />
  </IonButton>
</template>

<script setup lang="ts">

import { computed, inject } from 'vue'
import type { Ref } from 'vue'

// ############################################################################

const props = defineProps<{ value: string | number, expand?: boolean }>()

// ############################################################################

const toggleValue = inject<Ref<string | number>>('toggleValue')!
const setToggleValue = inject<(v: string | number) => void>('setToggleValue')!

// ############################################################################

const isActive = computed(() => toggleValue.value === props.value)

</script>

<style>

  ion-button.expand
  {
    flex: inherit;
    width: 100%;
  }
  ion-button {
    flex: 1;
  }

</style>
