<template>
  <IonCard class="card-sample">
    <IonCardHeader>
      <IonCardTitle>Medikamente</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList>

        <IonItem lines="full" v-if="ctx.isTrauma">
          <IonSelect label="Tetanus" interface="popover" v-model="store.doku.sampler.medication.TetanusStatus">
            <IonSelectOption value="">Keine Wunden</IonSelectOption>
            <IonSelectOption value="unklar">Unklar</IonSelectOption>
            <IonSelectOption value="nein">Abgelaufen</IonSelectOption>
            <IonSelectOption value="ja">Auf Stand</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem :lines="sampleMedOnMajor ? 'full' : 'none'">
          <IonSelect label="Medikamente" interface="popover" v-model="store.doku.sampler.medication.level">
            <IonSelectOption value="">Keine</IonSelectOption>
            <IonSelectOption value="unknown">Unklar</IonSelectOption>
            <IonSelectOption value="minor">Alltagsmedikation</IonSelectOption>
            <IonSelectOption value="major">Dauermedikation</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem lines="full" v-if="sampleMedOnMajor" class="med-flags">

          <DodoInputChip v-model="store.doku.sampler.medication.Flags.oak"
            placeholder="OAK" color="danger"
            :options="[
              { value: 'Apixaban', label: 'Eliquis/Apixaban' },
              { value: 'Rivaroxaban', label: 'Xarelto/Rivaroxaban' },
              { value: 'Dabigatran', label: 'Pradaxa/Dabigatran' },
              { value: 'Edoxaban', label: 'Lixiana/Edoxaban' },
              { value: 'VKA', label: 'Marcumar/Falithrom/Warfarin' },
            ]">
          </DodoInputChip>

          <DodoInputChip v-model="store.doku.sampler.medication.Flags.tah"
            placeholder="TAH" color="warning"
            :options="[
              { value: 'ASS', label: 'Aspirin/ASS' },
              { value: 'Clopidogrel', label: 'Plavix/Clopidogrel' },
              { value: 'Ticagrelor', label: 'Brilique/Ticagrelor' },
              { value: 'Prasugrel', label: 'Prasugrel' },
              { value: 'Dipyridamol', label: 'Asasantin/Dipyridamol' },
            ]">
          </DodoInputChip>

          <DodoToggleChip v-model="store.doku.sampler.medication.Flags.insulin"
            color="primary">
            Insulinpflichtig
          </DodoToggleChip>

          <!-- <DodoToggleChip
            v-for="flag in sampleMedFlags"
            :key="flag.name"
            :color="flag.color"
            :model-value="isActiveFlag(flag.name)"
            @update:modelValue="setMedFlag(flag.name, $event)"
          >
            {{ flag.name }}
          </DodoToggleChip> -->
        </IonItem>

        <IonItem v-if="sampleMedOnMajor" :lines="noneIf(store.doku.sampler.medication.isPlanAvailable)">
          <IonToggle v-model="store.doku.sampler.medication.isPlanAvailable" label-placement="end">MedPlan vorhanden?</IonToggle>
        </IonItem>
        <DodoMedInput v-if="sampleMedOnMajor && !store.doku.sampler.medication.isPlanAvailable" lines="none" v-model="store.doku.sampler.medication.PlanMedication">
        </DodoMedInput>

        <IonItem lines="none" v-if="sampleMedOnMinor">
          <DodoInputText ref="inputMinormedDescription"
            v-model="store.doku.sampler.medication.MinormedDescription"
            label="Einnahme von:" placeholder="z.B. Pille"
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
import { fullIf, noneIf } from '@/utils/filter'
const store = useDokuStore()
const ctx = computed(() => store.context)

const inputMinormedDescription = ref<any | null>(null)

watch(() => store.doku.sampler.medication.level, async (newV, oldV) => {
  if (newV != oldV) {
    store.doku.sampler.medication.PlanMedication = []
    store.doku.sampler.medication.isPlanAvailable = true
    store.doku.sampler.medication.MinormedDescription = ''
  }
  if (newV == 'minor') {
    setTimeout(() => { inputMinormedDescription.value?.$el.setFocus() }, 300)
  }
})

const sampleMedOnMinor = computed(() => store.doku.sampler.medication.level == 'minor')
const sampleMedOnMajor = computed(() => store.doku.sampler.medication.level == 'major')

watch(() => ctx.value.isTrauma, () => {
  store.doku.sampler.medication.TetanusStatus = ''
})

</script>
<style scoped>
ion-card {
  --card-bg: #308744;
}
.med-flags::part(container) {
  flex-wrap: wrap;
}
</style>