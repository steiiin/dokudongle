import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

/* Pinia */
import { createPinia } from 'pinia'
import { App as CapacitorApp } from '@capacitor/app'
import { useDokuStore } from '@/store/doku'
import { initStorage } from '@/store/persistence'
const pinia = createPinia()

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import '@ionic/vue/css/palettes/dark.always.css'
import './theme/variables.css'

/* Safe-Space */
import { Capacitor } from '@capacitor/core'
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support'

async function setupEdgeToEdge() {
  if (Capacitor.getPlatform() !== 'android') return;
  try
  {
    await EdgeToEdge.enable();
  }
  catch (err)
  {
    console.warn('Edge-to-edge init failed:', err)
  }
}

/* create app */
const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(pinia);

const PERSISTENCE_DEBOUNCE_MS = 3000
let persistTimer: ReturnType<typeof setTimeout> | null = null

async function setupDokuPersistence() {
  await initStorage()

  const dokuStore = useDokuStore(pinia)
  await dokuStore.hydrateFromStorage()

  dokuStore.$subscribe((_mutation) => {
    if (persistTimer) {
      clearTimeout(persistTimer)
    }

    persistTimer = setTimeout(() => {
      void dokuStore.persistToStorage()
    }, PERSISTENCE_DEBOUNCE_MS)
  }, { detached: true })

  await CapacitorApp.addListener('resume', async () => {
    await dokuStore.hydrateFromStorage()
  })
}

router.isReady().then(async () => {
  await setupDokuPersistence()
  app.mount('#app');
  await setupEdgeToEdge();
});
