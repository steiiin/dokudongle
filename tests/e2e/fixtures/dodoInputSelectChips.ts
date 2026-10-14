import { createApp, defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue, IonApp, IonContent, IonList } from '@ionic/vue'
import DodoInputSelectChips from '../../../src/components/DodoInputSelectChips.vue'
import type { SelectValue } from '../../../src/components/DodoInputSelect.vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.class.css'

document.documentElement.classList.toggle('ion-palette-dark', new URLSearchParams(location.search).has('dark'))

createApp(defineComponent({
  setup() {
    const values = ref<SelectValue[]>([])
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h(IonList, {}, () => h(DodoInputSelectChips, {
        label: 'Auswahl mit ausführlicher Beschreibung',
        description: 'Mehrere Werte auswählen oder einen eigenen Wert eingeben.',
        modelValue: values.value,
        'onUpdate:modelValue': (next: SelectValue[]) => { values.value = next },
        options: [
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          [
            'Ein sehr langer Wert mit mehreren Wörtern und zusätzlicher Beschreibung',
            'EinSehrLangerZusammenhängenderWertOhneLeerzeichenFürDenUmbruchAufKleinenBildschirmen',
          ],
        ],
        allowCustom: true,
        customLabel: 'Eigener Wert',
      })),
      h('output', { id: 'selection' }, JSON.stringify(values.value)),
    ]))
  },
})).use(IonicVue).use(createPinia()).mount('#app')
