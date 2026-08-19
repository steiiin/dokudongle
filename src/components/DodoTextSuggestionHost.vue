<template>
  <DodoTextSuggestionPanel
    :suggestions="scope?.suggestions.value ?? []"
    @select="scope?.select($event)"
  />
</template>

<script setup lang="ts">
import DodoTextSuggestionPanel from '@/components/DodoTextSuggestionPanel.vue'
import { useTextSuggestionScope } from '@/services/text-suggestions'

const scope = useTextSuggestionScope()
</script>
