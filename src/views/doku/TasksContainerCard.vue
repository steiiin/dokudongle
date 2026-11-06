<template>
  <DodoContainerCard title="Aufgaben" card-in-card>

    <DodoContainerCard title="Maßnahmen" card-in-card
      v-show="ctx.allowInterventions || ctx.requireRedflags">
      <TaskInterventionsCard v-show="ctx.allowInterventions" />
      <TaskConsentCard v-show="ctx.requireRedflags" />
    </DodoContainerCard>
    <TaskCourseCard />
    <TaskRedflagsCard v-show="ctx.requireRedflags" />

  </DodoContainerCard>
</template>

<script setup lang="ts">

import TaskRedflagsCard from './tasks/TaskRedflagsCard.vue'
import TaskInterventionsCard from './tasks/TaskInterventionsCard.vue'
import TaskCourseCard from './tasks/TaskCourseCard.vue'
import TaskConsentCard from './tasks/TaskConsentCard.vue'

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
