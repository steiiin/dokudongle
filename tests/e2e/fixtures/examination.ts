import { createApp, defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.always.css'
import '../../../src/theme/variables.css'
import DodoExaminationCard from '../../../src/components/DodoExaminationCard.vue'
import DodoExaminationItem from '../../../src/components/DodoExaminationItem.vue'
import DodoItemModal from '../../../src/components/DodoItemModal.vue'
import DodoInputSelect from '../../../src/components/DodoInputSelect.vue'
import AbcdeBreathingCard from '../../../src/views/dokuCards/abcdeCards/AbcdeBreathingCard.vue'
import AbcdeAirwayCard from '../../../src/views/dokuCards/abcdeCards/AbcdeAirwayCard.vue'
import AbcdeCirculationCard from '../../../src/views/dokuCards/abcdeCards/AbcdeCirculationCard.vue'
import AbcdeDisabilityCard from '../../../src/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from '../../../src/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'
import AbcdeContainerCard from '../../../src/views/dokuCards/AbcdeContainerCard.vue'
import { useDokuStore } from '../../../src/store/doku'

const params = new URLSearchParams(location.search)

createApp(defineComponent({
  setup() {
    const disability = params.has('disability')
    const store = useDokuStore()
    store.doku.ident.age.timespan = 35
    const circulation = params.has('circulation')
    const exposure = params.has('exposure')
    if (params.has('nonverbal')) {
      store.doku.flavors.non_verbal = true
    }
    const modalAssessed = ref(false)
    const selectAssessed = ref(false)
    const value = ref<string | number>('Alpha')
    const modal = ref<InstanceType<typeof DodoItemModal>>()
    const select = ref<InstanceType<typeof DodoInputSelect>>()
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      ...(params.has('all') ? [h(AbcdeContainerCard)] : disability ? [h(AbcdeDisabilityCard)] : exposure ? [h(AbcdeExposureCard)] : circulation ? [h(AbcdeCirculationCard)] : [h(AbcdeAirwayCard), h(AbcdeBreathingCard)]),
      h('button', { id: 'toggle-nonverbal', onClick: () => store.setFlavor('non_verbal', !store.doku.flavors.non_verbal) }, 'Nonverbal wechseln'),
      h('pre', { id: 'report', style: { whiteSpace: 'pre-wrap' } }, store.generatedProtocol),
      h(DodoExaminationCard, { title: 'Controls' }, () => [
        h(DodoExaminationItem, {
          id: 'modal', label: 'Modal examination', assessed: modalAssessed.value,
          'onUpdate:assessed': (next: boolean) => { modalAssessed.value = next },
          onActivate: () => modal.value?.open(),
        }, () => h(DodoItemModal, { ref: modal, label: 'Details' }, () => h('p', 'Examination details'))),
        h(DodoExaminationItem, {
          id: 'select', label: 'Select examination', assessed: selectAssessed.value,
          'onUpdate:assessed': (next: boolean) => { selectAssessed.value = next },
          onActivate: () => select.value?.open(),
          onRemove: () => { value.value = 'Alpha' },
        }, {
          default: () => h(DodoInputSelect, {
            ref: select, label: 'Choice', options: ['Alpha', 'Beta'], modelValue: value.value,
            'onUpdate:modelValue': (next: string | number) => { value.value = next },
          }),
        }),
      ]),
    ]))
  },
})).use(IonicVue, { mode: params.get('mode') === 'ios' ? 'ios' : 'md' }).use(createPinia()).mount('#app')
