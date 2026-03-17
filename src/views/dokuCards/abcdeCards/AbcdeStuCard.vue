<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>STU - Schnelle Trauma Untersuchung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <IonCard class="stu-head">

        <IonCardHeader>
          <IonCardTitle>Kopf</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>

            <IonItem>
              <IonToggle v-model="store.doku.xabcdeStu.head.isInjured" label-placement="end">
                Verletzungen sichtbar?
              </IonToggle>
            </IonItem>

            <template v-if="store.doku.xabcdeStu.head.isInjured">

              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.head.wasInitiallyUnconscious" label-placement="end">
                  Initial Bewusstlos?
                </IonToggle>
              </IonItem>

              <DodoInputSelect v-model="store.doku.xabcdeStu.head.Amnesia"
                label="Amnesie" lines="full"
                :options="[
                  { value: '', label: 'Keine' },
                  { value: 'retrograd', label: 'Retrograd' },
                  { value: 'anterograd', label: 'Anterograd' },
                  { value: 'beides', label: 'Beides' },
                ]">
              </DodoInputSelect>

              <DodoInputSelect v-if="ctx.hasHeadache && !ctx.isNonVerbal"
                v-model="store.doku.xabcdeStu.head.headacheType"
                label="Kopfschmerzen" lines="full"
                :options="[
                  { value: 'global', label: 'Ganzer Kopf' },
                  { value: 'local', label: 'Im Bereich der Wunde' },
                ]">
              </DodoInputSelect>

              <DodoInputSelect v-if="ctx.hasHeadache && !ctx.isNonVerbal"
                v-model="store.doku.xabcdeStu.head.Anisocoria"
                label="Anisokorie" lines="full"
                :options="[
                  { value: '', label: 'Seitengleich' },
                  { value: 'li_gt_re', label: 'Li > Re' },
                  { value: 're_gt_li', label: 'Re > Li' },
                ]">
              </DodoInputSelect>

            </template>

          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard class="stu-spine">

        <IonCardHeader>
          <IonCardTitle>Wirbelsäule</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>

            <template v-if="!isImmoRotGcs && !isImmoRotNeuro">

              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.spine.hasObviousSevereInjury" label-placement="end">
                  Offensichtlich Schwerverletzt?
                </IonToggle>
              </IonItem>

              <template v-if="!isImmoRotSevere">

                <IonItem>
                  <IonToggle v-model="store.doku.xabcdeStu.spine.needPainTreatment" label-placement="end">
                    Wirbelsäulenschmerz (NRS &ge; 5)?
                  </IonToggle>
                </IonItem>

                <template v-if="!isImmoRotPain && !isImmoYellowAge">

                  <IonItem>
                    <IonToggle v-model="store.doku.xabcdeStu.spine.hasFallFromOver3m" label-placement="end">
                      Sturz &gt; 3m?
                    </IonToggle>
                  </IonItem>

                  <template v-if="!isImmoYellowFall">

                    <IonItem>
                      <IonToggle v-model="store.doku.xabcdeStu.spine.hasHeadOrNeckInjury" label-placement="end">
                        Supraklavikuläre Verletzung?
                      </IonToggle>
                    </IonItem>

                    <template v-if="!isImmoYellowSupraclavicular">

                      <IonItem lines="none">
                        <IonToggle v-model="store.doku.xabcdeStu.spine.hasSevereThoracoabdominalInjury" label-placement="end">
                          Schwere thorakoabdominelle Verletzung?
                        </IonToggle>
                      </IonItem>

                    </template>
                  </template>
                </template>
              </template>
            </template>

            <IonItem lines="none">
              <IonLabel>
                <h3>{{ immoAmpelInfo.title }}</h3>
                <p>{{ immoAmpelInfo.desc }}</p>
              </IonLabel>
            </IonItem>
          </IonList>

        </IonCardContent>
      </IonCard>

      <IonCard class="stu-thorax">
        <IonCardHeader>
          <IonCardTitle>Thorax</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>

            <IonItem lines="none">
              <IonToggle v-model="store.doku.xabcdeStu.thorax.hasUnstableChestWall" label-placement="end">
                Instabilität?
              </IonToggle>
            </IonItem>

          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard class="stu-pelvis">
        <IonCardHeader>
          <IonCardTitle>Becken</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>

            <IonItem>
              <IonToggle v-model="store.doku.xabcdeStu.pelvis.hasHemodynamicInstability" label-placement="end">
                Patient schockig?
              </IonToggle>
            </IonItem>

            <template v-if="store.doku.xabcdeStu.pelvis.hasHemodynamicInstability">

              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.pelvis.hasHighEnergyMechanism" label-placement="end">
                  Kinematik plausibel?
                </IonToggle>
              </IonItem>

              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.pelvis.hasObviousInjuries" label-placement="end">
                  Sichtbare Verletzung?
                </IonToggle>
              </IonItem>

              <DodoInputSelect v-model="store.doku.xabcdeStu.pelvis.PelvisPainOccurence"
                label="Schmerzen Becken" lines="full"
                :options="[
                  { value: '', label: 'Keine' },
                  { value: 'spontan', label: 'Spontan' },
                  { value: 'palpation', label: 'Bei Palpation' },
                ]">
              </DodoInputSelect>

            </template>

          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard class="stu-limbs">
        <IonCardHeader>
          <IonCardTitle>Extremitäten</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList lines="none">

            <DodoItemModal
              label="Linker Arm" modal-label="Linker Arm"
              description="XX">
              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.limbs.armLeft.assessed" label-placement="end">
                  Verletzt?
                </IonToggle>
              </IonItem>
              <DodoInputTextOptional
                toggle-label="pDMS gestört?" v-model:toggle="store.doku.xabcdeStu.limbs.armLeft.value.deficit.active"
                text-label="Beschreibung:" text-placeholder="z.B. Kribbeln" v-model:text="store.doku.xabcdeStu.limbs.armLeft.value.deficit.value"
                :autocorrect-fn="basicCap">
              </DodoInputTextOptional>
            </DodoItemModal>

            <DodoItemModal
              label="Linker Arm" modal-label="Linker Arm"
              description="XX">
              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.limbs.armLeft.assessed" label-placement="end">
                  Verletzt?
                </IonToggle>
              </IonItem>
              <DodoInputTextOptional
                toggle-label="pDMS gestört?" v-model:toggle="store.doku.xabcdeStu.limbs.armLeft.value.deficit.active"
                text-label="Beschreibung:" text-placeholder="z.B. Kribbeln" v-model:text="store.doku.xabcdeStu.limbs.armLeft.value.deficit.value"
                :autocorrect-fn="basicCap">
              </DodoInputTextOptional>
            </DodoItemModal>

            <DodoItemModal
              label="Linker Arm" modal-label="Linker Arm"
              description="XX">
              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.limbs.armLeft.assessed" label-placement="end">
                  Verletzt?
                </IonToggle>
              </IonItem>
              <DodoInputTextOptional
                toggle-label="pDMS gestört?" v-model:toggle="store.doku.xabcdeStu.limbs.armLeft.value.deficit.active"
                text-label="Beschreibung:" text-placeholder="z.B. Kribbeln" v-model:text="store.doku.xabcdeStu.limbs.armLeft.value.deficit.value"
                :autocorrect-fn="basicCap">
              </DodoInputTextOptional>
            </DodoItemModal>

            <DodoItemModal
              label="Linker Arm" modal-label="Linker Arm"
              description="XX">
              <IonItem>
                <IonToggle v-model="store.doku.xabcdeStu.limbs.armLeft.assessed" label-placement="end">
                  Verletzt?
                </IonToggle>
              </IonItem>
              <DodoInputTextOptional
                toggle-label="pDMS gestört?" v-model:toggle="store.doku.xabcdeStu.limbs.armLeft.value.deficit.active"
                text-label="Beschreibung:" text-placeholder="z.B. Kribbeln" v-model:text="store.doku.xabcdeStu.limbs.armLeft.value.deficit.value"
                :autocorrect-fn="basicCap">
              </DodoInputTextOptional>
            </DodoItemModal>

          </IonList>
        </IonCardContent>
      </IonCard>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

