import { IonAccordion, IonAccordionGroup, IonButton, IonInput, IonItem, IonModal } from '@ionic/vue'
import { alertController } from '@ionic/core'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DodoTextAssistEntriesModal from '@/components/DodoTextAssistEntriesModal.vue'
import DodoTextAssistEntryList from '@/components/DodoTextAssistEntryList.vue'
import DodoUserDictionaryModal from '@/components/DodoUserDictionaryModal.vue'
import SpellcheckerSettingsCard from '@/views/settingsCards/SpellcheckerSettingsCard.vue'
import { textAssistService } from '@/services/text-assist'

vi.mock('@ionic/core', async importOriginal => ({
  ...await importOriginal<typeof import('@ionic/core')>(),
  alertController: { create: vi.fn() },
}))
const alert = { present: vi.fn(), onDidDismiss: vi.fn() }
vi.mock('@/services/text-assist', () => ({ textAssistService: {
  getShortcutReplacements: vi.fn(), addShortcutReplacement: vi.fn(), updateShortcutReplacement: vi.fn(), removeShortcutReplacement: vi.fn(), resetShortcutReplacements: vi.fn(),
  getLocationSnippets: vi.fn(), addLocationSnippet: vi.fn(), updateLocationSnippet: vi.fn(), removeLocationSnippet: vi.fn(), resetLocationSnippets: vi.fn(),
  getUserDictionaryEntries: vi.fn(), addUserWord: vi.fn(), removeUserWord: vi.fn(),
} }))
const location = { id: 'local', trigger: '@', label: 'Ort', replacement: 'Zielort', keywords: ['ziel'], category: 'hospital' }
beforeEach(() => {
  vi.resetAllMocks()
  alert.present.mockResolvedValue(undefined)
  alert.onDidDismiss.mockResolvedValue({ role: 'confirm' })
  vi.mocked(alertController.create).mockResolvedValue(alert as unknown as HTMLIonAlertElement)
  vi.mocked(textAssistService.getShortcutReplacements).mockResolvedValue({ lt: 'laut' })
  vi.mocked(textAssistService.getLocationSnippets).mockResolvedValue([location])
  vi.mocked(textAssistService.getUserDictionaryEntries).mockResolvedValue([])
})
const mountModal = (kind: 'shortcuts' | 'locations') => shallowMount(DodoTextAssistEntriesModal, {
  props: { kind, isOpen: true }, global: { renderStubDefaultSlot: true, stubs: { DodoTextAssistEntryList: false } },
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
    await button(wrapper, kind === 'shortcuts' ? 'Neuer Shortcut' : 'Neues Snippet').trigger('click')
    if (kind === 'shortcuts') {
      await fill(wrapper, 'Shortcut', 'test')
      await fill(wrapper, 'Ersetzung', 'Testtext')
    }
    else {
      await fill(wrapper, 'Bezeichnung', 'Testort')
      await fill(wrapper, 'Suchbegriffe (optional)', 'eins, zwei')
      await fill(wrapper, 'Kategorie (optional)', 'test')
    }
  }

  test('shows the list, creates entries in input mode, deletes and closes', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    expect(wrapper.findAllComponents(DodoTextAssistEntryList)).toHaveLength(1)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(button(wrapper, 'Entfernen')).toBeUndefined()
    expect(wrapper.findComponent(IonAccordionGroup).exists()).toBe(false)
    if (kind === 'locations') {
      expect(wrapper.text()).not.toContain('@')
      expect(wrapper.text()).not.toContain('Zielort')
      expect(wrapper.text()).not.toContain('hospital')
    }
    await fillForm(wrapper)
    expect(button(wrapper, 'Entfernen')).toBeUndefined()
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(false)
    expect(wrapper.findAllComponents(IonButton).some(node => node.text() === 'Zurücksetzen')).toBe(false)
    expect(button(wrapper, 'Speichern').props('color')).toBe('success')
    if (kind === 'locations') expect(wrapper.findAllComponents(IonInput).map(node => node.props('label'))).toEqual(['Bezeichnung', 'Suchbegriffe (optional)', 'Kategorie (optional)'])
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    if (kind === 'shortcuts') expect(textAssistService.addShortcutReplacement).toHaveBeenCalledWith('test', 'Testtext')
    else expect(textAssistService.addLocationSnippet).toHaveBeenCalledWith({ trigger: '@', label: 'Testort', replacement: 'Testort', keywords: ['eins', ' zwei'], category: 'test' })
    expect(wrapper.find('form').exists()).toBe(false)
    await wrapper.getComponent(IonItem).trigger('click')
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    if (kind === 'shortcuts') expect(textAssistService.removeShortcutReplacement).toHaveBeenCalledWith('lt')
    else expect(textAssistService.removeLocationSnippet).toHaveBeenCalledWith('local')
    expect(wrapper.find('form').exists()).toBe(false)
    await button(wrapper, 'Zurück').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  test('edits an existing entry and cancels without saving or closing', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await wrapper.getComponent(IonItem).trigger('click')
    const inputLabel = kind === 'shortcuts' ? 'Ersetzung' : 'Bezeichnung'
    expect(field(wrapper, inputLabel).props('modelValue')).toBe(kind === 'shortcuts' ? 'laut' : 'Ort')
    await fill(wrapper, inputLabel, 'Geändert')
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(textAssistService.updateLocationSnippet).not.toHaveBeenCalled()
    expect(textAssistService.updateShortcutReplacement).not.toHaveBeenCalled()
    await wrapper.getComponent(IonItem).trigger('click')
    expect(field(wrapper, inputLabel).props('modelValue')).toBe(kind === 'shortcuts' ? 'laut' : 'Ort')
    await fill(wrapper, inputLabel, 'Geändert')
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    if (kind === 'shortcuts') expect(textAssistService.updateShortcutReplacement).toHaveBeenCalledWith('lt', 'lt', 'Geändert')
    else expect(textAssistService.updateLocationSnippet).toHaveBeenCalledWith('local', { trigger: '@', label: 'Geändert', replacement: 'Geändert', keywords: ['ziel'], category: 'hospital' })
    expect(addEntry()).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  test('does not save blank entries', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await button(wrapper, kind === 'shortcuts' ? 'Neuer Shortcut' : 'Neues Snippet').trigger('click')
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    await wrapper.get('form').trigger('submit')
    expect(addEntry()).not.toHaveBeenCalled()
  })

  test('resets from the toolbar and restores defaults from the empty state', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(resetEntries()).toHaveBeenCalledTimes(1)
    emptyEntries()
    await wrapper.getComponent(IonItem).trigger('click')
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(false)
    const restore = button(wrapper, kind === 'shortcuts' ? 'Standard-Shortcuts wiederherstellen' : 'Standard-Orts-Snippets wiederherstellen')
    expect(restore.props()).toMatchObject({ fill: 'clear', color: 'primary' })
    await restore.trigger('click')
    await flushPromises()
    expect(resetEntries()).toHaveBeenCalledTimes(2)
  })

  describe.each(['reset', 'restore', 'delete'] as const)('%s confirmation', action => {
    test.each(['cancel', 'backdrop', undefined, 'confirm'])('only mutates on explicit confirmation (role: %s)', async role => {
      if (action === 'restore') emptyEntries()
      const wrapper = mountModal(kind)
      await flushPromises()
      const inputLabel = kind === 'shortcuts' ? 'Ersetzung' : 'Bezeichnung'
      if (action === 'delete') {
        await wrapper.getComponent(IonItem).trigger('click')
        await fill(wrapper, inputLabel, 'Ungespeicherte Änderung')
      }
      const before = wrapper.text()
      const readsBefore = getEntries().mock.calls.length
      let dismiss!: (result: { role?: string }) => void
      alert.onDidDismiss.mockImplementationOnce(() => new Promise(resolve => { dismiss = resolve }))
      const actionButton = button(wrapper, action === 'delete' ? 'Entfernen' : action === 'reset'
        ? 'Zurücksetzen' : kind === 'shortcuts' ? 'Standard-Shortcuts wiederherstellen' : 'Standard-Orts-Snippets wiederherstellen')
      await actionButton.trigger('click')
      await flushPromises()
      const mutation = action === 'delete'
        ? kind === 'shortcuts' ? textAssistService.removeShortcutReplacement : textAssistService.removeLocationSnippet
        : resetEntries()
      expect(mutation).not.toHaveBeenCalled()
      expect(getEntries()).toHaveBeenCalledTimes(readsBefore)
      expect(alert.present).toHaveBeenCalledTimes(1)
      expect(alertController.create).toHaveBeenCalledWith(expect.objectContaining({
        header: action === 'delete'
          ? kind === 'shortcuts' ? 'Shortcut löschen?' : 'Orts-Snippet löschen?'
          : kind === 'shortcuts' ? 'Shortcuts zurücksetzen?' : 'Orts-Snippets zurücksetzen?',
        buttons: [
          { text: 'Abbrechen', role: 'cancel' },
          { text: action === 'delete' ? 'Löschen' : 'Zurücksetzen', role: 'confirm' },
        ],
        ...(action === 'delete' ? { subHeader: kind === 'shortcuts' ? 'lt' : 'Ort' }
          : { message: expect.stringContaining('Standardwerte') }),
      }))
      expect(actionButton.props('disabled')).toBe(true)
      expect(wrapper.getComponent(IonModal).props('canDismiss')).toBe(false)
      await actionButton.trigger('click')
      if (action === 'delete') {
        await wrapper.get('form').trigger('submit')
        await button(wrapper, 'Abbrechen').trigger('click')
      } else {
        await button(wrapper, kind === 'shortcuts' ? 'Neuer Shortcut' : 'Neues Snippet').trigger('click')
      }
      expect(alertController.create).toHaveBeenCalledTimes(1)
      expect(textAssistService.updateShortcutReplacement).not.toHaveBeenCalled()
      expect(textAssistService.updateLocationSnippet).not.toHaveBeenCalled()
      dismiss({ role })
      await flushPromises()
      expect(wrapper.getComponent(IonModal).props('canDismiss')).toBe(true)
      if (role === 'confirm') {
        expect(mutation).toHaveBeenCalledTimes(1)
        expect(getEntries()).toHaveBeenCalledTimes(readsBefore + 1)
        expect(wrapper.find('form').exists()).toBe(false)
      } else {
        expect(mutation).not.toHaveBeenCalled()
        expect(getEntries()).toHaveBeenCalledTimes(readsBefore)
        expect(wrapper.text()).toBe(before)
        expect(actionButton.props('disabled')).toBe(false)
        if (action === 'delete') expect(field(wrapper, inputLabel).props('modelValue')).toBe('Ungespeicherte Änderung')
      }
    })
  })

  test('reports failed resets and requires confirmation again on retry', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    vi.mocked(resetEntries()).mockRejectedValueOnce(new Error('Zurücksetzen fehlgeschlagen'))
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Zurücksetzen fehlgeschlagen')
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(true)
    expect(button(wrapper, 'Zurücksetzen').props('disabled')).toBe(false)
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(alertController.create).toHaveBeenCalledTimes(2)
    expect(resetEntries()).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  test('recovers when presenting the confirmation fails', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    alert.present.mockRejectedValueOnce(new Error('Dialog fehlgeschlagen'))
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(resetEntries()).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe('Dialog fehlgeschlagen')
    expect(button(wrapper, 'Zurücksetzen').props('disabled')).toBe(false)
    await button(wrapper, 'Zurücksetzen').trigger('click')
    await flushPromises()
    expect(resetEntries()).toHaveBeenCalledTimes(1)
  })

  test('retains input on failed saves and disables actions until completion', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await fillForm(wrapper)
    let rejectSave!: (error: Error) => void
    addEntry().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectSave = reject }))
    await wrapper.get('form').trigger('submit')
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    expect(button(wrapper, 'Abbrechen').props('disabled')).toBe(true)
    expect(wrapper.getComponent(IonModal).props('canDismiss')).toBe(false)
    rejectSave(new Error('Speichern fehlgeschlagen'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Speichern fehlgeschlagen')
    expect(field(wrapper, kind === 'shortcuts' ? 'Ersetzung' : 'Bezeichnung').props('modelValue')).toBe(kind === 'shortcuts' ? 'Testtext' : 'Testort')
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(false)
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  test('retains the editor after failed deletion and returns to the list after retry', async () => {
    const wrapper = mountModal(kind)
    await flushPromises()
    await wrapper.getComponent(IonItem).trigger('click')
    const removeEntry = kind === 'shortcuts' ? vi.mocked(textAssistService.removeShortcutReplacement) : vi.mocked(textAssistService.removeLocationSnippet)
    let rejectDelete!: (error: Error) => void
    removeEntry.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectDelete = reject }))
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    expect(button(wrapper, 'Entfernen').props('disabled')).toBe(true)
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    rejectDelete(new Error('Löschen fehlgeschlagen'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Löschen fehlgeschlagen')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(field(wrapper, kind === 'shortcuts' ? 'Shortcut' : 'Bezeichnung').props('modelValue')).toBe(kind === 'shortcuts' ? 'lt' : 'Ort')
    await button(wrapper, 'Entfernen').trigger('click')
    await flushPromises()
    expect(removeEntry).toHaveBeenLastCalledWith(kind === 'shortcuts' ? 'lt' : 'local')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(true)
  })

  test('can retry failed loads and refreshes on reopen', async () => {
    getEntries().mockRejectedValueOnce(new Error('Laden fehlgeschlagen'))
    const wrapper = mountModal(kind)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Laden fehlgeschlagen')
    expect(button(wrapper, 'Zurücksetzen').props('disabled')).toBe(true)
    await button(wrapper, 'Erneut laden').trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents(DodoTextAssistEntryList)).toHaveLength(1)
    await wrapper.setProps({ isOpen: false })
    emptyEntries()
    await wrapper.setProps({ isOpen: true })
    await flushPromises()
    expect(wrapper.findComponent(DodoTextAssistEntryList).exists()).toBe(false)
  })
})


describe('snippet categories', () => {
  test('groups multiple categories with Ionic accordions, including uncategorized entries', async () => {
    vi.mocked(textAssistService.getLocationSnippets).mockResolvedValue([
      location, { ...location, id: 'other', category: 'other' }, { ...location, id: 'uncategorized', category: '' },
    ])
    const wrapper = mountModal('locations')
    await flushPromises()
    expect(wrapper.findComponent(IonAccordionGroup).exists()).toBe(true)
    expect(wrapper.findAllComponents(IonAccordion).map(node => node.props('value'))).toEqual(['hospital', 'other', ''])
  })
})
