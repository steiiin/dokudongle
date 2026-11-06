<template>
  <IonCard>
    <IonCardHeader v-if="title">
      <IonCardTitle>{{ title }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent :class="{ 'card-in-card': cardInCard }">
      <slot />
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  cardInCard?: boolean
}>(), {
  title: '',
  cardInCard: false,
})
</script>
