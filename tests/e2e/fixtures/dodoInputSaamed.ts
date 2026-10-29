import { createApp, defineComponent, h, ref } from 'vue'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import DodoInputSaamed from '../../../src/components/DodoInputSaamed.vue'
import { ConsentMedTask } from '../../../src/types/lists/saamed'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.class.css'
import '../../../src/theme/variables.css'

document.documentElement.classList.toggle('ion-palette-dark', new URLSearchParams(location.search).has('dark'))

createApp(defineComponent({
  setup() {
    const tasks = ref([new ConsentMedTask('adrenalin', 'anaphylaxie', '', true, '', '')])
    return () => h(IonApp, {}, () => h(IonContent, {}, () => h(DodoInputSaamed, {
      modelValue: tasks.value,
      'onUpdate:modelValue': (value: ConsentMedTask[]) => { tasks.value = value },
    })))
  },
})).use(IonicVue, { mode: 'md', animated: false }).mount('#app')
