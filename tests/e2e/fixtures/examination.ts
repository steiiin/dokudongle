import { createApp, defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import DodoExaminationCard from '../../../src/components/DodoExaminationCard.vue'
import DodoExaminationItem from '../../../src/components/DodoExaminationItem.vue'
import DodoItemModal from '../../../src/components/DodoItemModal.vue'
import DodoInputSelect from '../../../src/components/DodoInputSelect.vue'
import AbcdeBreathingCard from '../../../src/views/dokuCards/abcdeCards/AbcdeBreathingCard.vue'
import AbcdeAirwayCard from '../../../src/views/dokuCards/abcdeCards/AbcdeAirwayCard.vue'

createApp(defineComponent({
  setup() {
    const assessedPresets = new URLSearchParams(location.search).has('presets')
    const modalAssessed = ref(false)
    const selectAssessed = ref(false)
    const value = ref<string | number>('Alpha')
    const modal = ref<InstanceType<typeof DodoItemModal>>()
    const select = ref<InstanceType<typeof DodoInputSelect>>()
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h(AbcdeAirwayCard),
      h(AbcdeBreathingCard),
      h(DodoExaminationCard, { title: 'Controls' }, () => [
        h(DodoExaminationItem, {
          assessedPresets, id: 'modal', label: 'Modal examination', assessed: modalAssessed.value,
          'onUpdate:assessed': (next: boolean) => { modalAssessed.value = next },
          onActivate: () => modal.value?.open(),
        }, () => h(DodoItemModal, { ref: modal, label: 'Details' }, () => h('p', 'Examination details'))),
        h(DodoExaminationItem, {
          assessedPresets, id: 'select', label: 'Select examination', assessed: selectAssessed.value,
          'onUpdate:assessed': (next: boolean) => { selectAssessed.value = next },
          onActivate: () => select.value?.open(),
          onRemove: () => { value.value = 'Alpha' },
        }, {
          picker: () => h('span', 'Select examination'),
          default: () => h(DodoInputSelect, {
            ref: select, label: 'Choice', options: ['Alpha', 'Beta'], modelValue: value.value,
            'onUpdate:modelValue': (next: string | number) => { value.value = next },
          }),
        }),
      ]),
    ]))
  },
})).use(IonicVue).use(createPinia()).mount('#app')
