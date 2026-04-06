<template>
  <IonApp>
    <div v-if="!isPreloaded" class="app-loading" role="status" aria-live="polite">
      <IonIcon :src="hourglassOutline"></IonIcon>
    </div>
    <IonRouterOutlet />
  </IonApp>
</template>
<script setup lang="ts">

import { onMounted, nextTick, ref } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { hourglassOutline } from 'ionicons/icons'

const isPreloaded = ref(false)
const router = useRouter()
const route = useRoute()

const ROUTE_PRELOAD_TARGETS = ['/tabs/connect', '/tabs/doku', '/tabs/preview']

async function waitForFrame() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

onMounted(async () => {
  await router.isReady()

  const initialPath = route.fullPath
  const preloadPaths = ROUTE_PRELOAD_TARGETS.filter((path, index, paths) => paths.indexOf(path) === index)

  for (const path of preloadPaths) {
    if (router.currentRoute.value.fullPath !== path) {
      await router.replace(path)
    }

    await nextTick()
    await waitForFrame()
  }

  if (router.currentRoute.value.fullPath !== initialPath) {
    await router.replace(initialPath)
    await nextTick()
    await waitForFrame()
  }

  isPreloaded.value = true
})

</script>
<style scoped>

.app-loading
{
  position: absolute;
  top: 0; left: 0;
  right: 0; bottom: 0;
  z-index: 999;
  background-color: var(--ion-background-color);
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-loading ion-icon {
  font-size: 2rem;
}

</style>