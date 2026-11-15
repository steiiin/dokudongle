import { IonButton, IonPopover } from '@ionic/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import DodoPreviewEditor from '@/components/protocol/DodoPreviewEditor.vue'
import { createPreviewDocument, editPreview, reconcilePreview, resolvePreviewConflict, resolvePreviewDifference, type PreviewDocument } from '@/utils/preview-document'

const conflictDocument = () => reconcilePreview(editPreview(createPreviewDocument('Patient wach.'), 'Patient müde.'), 'Patient schläfrig.')
function mountEditor(document: PreviewDocument = conflictDocument()) {
  const wrapper = mount(DodoPreviewEditor, {
    props: { document },
    global: { stubs: { IonPopover: true, IonButton: true }, renderStubDefaultSlot: true },
  })
  return wrapper
}

function mountLiveEditor(initial = createPreviewDocument('Patient wach.')) {
  return mount(defineComponent({
    setup() {
      const document = ref(initial)
      return () => h(DodoPreviewEditor, {
        document: document.value,
        onEdit: text => { document.value = editPreview(document.value, text) },
        onResolve: (id, choice) => { document.value = resolvePreviewDifference(document.value, id, choice) },
      })
    },
  }), {
    global: { stubs: { IonPopover: true, IonButton: true }, renderStubDefaultSlot: true },
  }).getComponent(DodoPreviewEditor)
}

