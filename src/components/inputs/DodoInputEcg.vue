<template>
  <div class="ecg-input">
    <IonItemDivider><IonLabel>Grundrhythmus</IonLabel></IonItemDivider>
    <div role="group" aria-label="Grundrhythmus">
      <div v-for="(row, index) in rhythmRows" :key="index" class="ecg-chip-row">
        <DodoToggleChip v-for="option in row" :key="option.value" :color="option.color"
          :model-value="modelValue.rhythm === option.value" @update:model-value="dispatch({ type: 'rhythm', value: option.value })">
          {{ option.label }}
        </DodoToggleChip>
      </div>
    </div>
    <template v-if="modelValue.rhythm">
      <hr class="ecg-rhythm-divider" />
      <div class="ecg-chip-row" role="group" aria-label="Eingrenzen" style="margin-bottom: .5rem;">
        <DodoToggleChip color="primary" v-for="option in refinementOptions[modelValue.rhythm]" :key="option.value"
          :model-value="modelValue.refinement === option.value" @update:model-value="dispatch({ type: 'refinement', value: option.value })">
          {{ option.label }}
        </DodoToggleChip>
      </div>
    </template>

    <template v-if="modelValue.rhythm === 'paced'">
      <IonItemDivider><IonLabel>Stimulationsart</IonLabel></IonItemDivider>
      <div class="ecg-chip-row" role="group" aria-label="Stimulationsart">
        <DodoToggleChip color="primary" v-for="option in pacingOptions" :key="option.value"
          :model-value="modelValue.pacingType === option.value"
          @update:model-value="dispatch({ type: 'pacingType', value: option.value })">{{ option.label }}</DodoToggleChip>
      </div>
    </template>

    <template v-if="available.bundleBranch">
      <IonItemDivider><IonLabel>Schenkelblock</IonLabel></IonItemDivider>
      <div class="ecg-chip-row" role="group" aria-label="Schenkelblock">
        <DodoToggleChip color="primary" v-for="option in bundleOptions" :key="option.value" :model-value="modelValue.bundleBranch === option.value"
          @update:model-value="dispatch({ type: 'bundleBranch', value: option.value })">{{ option.label }}</DodoToggleChip>
      </div>
    </template>
    <SgarbossaKriterienCheck v-if="available.sgarbossa" :model-value="modelValue.sgarbossa"
      @answer="(index, value) => dispatch({ type: 'sgarbossa', index, value })" />

    <template v-if="available.sves || available.ves">
      <IonItemDivider><IonLabel>Extrasystolen</IonLabel></IonItemDivider>
      <div class="ecg-chip-row" role="group" aria-label="Extrasystolen">
        <DodoToggleChip color="primary" :model-value="!modelValue.sves && !modelValue.ves" @update:model-value="dispatch({ type: 'extrasystoles', value: 'none' })">Nein</DodoToggleChip>
        <DodoToggleChip v-if="available.sves" color="primary" :model-value="modelValue.sves" @update:model-value="dispatch({ type: 'extrasystoles', value: 'sves' })">SVES</DodoToggleChip>
        <DodoToggleChip v-if="available.ves" color="primary" :model-value="modelValue.ves" @update:model-value="dispatch({ type: 'extrasystoles', value: 'ves' })">VES</DodoToggleChip>
      </div>
      <div v-if="modelValue.ves" class="ecg-chip-row" role="group" aria-label="VES-Morphologie">
        <DodoToggleChip color="primary" :model-value="modelValue.morphology === 'mono'" @update:model-value="dispatch({ type: 'morphology', value: 'mono' })">Monomorph</DodoToggleChip>
        <DodoToggleChip color="primary" :model-value="modelValue.morphology === 'poly'" @update:model-value="dispatch({ type: 'morphology', value: 'poly' })">Polymorph</DodoToggleChip>
      </div>

    </template>
    <template v-if="available.st">
      <IonItemDivider><IonLabel>ST-Strecke</IonLabel></IonItemDivider>
      <DodoInputSelectChips v-for="direction in directions" :key="direction.value"
        :model-value="modelValue[direction.leads]" :label="direction.label" :options="leadRows" empty-label="Keine"
        @update:model-value="dispatch({ type: 'leads', direction: direction.value, value: $event as EcgLead[] })" />
    </template>
    <template v-if="frequencyConfig && frequencyValue !== null">
      <IonItemDivider><IonLabel>Frequenz: {{ ecgFrequencyText(frequencyValue) }}</IonLabel></IonItemDivider>
      <IonRange :key="`${modelValue.rhythm}-${modelValue.refinement}`" class="ecg-frequency"
        aria-label="Frequenz in Schlägen pro Minute" :min="frequencyConfig.min" :max="frequencyConfig.max"
        :step="frequencyConfig.step" :dual-knobs="frequencyConfig.dualKnobs" :snaps="true" :pin="true"
        :value="frequencyValue" @ionInput="dispatch({ type: 'frequency', value: $event.detail.value })" />
    </template>
    <!-- <IonItem lines="none">
      <DodoInputText :model-value="modelValue.notes" label="Ergänzung" placeholder="Optionaler EKG-Freitext"
        @update:model-value="dispatch({ type: 'notes', value: $event })" />
    </IonItem> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonItemDivider, IonLabel, IonRange } from '@ionic/vue'
