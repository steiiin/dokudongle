import { createApp, defineComponent, h, ref } from 'vue'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import DodoInputSaatreats from '../../../src/components/DodoInputSaatreats.vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.class.css'
import '../../../src/theme/variables.css'

document.documentElement.classList.toggle('ion-palette-dark', new URLSearchParams(location.search).has('dark'))

createApp(defineComponent({
  setup() {
    const selected = ref<string[]>([])
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h(DodoInputSaatreats, {
        modelValue: selected.value,
        'onUpdate:modelValue': (value: string[]) => { selected.value = value },
      }),
      h('output', { 'data-testid': 'saved' }, JSON.stringify(selected.value)),
    ]))
  },
})).use(IonicVue, { mode: 'md', animated: false }).mount('#app')
