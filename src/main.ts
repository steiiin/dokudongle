import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Pinia */
import { createPinia } from 'pinia'
const pinia = createPinia()

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import '@ionic/vue/css/palettes/dark.always.css';
import './theme/variables.css';

/* Safe-Space */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';

async function setupEdgeToEdge() {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    //await StatusBar.setOverlaysWebView({ overlay: true });
    await EdgeToEdge.enable();

  } catch (err) {
    console.warn('Edge-to-edge init failed:', err);
  }
}

async function applyStatusBarStyle() {
  const style = Style.Light;
  const color = '#1f1f1f';
  try {
    await StatusBar.setStyle({ style });
    await EdgeToEdge.setBackgroundColor({ color });
  } catch (err) {
    console.warn('Status bar style update failed:', err);
  }
}

/* create app */
const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(pinia);

router.isReady().then(async () => {
  app.mount('#app');
  await setupEdgeToEdge();
  await applyStatusBarStyle();
});