import DodoToggleChip from './DodoToggleChip.vue'
import DodoInputSelectChips from './DodoInputSelectChips.vue'
import SgarbossaKriterienCheck from './ecg/SgarbossaKriterienCheck.vue'
import { rhythmRows, refinementOptions, leadRows, updateEcg, ecgAvailability, ecgFrequencyConfig, ecgFrequencyText, type EcgFinding, type EcgAction, type EcgLead } from '@/types/protocol/abcde/ecg'
const props = defineProps<{ modelValue: EcgFinding }>()
const available = computed(() => ecgAvailability(props.modelValue))
const frequencyConfig = computed(() => ecgFrequencyConfig(props.modelValue))
const frequencyValue = computed(() => props.modelValue.frequency ?? frequencyConfig.value?.preset ?? null)
const emit = defineEmits<{ 'update:modelValue': [value: EcgFinding] }>()
const dispatch = (action: EcgAction) => emit('update:modelValue', updateEcg(props.modelValue, action))
const bundleOptions = [{ value: 'none', label: 'Nein' }, { value: 'rsb', label: 'RSB' }, { value: 'lsb', label: 'LSB' }] as const
const pacingOptions = [
  { value: 'atrial', label: 'Nur atrial' },
  { value: 'ventricular', label: 'Ventrikulär / AV-sequenziell' },
] as const
const directions = [
  { value: 'elevation', leads: 'elevationLeads', label: 'ST-Hebung' },
  { value: 'depression', leads: 'depressionLeads', label: 'ST-Senkung' },
] as const
</script>

<style scoped>
ion-item-divider {
  margin-bottom: .5rem;
}
.ecg-input { min-width: 0; }
.ecg-frequency { padding: 8px 1rem; }
.ecg-rhythm-divider {
  margin: .5rem 0;
  border: 0;
  border-top: 1px solid var(--ion-item-border-color, var(--ion-border-color, var(--ion-background-color-step-250, #c8c7cc)));
}
.ecg-chip-row {
  display: flex;
  gap: .2rem;
  overflow-x: auto;
  padding: .1rem 1rem;
}
.ecg-chip-row:not(:has(+ .ecg-chip-row)) {
  margin-bottom: .5rem;
}
h3, h4 { margin: .75rem 1rem .25rem; font-size: 1rem; }
h4 { font-weight: normal; }
.ecg-chip-row > ion-chip { flex: 0 0 auto; white-space: nowrap; }
</style>
