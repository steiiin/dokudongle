import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.always.css'
import '../../../src/theme/variables.css'
import DodoContainerCard from '../../../src/components/ui/DodoContainerCard.vue'
import SampleContactsCard from '../../../src/views/doku/sample/SampleContactsCard.vue'
import SampleRepresentationCard from '../../../src/views/doku/sample/SampleRepresentationCard.vue'
import { useDokuStore } from '../../../src/store/doku'

const mode = new URLSearchParams(location.search).get('mode') === 'ios' ? 'ios' : 'md'
createApp(defineComponent({
  setup() {
    const store = useDokuStore()
    store.doku.redflags.noTransportType = 'BvO'
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h(DodoContainerCard, { title: 'SAMPLE(R)', cardInCard: true }, () => [
        h(SampleContactsCard), h(SampleRepresentationCard),
      ]),
      h('pre', { id: 'report', style: { whiteSpace: 'pre-wrap' } }, store.generatedProtocol),
    ]))
  },
})).use(IonicVue, { mode }).use(createPinia()).mount('#app')
