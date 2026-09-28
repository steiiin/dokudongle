import { IonButton, IonInput, IonItem, IonModal } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DodoTextAssistEntriesModal from '@/components/DodoTextAssistEntriesModal.vue'
import DodoUserDictionaryModal from '@/components/DodoUserDictionaryModal.vue'
import SpellcheckerSettingsCard from '@/views/settingsCards/SpellcheckerSettingsCard.vue'
import { textAssistService } from '@/services/text-assist'

vi.mock('@/services/text-assist', () => ({ textAssistService: {
  getShortcutReplacements: vi.fn(), addShortcutReplacement: vi.fn(), removeShortcutReplacement: vi.fn(), resetShortcutReplacements: vi.fn(),
  getLocationSnippets: vi.fn(), addLocationSnippet: vi.fn(), removeLocationSnippet: vi.fn(), resetLocationSnippets: vi.fn(),
  getUserDictionaryEntries: vi.fn(), addUserWord: vi.fn(), removeUserWord: vi.fn(),
} }))
const location = { id: 'local', trigger: '@', label: 'Ort', replacement: 'Zielort', keywords: ['ziel'], category: 'hospital' }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(textAssistService.getShortcutReplacements).mockResolvedValue({ lt: 'laut' })
  vi.mocked(textAssistService.getLocationSnippets).mockResolvedValue([location])
  vi.mocked(textAssistService.getUserDictionaryEntries).mockResolvedValue([])
})
const mountModal = (kind: 'shortcuts' | 'locations') => shallowMount(DodoTextAssistEntriesModal, {
  props: { kind, isOpen: true }, global: { renderStubDefaultSlot: true },
})
type ModalWrapper = ReturnType<typeof mountModal>
const button = (wrapper: ModalWrapper, text: string) => wrapper.findAllComponents(IonButton).find(node => text === 'Entfernen' ? node.attributes('aria-label')?.endsWith(' entfernen') : (node.attributes('aria-label') ?? node.text()) === text)!
const field = (wrapper: ModalWrapper, label: string) => wrapper.findAllComponents(IonInput).find(node => node.props('label') === label)!
const fill = async (wrapper: ModalWrapper, label: string, text: string) => {
  field(wrapper, label).vm.$emit('update:modelValue', text)
  await wrapper.vm.$nextTick()
}

describe('spellchecker settings card', () => {
  test('opens each editor and reuses dictionary actions', async () => {
    const wrapper = shallowMount(SpellcheckerSettingsCard, { global: { renderStubDefaultSlot: true } })
    const items = wrapper.findAllComponents(IonItem)
    expect(items.map(item => item.text())).toEqual(['Eigenes Wörterbuch', 'Shortcut-Ersetzungen', 'Orts-Snippets'])
    expect(wrapper.findAll('ion-icon-stub')).toHaveLength(3)
    await items[0].trigger('click')
    await flushPromises()
    const dictionary = wrapper.getComponent(DodoUserDictionaryModal)
    expect(dictionary.props('isOpen')).toBe(true)
    dictionary.vm.$emit('add', 'Wunschwort')
    await flushPromises()
    expect(textAssistService.addUserWord).toHaveBeenCalledWith('Wunschwort')
    dictionary.vm.$emit('remove', 'Wunschwort')
    await flushPromises()
    expect(textAssistService.removeUserWord).toHaveBeenCalledWith('Wunschwort')
    vi.mocked(textAssistService.addUserWord).mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
    dictionary.vm.$emit('add', 'Wunschwort')
    await flushPromises()
    expect(dictionary.props('error')).toBe('Speichern fehlgeschlagen')
    dictionary.vm.$emit('close')
    await items[1].trigger('click')
    expect(wrapper.findAllComponents(DodoTextAssistEntriesModal).map(modal => [modal.props('kind'), modal.props('isOpen')])).toEqual([['shortcuts', true], ['locations', false]])
    await items[2].trigger('click')
    expect(wrapper.findAllComponents(DodoTextAssistEntriesModal).map(modal => modal.props('isOpen'))).toEqual([false, true])
  })
})

