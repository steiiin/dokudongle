import { createApp, defineComponent, h, ref } from 'vue'
import { IonicVue, IonApp, IonContent } from '@ionic/vue'
import DodoPreviewEditor from '../../../src/components/protocol/DodoPreviewEditor.vue'
import { createPreviewDocument, editPreview, reconcilePreview, resolvePreviewDifference } from '../../../src/utils/preview-document'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/palettes/dark.always.css'

const extra = '\nWeitere Angaben bleiben unverändert.'.repeat(40)
createApp(defineComponent({
  setup() {
    const document = ref(editPreview(createPreviewDocument('Patient wach, ruhig.' + extra), 'Patient müde, ruhig.' + extra))
    return () => h(IonApp, {}, () => h(IonContent, {}, () => [
      h('button', { id: 'orientation', onClick: () => {
        document.value = createPreviewDocument('orientiert. ')
      } }, 'Orientierung'),
      h('button', { id: 'qualify', onClick: () => {
        document.value = reconcilePreview(document.value, 'teilweise orientiert. ')
      } }, 'Orientierung ändern'),
      h('button', { id: 'generate', onClick: () => {
        document.value = reconcilePreview(document.value, 'Patient schläfrig, unruhig.' + extra)
      } }, 'Formular ändern'),
      h('button', { id: 'delete', onClick: () => {
        document.value = reconcilePreview(document.value, 'Patient , unruhig.' + extra)
      } }, 'Wort entfernen'),
      h('div', { style: 'height: 70vh; margin-top: 1rem;' }, [h(DodoPreviewEditor, {
        document: document.value,
        onEdit: (text: string) => { document.value = editPreview(document.value, text) },
        onResolve: (id: string, choice: 'user' | 'generated') => {
          document.value = resolvePreviewDifference(document.value, id, choice)
        },
      })]),
    ]))
  },
})).use(IonicVue, { mode: 'md' }).mount('#app')