describe('editable preview', () => {
  test('edits multiline text directly without interpreting pasted markup', async () => {
    const wrapper = mountLiveEditor(createPreviewDocument('Generated'))
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('readonly')).toBeUndefined()
    await textarea.setValue('Edited\n<b>plain text</b>\n🙂')
    expect(wrapper.emitted('edit')?.at(-1)).toEqual(['Edited\n<b>plain text</b>\n🙂'])
    expect(wrapper.get('[data-difference-id]').text()).toBe('Edited\n<b>plain text</b>\n🙂')
    expect(wrapper.find('b').exists()).toBe(false)
  })

  test.each(['user', 'generated'] as const)('offers both alternatives and emits the %s choice', async choice => {
    const wrapper = mountEditor()
    await wrapper.get('[data-conflict-id]').trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    expect(wrapper.text()).toContain('müde')
    expect(wrapper.text()).toContain('schläfrig')
    const buttons = wrapper.findAllComponents(IonButton)
    expect(buttons.map(button => [button.text(), button.props('color')])).toEqual([
      ['Eigener Text', 'success'], ['Neuer Text', 'danger'],
    ])
    await buttons[choice === 'user' ? 0 : 1].trigger('click')
    expect(wrapper.emitted('resolve')).toEqual([[wrapper.props('document').conflicts[0].id, choice]])
  })

  test('supports keyboard activation and deletion markers without adding text', async () => {
    const document = reconcilePreview(editPreview(createPreviewDocument('A B C'), 'A X C'), 'A C')
    const wrapper = mountEditor(document)
    const marker = wrapper.get('.deletion')
    expect(marker.attributes('data-change-type')).toBe('conflict')
    expect(marker.attributes('tabindex')).toBe('0')
    expect(wrapper.get('textarea').element.value).toBe('A C')
    await marker.trigger('keydown', { key: 'Enter' })
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    expect(wrapper.findAllComponents(IonButton).map(button => button.text())).toEqual(['Eigener Text', 'Neuer Text'])
    expect(resolvePreviewConflict(document, document.conflicts[0].id, 'user').text).toBe('A X C')
  })

  test('commits IME composition once complete', async () => {
    const wrapper = mountEditor(createPreviewDocument(''))
    const textarea = wrapper.get('textarea')
    await textarea.trigger('compositionstart')
    textarea.element.value = 'ä'
    await textarea.trigger('input', { isComposing: true })
    expect(wrapper.emitted('edit')).toBeUndefined()
    await textarea.trigger('compositionend')
    expect(wrapper.emitted('edit')).toEqual([['ä']])
  })

  test('keeps the caret anchored when generated text is inserted before it', async () => {
    const wrapper = mountEditor(createPreviewDocument('Patient wach.'))
    wrapper.get('textarea').element.setSelectionRange(8, 8)
    await wrapper.setProps({ document: createPreviewDocument('Heute: Patient wach.') })
    await flushPromises()
    expect(wrapper.get('textarea').element.selectionStart).toBe(15)
  })

  test('does not allow conflict resolution during transmission', async () => {
    const wrapper = mountEditor()
    await wrapper.setProps({ readonly: true })
    expect(wrapper.get('textarea').attributes('readonly')).toBeDefined()
    await wrapper.get('[data-conflict-id]').trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
  })

  test('updates replacement markings on each input and offers only restoration', async () => {
    const wrapper = mountLiveEditor()
    const textarea = wrapper.get('textarea')
    expect(wrapper.find('[data-difference-id]').exists()).toBe(false)
    for (const word of ['w', 'wa', 'wach', 'wache', 'wacher']) {
      textarea.element.value = `Patient ${word}.`
      textarea.element.setSelectionRange(8 + word.length, 8 + word.length)
      textarea.element.scrollTop = 20
      await textarea.trigger('input')
      expect(textarea.element.selectionStart).toBe(8 + word.length)
      expect(textarea.element.scrollTop).toBe(20)
      expect(wrapper.find('[data-difference-id]').exists()).toBe(word !== 'wach')
      if (word !== 'wach') expect(wrapper.get('[data-difference-id]').text()).toBe(word)
    }
    await wrapper.get('[data-difference-id]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    expect(wrapper.findAll('.alternative').map(item => item.text())).toEqual(['wacher', 'wach'])
    expect(wrapper.get('[data-difference-id]').attributes('data-change-type')).toBe('replacement')
    const buttons = wrapper.findAllComponents(IonButton)
    expect(buttons.map(button => [button.text(), button.props('color')])).toEqual([
      ['Generierten Text wiederherstellen', 'success'],
    ])
    await buttons[0].trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
    expect(textarea.element.value).toBe('Patient wach.')
    expect(wrapper.find('[data-difference-id]').exists()).toBe(false)
  })

  test('marks manual deletions and restores them without inserting marker text', async () => {
    const wrapper = mountLiveEditor()
    await wrapper.get('textarea').setValue('Patient .')
    const marker = wrapper.get('.deletion')
    expect(marker.text()).toBe('')
    expect(marker.attributes('data-change-type')).toBe('deletion')
    await marker.trigger('keydown', { key: ' ' })
    expect(wrapper.findAll('.alternative').map(item => item.text())).toEqual(['wach'])
    const buttons = wrapper.findAllComponents(IonButton)
    expect(buttons.map(button => [button.text(), button.props('color')])).toEqual([
      ['Gelöschtes wiederherstellen', 'success'],
    ])
    await buttons[0].trigger('click')
    expect(wrapper.get('textarea').element.value).toBe('Patient wach.')
    expect(wrapper.find('.deletion').exists()).toBe(false)
  })

  test('offers only removal for inserted text and preserves a neighboring replacement', async () => {
    const wrapper = mountLiveEditor(createPreviewDocument('orientiert. '))
    await wrapper.get('textarea').setValue('desorientiert. added.')
    expect(wrapper.findAll('[data-difference-id]').map(marker => marker.attributes('data-change-type'))).toEqual([
      'replacement', 'insertion',
    ])
    await wrapper.get('[data-change-type="insertion"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.findAll('.alternative').map(item => item.text())).toEqual(['added.'])
    const buttons = wrapper.findAllComponents(IonButton)
    expect(buttons.map(button => [button.text(), button.props('color')])).toEqual([
      ['Eingefügtes entfernen', 'danger'],
    ])
    await buttons[0].trigger('click')
    expect(wrapper.get('textarea').element.value).toBe('desorientiert. ')
    expect(wrapper.find('[data-change-type="insertion"]').exists()).toBe(false)
    expect(wrapper.get('[data-change-type="replacement"]').text()).toBe('desorientiert')
  })

  test('shows both conflict choices when the retained user alternative is empty', async () => {
    const document = reconcilePreview(editPreview(createPreviewDocument('A B C'), 'A C'), 'A X C')
    const wrapper = mountEditor(document)
    await wrapper.get('[data-change-type="conflict"]').trigger('click')
    expect(wrapper.findAll('.alternative').map(item => item.text())).toEqual(['(Text entfernen)', 'X'])
    expect(wrapper.findAllComponents(IonButton).map(button => button.text())).toEqual(['Eigener Text', 'Neuer Text'])
  })

  test('waits for IME commit before showing the updated difference', async () => {
    const wrapper = mountLiveEditor(createPreviewDocument(''))
    const textarea = wrapper.get('textarea')
    await textarea.trigger('compositionstart')
    textarea.element.value = 'ä'
    await textarea.trigger('input', { isComposing: true })
    expect(wrapper.find('[data-difference-id]').exists()).toBe(false)
    await textarea.trigger('compositionend')
    expect(wrapper.get('[data-difference-id]').text()).toBe('ä')
  })

  test('closes stale alternatives when a document changes without changing its displayed text', async () => {
    const wrapper = mountEditor(editPreview(createPreviewDocument('Patient wach.'), 'Patient müde.'))
    await wrapper.get('[data-difference-id]').trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    await wrapper.setProps({ document: editPreview(createPreviewDocument('Patient fit.'), 'Patient müde.') })
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
    await wrapper.setProps({ readonly: true })
    expect(wrapper.get('[data-difference-id]').attributes('tabindex')).toBe('-1')
    await wrapper.get('[data-difference-id]').trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
  })
})
