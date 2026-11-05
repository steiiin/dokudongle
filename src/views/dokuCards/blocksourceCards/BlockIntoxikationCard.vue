<template>
  <DodoItemModal ref="modal" label="Intoxikation möglich?" modal-label="Intoxikation möglich?" lines="none"
    :state="store.intoxicationSummary || store.doku.xabcDe.intoxication.value || 'Keine Angabe'">
    <IonItemDivider><IonLabel>Substanz</IonLabel></IonItemDivider>
    <IonItem>
      <div class="chip-container">
        <DodoToggleChip v-for="substance in intoxicationSubstances" :key="substance.value"
          :model-value="details.substances[substance.value].enabled"
          @update:model-value="store.setIntoxicationSubstance(substance.value, $event)">
          {{ substance.label }}
        </DodoToggleChip>
      </div>
    </IonItem>
    <IonItem v-if="details.substances.other.enabled">
      <DodoInputText v-model="details.otherName" label="Sonstige Substanz" placeholder="Substanzbezeichnung" />
    </IonItem>

    <template v-for="substance in selectedSubstances" :key="substance.value">
      <IonItemDivider>
        <IonLabel>{{ substance.value === 'other' ? details.otherName.trim() || 'Sonstige' : substance.label }}</IonLabel>
      </IonItemDivider>
      <DodoInputSelect :model-value="details.substances[substance.value].basis" label="Grundlage"
        :options="intoxicationBasisOptions"
        @update:model-value="store.setIntoxicationBasis(substance.value, $event)" />
      <DodoInputSelectChips v-if="details.substances[substance.value].basis === 'suspected'"
        :model-value="details.substances[substance.value].reasons"
        @update:model-value="details.substances[substance.value].reasons = $event.map(String)"
        label="Verdachtshinweise" empty-label="Keine Angabe"
        :options="intoxicationReasonRows[substance.value]"
        allow-custom custom-mode="append" custom-option-label="Sonstige" custom-label="Sonstige"
        custom-placeholder="Weiterer Verdachtshinweis" />
      <IonItem v-if="details.substances[substance.value].basis === 'confirmed'">
        <DodoInputText v-model="details.substances[substance.value].amount" label="Menge" placeholder="Menge angeben" />
      </IonItem>
    </template>

    <IonItem v-if="store.doku.xabcDe.intoxication.value">
      <DodoInputText v-model="store.doku.xabcDe.intoxication.value" label="Bisherige Angabe" />
    </IonItem>
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import { useDokuStore } from '@/store/doku'
import { intoxicationSubstances, intoxicationBasisOptions, intoxicationReasonRows } from '@/data/blocks/intoxikation'

const store = useDokuStore()
const modal = ref<InstanceType<typeof DodoItemModal>>()
defineExpose({ open: () => modal.value?.open() })
const details = computed(() => store.doku.textAreaBlocks.intoxikation.details)
const selectedSubstances = computed(() => intoxicationSubstances.filter(substance => details.value.substances[substance.value].enabled))
</script>

<style scoped>
.chip-container {
  padding-block: .5rem;
}
</style>
