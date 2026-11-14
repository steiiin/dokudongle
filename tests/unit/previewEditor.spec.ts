import { IonButton, IonPopover } from '@ionic/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import DodoPreviewEditor from '@/components/protocol/DodoPreviewEditor.vue'
import { createPreviewDocument, editPreview, reconcilePreview, resolvePreviewConflict, type PreviewDocument } from '@/utils/preview-document'

const conflictDocument = () => reconcilePreview(editPreview(createPreviewDocument('Patient wach.'), 'Patient müde.'), 'Patient schläfrig.')
function mountEditor(document: PreviewDocument = conflictDocument()) {
  const wrapper = mount(DodoPreviewEditor, {
    props: { document },
    global: { stubs: { IonPopover: true, IonButton: true }, renderStubDefaultSlot: true },
  })
  return wrapper
}

describe('editable preview', () => {
  test('edits multiline text directly without interpreting pasted markup', async () => {
    const wrapper = mountEditor(createPreviewDocument('Generated'))
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('readonly')).toBeUndefined()
    await textarea.setValue('Edited\n<b>plain text</b>\n🙂')
    expect(wrapper.emitted('edit')?.at(-1)).toEqual(['Edited\n<b>plain text</b>\n🙂'])
    expect(wrapper.find('b').exists()).toBe(false)
  })

  test.each(['user', 'generated'] as const)('offers both alternatives and emits the %s choice', async choice => {
    const wrapper = mountEditor()
    await wrapper.get('[data-conflict-id]').trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    expect(wrapper.text()).toContain('müde')
    expect(wrapper.text()).toContain('schläfrig')
    const buttons = wrapper.findAllComponents(IonButton)
    await buttons[choice === 'user' ? 0 : 1].trigger('click')
    expect(wrapper.emitted('resolve')).toEqual([[wrapper.props('document').conflicts[0].id, choice]])
  })

  test('supports keyboard activation and deletion markers without adding text', async () => {
    const document = reconcilePreview(editPreview(createPreviewDocument('A B C'), 'A X C'), 'A C')
    const wrapper = mountEditor(document)
    const marker = wrapper.get('.deletion')
    expect(marker.attributes('tabindex')).toBe('0')
    expect(wrapper.get('textarea').element.value).toBe('A C')
    await marker.trigger('keydown', { key: 'Enter' })
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
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
})