describe.each(['shortcuts', 'locations'] as const)('%s editor', kind => {
  const getEntries = () => kind === 'shortcuts' ? vi.mocked(textAssistService.getShortcutReplacements) : vi.mocked(textAssistService.getLocationSnippets)
  const addEntry = () => kind === 'shortcuts' ? vi.mocked(textAssistService.addShortcutReplacement) : vi.mocked(textAssistService.addLocationSnippet)
  const resetEntries = () => kind === 'shortcuts' ? textAssistService.resetShortcutReplacements : textAssistService.resetLocationSnippets
  const emptyEntries = () => {
    if (kind === 'shortcuts') vi.mocked(textAssistService.getShortcutReplacements).mockResolvedValue({})
    else vi.mocked(textAssistService.getLocationSnippets).mockResolvedValue([])
  }
  const fillForm = async (wrapper: ModalWrapper) => {
    if (kind === 'shortcuts') await fill(wrapper, 'Shortcut', 'test')
    else {
      await fill(wrapper, 'Auslöser', '#')
      await fill(wrapper, 'Bezeichnung', 'Testort')
      await fill(wrapper, 'Suchbegriffe (optional)', 'eins, zwei')
      await fill(wrapper, 'Kategorie (optional)', 'test')
    }
    await fill(wrapper, 'Ersetzung', 'Testtext')
  }

  test('shows table fields, adds and deletes entries, and closes', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findAll('th').map(node => node.text())).toEqual(kind === 'shortcuts'
      ? ['Shortcut', 'Ersetzung', 'Aktion'] : ['Auslöser', 'Bezeichnung', 'Ersetzung', 'Suchbegriffe', 'Kategorie', 'Aktion'])
    expect(button(wrapper, 'Hinzufügen').props('disabled')).toBe(true)
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    if (kind === 'shortcuts') expect(textAssistService.addShortcutReplacement).toHaveBeenCalledWith('test', 'Testtext')
    else expect(textAssistService.addLocationSnippet).toHaveBeenCalledWith({ trigger: '#', label: 'Testort', replacement: 'Testtext', keywords: ['eins', ' zwei'], category: 'test' })
    expect(field(wrapper, 'Ersetzung').props('modelValue')).toBe('')
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    if (kind === 'shortcuts') expect(textAssistService.removeShortcutReplacement).toHaveBeenCalledWith('lt')
    else expect(textAssistService.removeLocationSnippet).toHaveBeenCalledWith('local')
    await button(wrapper, 'Zurück').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  test('resets from the toolbar and restores defaults from the empty state', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(resetEntries()).toHaveBeenCalledTimes(1)
    emptyEntries()
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    expect(wrapper.find('table').exists()).toBe(false)
    const restore = button(wrapper, kind === 'shortcuts' ? 'Standard-Shortcuts wiederherstellen' : 'Standard-Orts-Snippets wiederherstellen')
    expect(restore.props()).toMatchObject({ fill: 'clear', color: 'primary' })
    await restore.trigger('click')
    await flushPromises()
    expect(resetEntries()).toHaveBeenCalledTimes(2)
  })

  test('retains input and table on failed saves and disables actions until completion', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await fillForm(wrapper)
    let rejectSave!: (error: Error) => void
    addEntry().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectSave = reject }))
    await wrapper.get('form').trigger('submit')
    expect(button(wrapper, 'Zurücksetzen').props('disabled')).toBe(true)
    expect(button(wrapper, 'Entfernen').props('disabled')).toBe(true)
    expect(wrapper.getComponent(IonModal).props('canDismiss')).toBe(false)
    rejectSave(new Error('Speichern fehlgeschlagen'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Speichern fehlgeschlagen')
    expect(field(wrapper, 'Ersetzung').props('modelValue')).toBe('Testtext')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(button(wrapper, 'Hinzufügen').props('disabled')).toBe(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  test('can retry failed loads and refreshes on reopen', async () => {
    getEntries().mockRejectedValueOnce(new Error('Laden fehlgeschlagen'))
    const wrapper = mountModal(kind)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Laden fehlgeschlagen')
    expect(button(wrapper, 'Zurücksetzen').props('disabled')).toBe(true)
    await button(wrapper, 'Erneut laden').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.setProps({ isOpen: false })
    emptyEntries()
    await wrapper.setProps({ isOpen: true })
    await flushPromises()
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
