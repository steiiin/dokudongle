<template>
  <div class="dd-list-article">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>

  .dd-list-article
  {

    margin: 0; padding: .5rem var(--padding-start);
    background: var(--ion-background-color);
    color: #999;

    &:deep(h1)
    {
      font-size: .8em;
      font-weight: bold;
      margin: 0; padding: 0;
      color: #b9b9b9;
    }

    &:deep(p)
    {
      font-size: .8em;
      margin: 0; padding: 0;
    }

  }

</style>
