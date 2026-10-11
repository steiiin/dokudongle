<template>
  <DodoTextSuggestionPanel
    :suggestions="scope?.suggestions.value ?? []"
    :has-snippet-start="scope?.hasSnippetStart.value ?? false"
    :can-start-snippet="scope?.canStartSnippet.value ?? false"
    @select="scope?.select($event)"
    @start-snippet="scope?.startSnippet()"
  />
</template>

<script setup lang="ts">
import DodoTextSuggestionPanel from '@/components/DodoTextSuggestionPanel.vue'
import { useTextSuggestionScope } from '@/services/text-suggestions'

const scope = useTextSuggestionScope()
</script>
