<template>
  <IonApp>
    <main v-if="startup.state.status === 'loading'" class="startup-screen" role="status" aria-live="polite">
      <span class="startup-hourglass" aria-hidden="true">⌛</span>
      <p>DokuDongle wird geladen …</p>
    </main>

    <main v-else-if="startup.state.status === 'error'" class="startup-screen startup-error" role="alert">
      <h1>Start fehlgeschlagen</h1>
      <p>{{ startup.state.errorMessage }}</p>
      <button type="button" @click="startup.reload">App neu laden</button>
    </main>

    <IonRouterOutlet v-else />
  </IonApp>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { IonApp, IonRouterOutlet } from '@ionic/vue'

import { appStartup } from '@/services/app-startup'

const startup = appStartup

const waitForFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

onMounted(async () => {
  // Commit the loading shell before releasing the native splash screen.
  await nextTick()

  if (Capacitor.isNativePlatform()) {
    void SplashScreen.hide()
      .catch(error => console.warn('[startup] Could not hide the native splash screen.', error))
  }

  // Give the web view a paint opportunity before storage or route work begins.
  await waitForFrame()
  void startup.start()
})
</script>

<style scoped>
.startup-screen {
  position: absolute;
  inset: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  box-sizing: border-box;
  padding: 2rem;
  background-color: var(--ion-background-color, #121212);
  color: var(--ion-text-color, #fff);
  text-align: center;
}

.startup-screen p,
.startup-screen h1 {
  margin: 0;
}

.startup-hourglass {
  font-size: 2rem;
}

.startup-error h1 {
  font-size: 1.35rem;
}

.startup-error p {
  max-width: 32rem;
  line-height: 1.5;
}

.startup-error button {
  min-height: 44px;
  border: 0;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  background: var(--ion-color-primary, #4d8dff);
  color: var(--ion-color-primary-contrast, #000);
  font: inherit;
  font-weight: 600;
}
</style>
