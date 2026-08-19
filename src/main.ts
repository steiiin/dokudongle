import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

/* Pinia */
import { createPinia } from 'pinia'
import { App as CapacitorApp } from '@capacitor/app'
import { useDokuStore } from '@/store/doku'
import { initStorage } from '@/store/persistence'
import { alertController, toastController } from '@ionic/core'
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
let isAutoResetFlowOpen = false

async function showAutoResetError(message: string) {
  const toast = await toastController.create({
    message,
    color: 'danger',
    duration: 5000,
    position: 'bottom',
  })
  await toast.present()
}

async function offerTemporaryProtocolRestore() {
  const dokuStore = useDokuStore(pinia)
  const toast = await toastController.create({
    message: 'Das Protokoll wurde nach 30 Minuten automatisch zurückgesetzt.',
    duration: 5000,
    position: 'bottom',
    buttons: [
      {
        text: 'Wiederherstellen',
        role: 'restore',
      },
    ],
  })

  await toast.present()
  const { role } = await toast.onDidDismiss()

  if (role === 'restore') {
    const restored = await dokuStore.restoreTemporaryProtocol()
    if (!restored) {
      await showAutoResetError('Das Protokoll konnte nicht wiederhergestellt werden.')
    }
    return
  }

  await dokuStore.discardTemporaryProtocol()
}

async function maybeHandleAutoProtocolReset() {
  const dokuStore = useDokuStore(pinia)
  if (isAutoResetFlowOpen) {
    return
  }

  const action = dokuStore.getAutoProtocolResetAction()
  if (action === 'none') {
    return
  }

  isAutoResetFlowOpen = true
  try {
    if (action === 'reset') {
      try {
        await dokuStore.autoResetProtocol()
      } catch (error) {
        console.error('Could not save and automatically reset the protocol.', error)
        await showAutoResetError('Das Protokoll konnte nicht automatisch zurückgesetzt werden.')
        return
      }

      await offerTemporaryProtocolRestore()
      return
    }

    const alert = await alertController.create({
      cssClass: 'protocol-reset-alert',
      header: 'Protokoll zurücksetzen?',
      message: 'Das letzte Zurücksetzen liegt mehr als 10 Minuten zurück. Möchtest du ein neues Protokoll starten?',
      buttons: [
        {
          text: 'Später',
          role: 'cancel',
        },
        {
          text: 'Zurücksetzen',
          role: 'reset',
        },
      ],
    })

    await alert.present()
    const { role } = await alert.onDidDismiss()
    if (role === 'reset') {
      try {
        await dokuStore.newProtocol()
      } catch (error) {
        console.error('Could not reset the protocol.', error)
        await showAutoResetError('Das Protokoll konnte nicht zurückgesetzt werden.')
      }
    } else {
      dokuStore.markAutoProtocolResetPrompted()
    }
  } finally {
    isAutoResetFlowOpen = false
  }
}

async function setupDokuPersistence() {
  await initStorage()

  const dokuStore = useDokuStore(pinia)
  await dokuStore.discardTemporaryProtocol()
  await dokuStore.hydrateFromStorage()
  await maybeHandleAutoProtocolReset()

  dokuStore.$subscribe(() => {
    if (persistTimer) {
      clearTimeout(persistTimer)
    }

    persistTimer = setTimeout(() => {
      void dokuStore.persistToStorage()
    }, PERSISTENCE_DEBOUNCE_MS)
  }, { detached: true })

  await CapacitorApp.addListener('resume', async () => {
    await dokuStore.hydrateFromStorage()
    await maybeHandleAutoProtocolReset()
  })
}

router.isReady().then(async () => {
  await setupDokuPersistence()
  app.mount('#app');
  await setupEdgeToEdge();
});
