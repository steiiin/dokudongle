<template>
  <div>

    <IonCard class="stu-head">

      <IonCardHeader>
        <IonCardTitle>Kopf</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>

          <IonItem :lines="fullIf(store.doku.sampler.symptoms.trauma.head.isInjured)">
            <IonToggle v-model="store.doku.sampler.symptoms.trauma.head.isInjured" label-placement="end">
              Verletzungen sichtbar?
            </IonToggle>
          </IonItem>

          <template v-if="store.doku.sampler.symptoms.trauma.head.isInjured">

            <IonItem lines="inset">
              <IonToggle v-model="store.doku.sampler.symptoms.trauma.head.wasInitiallyUnconscious" label-placement="end">
                Initial Bewusstlos?
              </IonToggle>
            </IonItem>

            <DodoInputSelect v-model="store.doku.sampler.symptoms.trauma.head.Amnesia"
              label="Amnesie" :lines="isSHTStateVisible ? (store.context.hasHeadache ? 'inset' : 'full') : 'none'"
              :options="[
                { value: '', label: 'Keine' },
                { value: 'retrograd', label: 'Retrograd' },
                { value: 'anterograd', label: 'Anterograd' },
                { value: 'beides', label: 'Beides' },
              ]">
            </DodoInputSelect>

            <template v-if="ctx.hasHeadache">

              <DodoInputSelect v-if="!ctx.isNonVerbal"
                v-model="store.doku.sampler.symptoms.trauma.head.headacheType"
                label="Kopfschmerzen" lines="inset"
                :options="[
                  { value: 'global', label: 'Ganzer Kopf' },
                  { value: 'local', label: 'Im Bereich der Wunde' },
                ]">
              </DodoInputSelect>

            </template>

            <DodoInputSelect v-if="ctx.isNonVerbal"
              v-model="store.doku.sampler.symptoms.trauma.head.Anisocoria"
              label="Anisokorie" lines="full"
              :options="[
                { value: '', label: 'Seitengleich' },
                { value: 'li_gt_re', label: 'Li > Re' },
                { value: 're_gt_li', label: 'Re > Li' },
              ]">
            </DodoInputSelect>

            <DodoStateItem
              :title="store.doku.sampler.symptoms.trauma.head.headState.title"
              :description="store.doku.sampler.symptoms.trauma.head.headState.description">
            </DodoStateItem>

          </template>

        </IonList>
      </IonCardContent>
    </IonCard>

    <IonCard class="stu-spine">

      <IonCardHeader>
        <IonCardTitle>Wirbelsäule</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList lines="inset">

          <IonItem :lines="stepline(store.doku.sampler.symptoms.trauma.spine.hasObviousSevereInjury)">
            <IonToggle v-model="store.doku.sampler.symptoms.trauma.spine.hasObviousSevereInjury" label-placement="end">
              Offensichtlich Schwerverletzt?
            </IonToggle>
          </IonItem>

          <template v-if="!store.doku.sampler.symptoms.trauma.spine.hasObviousSevereInjury">

            <IonItem :lines="stepline(store.doku.sampler.symptoms.trauma.spine.needPainTreatment)">
              <IonToggle v-model="store.doku.sampler.symptoms.trauma.spine.needPainTreatment" label-placement="end">
                Wirbelsäulenschmerz <b>(NRS &ge; 5)</b>?
              </IonToggle>
            </IonItem>

            <template v-if="!store.doku.sampler.symptoms.trauma.spine.needPainTreatment">

              <IonItem :lines="stepline(store.doku.sampler.symptoms.trauma.spine.hasFallFromOver3m)">
                <IonToggle v-model="store.doku.sampler.symptoms.trauma.spine.hasFallFromOver3m" label-placement="end">
                  Sturz <b>&gt; 3m</b>?
                </IonToggle>
              </IonItem>

              <template v-if="!store.doku.sampler.symptoms.trauma.spine.hasFallFromOver3m">

                <IonItem :lines="stepline(store.doku.sampler.symptoms.trauma.spine.hasSupraclavicularInjury)">
                  <IonToggle v-model="store.doku.sampler.symptoms.trauma.spine.hasSupraclavicularInjury" label-placement="end">
                    Supraklavikuläre Verletzung?
                  </IonToggle>
                </IonItem>

                <template v-if="!store.doku.sampler.symptoms.trauma.spine.hasSupraclavicularInjury">

                  <IonItem lines="full">
                    <IonToggle v-model="store.doku.sampler.symptoms.trauma.spine.hasSevereThoracoabdominalInjury" label-placement="end">
                      Schwere thorakoabdominelle Verletzung?
                    </IonToggle>
                  </IonItem>

                </template>

              </template>

            </template>

          </template>

          <DodoStateItem :lines="store.doku.sampler.symptoms.trauma.spine.isImmoYellow ? 'full' : 'none'"
            :title="store.doku.sampler.symptoms.trauma.spine.immoState.title"
            :description="store.doku.sampler.symptoms.trauma.spine.immoState.description">
          </DodoStateItem>

          <template v-if="store.doku.sampler.symptoms.trauma.spine.isImmoYellow">

            <DodoInputSelect v-model="store.doku.sampler.symptoms.trauma.spine.usedImmo"
              label="Immobilisierung" lines="inset"
              :options="[
                { value: '', label: 'Gar nicht' },
                { value: 'Vakuummatratze/Headblock', label: 'VM+Headblock' },
                { value: 'Vakuummatratze/StifNeck', label: 'VM+StifNeck' },
                { value: 'Spineboard/Headblock', label: 'Spineboard' },
                { value: 'Vakuummatratze während Transport', label: 'VM beim Transport' },
                { value: 'Komfortlagerung', label: 'Komfortlagerung' },
              ]"
              allow-custom custom-label="Womit?" custom-placeholder="z.B. Unterpolsterung"
              :autocorrect-fn="basicCap">
            </DodoInputSelect>

            <DodoInputSelect v-model="store.doku.sampler.symptoms.trauma.spine.usedExtrication"
              label="Extraktion" lines="none"
              :options="[
                { value: '', label: 'Nicht Notwendig' },
                { value: 'SelfExtrication', label: 'Selbstbefreiung' },
                { value: 'achsengerechte Umlagerung', label: 'Achsengerechte Umlagerung' },
              ]"
              allow-custom custom-label="Wie?" custom-placeholder="z.B. Rettung durch Höhenrettung"
              :autocorrect-fn="basicCap">
            </DodoInputSelect>

          </template>

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
            <IonToggle v-model="store.doku.sampler.symptoms.trauma.thorax.hasUnstableChestWall" label-placement="end">
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

          <IonItem :lines="fullIf(store.doku.sampler.symptoms.trauma.pelvis.hasHemodynamicInstability)">
            <IonToggle v-model="store.doku.sampler.symptoms.trauma.pelvis.hasHemodynamicInstability" label-placement="end">
              Patient schockig?
            </IonToggle>
          </IonItem>

          <template v-if="store.doku.sampler.symptoms.trauma.pelvis.hasHemodynamicInstability">

            <IonItem>
              <IonToggle v-model="store.doku.sampler.symptoms.trauma.pelvis.hasHighEnergyMechanism" label-placement="end">
                Kinematik plausibel?
              </IonToggle>
            </IonItem>

            <IonItem>
              <IonToggle v-model="store.doku.sampler.symptoms.trauma.pelvis.hasObviousInjuries" label-placement="end">
                Sichtbare Verletzung?
              </IonToggle>
            </IonItem>

            <DodoInputSelect v-model="store.doku.sampler.symptoms.trauma.pelvis.PelvisPainOccurence"
              label="Schmerzen Becken" lines="none"
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

          <DodoInputSampleLimb v-model="store.doku.sampler.symptoms.trauma.limbs.armLeft"
            label="Linker Arm" lines="inset">
          </DodoInputSampleLimb>
          <DodoInputSampleLimb v-model="store.doku.sampler.symptoms.trauma.limbs.armRight"
            label="Rechter Arm" lines="inset">
          </DodoInputSampleLimb>
          <DodoInputSampleLimb v-model="store.doku.sampler.symptoms.trauma.limbs.legLeft"
            label="Linkes Bein" lines="inset">
          </DodoInputSampleLimb>
          <DodoInputSampleLimb v-model="store.doku.sampler.symptoms.trauma.limbs.legRight"
            label="Rechtes Bein" lines="none">
          </DodoInputSampleLimb>

        </IonList>
      </IonCardContent>
    </IonCard>

  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'

import { basicCap } from '@/utils/autocorrect/basic'
import { fullIf } from '@/utils/filter'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const stepline = (expr: boolean) => expr ? 'full' : 'inset'

// ############################################################################

const isSHTStateVisible = computed(() => !!store.doku.sampler.symptoms.trauma.head.headState.title)

</script>