import { IMMO_AMPEL_INFOOBJ } from '@/types/protocol/abcde'
import { basicCap } from '@/utils/autocorrect/basic'

const isImmoRotSevere = computed(() => store.doku.xabcdeStu.spine.hasObviousSevereInjury)
const isImmoRotGcs = computed(() => ctx.value.gcs <= 12 && !ctx.value.isBaseline)
const isImmoRotNeuro = computed(() => (ctx.value.hasSensomotoricDeficit) && !ctx.value.isBaseline)
const isImmoRotPain = computed(() => store.doku.xabcdeStu.spine.needPainTreatment)
const isImmoYellowAge = computed(() => ctx.value.isGeriatric)
const isImmoYellowFall = computed(() => store.doku.xabcdeStu.spine.hasFallFromOver3m)
const isImmoYellowSupraclavicular = computed(() => store.doku.xabcdeStu.spine.hasHeadOrNeckInjury)
const isImmoYellowThorakoAbdominal = computed(() => store.doku.xabcdeStu.spine.hasSevereThoracoabdominalInjury)

const gcsNote = computed(() => {
  const baseline = ctx.value.isBaseline ? ' (Baseline)' : ''
  return `GCS ${ctx.value.gcs}${baseline}`
})

const neuroNote = computed(() => {
  return ctx.value.hasSensomotoricDeficit
    ? 'Defizit vorhanden'
    : 'kein Defizit'
})

const immoAmpelInfo = computed(() => {
  if (isImmoRotSevere.value) { return IMMO_AMPEL_INFOOBJ.severeInjury }
  if (isImmoRotGcs.value) { return IMMO_AMPEL_INFOOBJ.gcs }
  if (isImmoRotNeuro.value) { return IMMO_AMPEL_INFOOBJ.neuro }
  if (isImmoRotPain.value) { return IMMO_AMPEL_INFOOBJ.pain }
  if (isImmoYellowAge.value) { return IMMO_AMPEL_INFOOBJ.age }
  if (isImmoYellowFall.value) { return IMMO_AMPEL_INFOOBJ.fall }
  if (isImmoYellowSupraclavicular.value) { return IMMO_AMPEL_INFOOBJ.supraclavicular }
  if (isImmoYellowThorakoAbdominal.value) { return IMMO_AMPEL_INFOOBJ.thorakoAbdominal }
  return IMMO_AMPEL_INFOOBJ.green
})

// watch(() => store.doku.stu.Pelvis.hasHemodynamicInstability, () => {
//   store.doku.stu.Pelvis.hasHighEnergyMechanism = false
//   store.doku.stu.Pelvis.hasObviousInjuries = false
//   store.doku.stu.Pelvis.PelvisPainOccurence = ''
// })

// watch(() => botStore.isNonVerbal, (v) => {
//   if (v && store.doku.stu.Pelvis.PelvisPainOccurence != '') {
//     store.doku.stu.Pelvis.PelvisPainOccurence = ''
//   }
// })

</script>
