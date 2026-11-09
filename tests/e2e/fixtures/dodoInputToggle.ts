import { createApp, defineComponent, h, ref } from 'vue'
import { IonicVue, IonApp, IonContent, IonList } from '@ionic/vue'
import DodoInputToggle from '../../../src/components/inputs/DodoInputToggle.vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.class.css'

const params = new URLSearchParams(location.search)
document.documentElement.classList.toggle('ion-palette-dark', params.has('dark'))

const cases: { id: string; disabled?: boolean }[] = [
  { id: 'default' },
  { id: 'disabled', disabled: true },
]

createApp(defineComponent({
  setup() {
    const checked = ref(false)
    const changes = ref(0)
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h(IonList, {}, () => cases.map(({ id, ...props }) => h(DodoInputToggle, {
        ...props,
        'data-case': id,
        modelValue: checked.value,
        'onUpdate:modelValue': (value: boolean) => { checked.value = value; changes.value += 1 },
      }, () => id))),
      h('output', { id: 'state' }, String(checked.value)),
      h('output', { id: 'changes' }, String(changes.value)),
    ]))
  },
})).use(IonicVue, { mode: params.get('mode') === 'ios' ? 'ios' : 'md' }).mount('#app')
