import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

/* Pinia */
import { createPinia } from 'pinia'
const pinia = createPinia()

/* Erforderliche CSS-Grundlagen für die korrekte Funktion der Ionic-Komponenten */
import '@ionic/vue/css/core.css'

/* Grundlegende CSS-Stile für Ionic-Anwendungen */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optionale CSS-Hilfsklassen, die auskommentiert werden können */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Variablen für das Erscheinungsbild */
import '@ionic/vue/css/palettes/dark.always.css'
import './theme/variables.css'

/* Sicherer Anzeigebereich */
import { Capacitor } from '@capacitor/core'
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support'

async function setupEdgeToEdge() {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await EdgeToEdge.enable()
  } catch (error) {
    console.warn('Edge-to-edge init failed:', error)
  }
}

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(pinia)

// Synchron einhängen, damit die Webansicht beim Start immer sichtbare Inhalte hat.
app.mount('#app')
void setupEdgeToEdge()
