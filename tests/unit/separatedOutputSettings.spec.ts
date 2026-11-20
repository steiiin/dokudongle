import { createPinia, setActivePinia } from 'pinia'
import { IonButton, IonInput, IonItem, IonModal, IonReorderGroup, IonToggle } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SeparatedOutputSettingsCard from '@/views/settings/SeparatedOutputSettingsCard.vue'
import { useOutputSettingsStore } from '@/store/output-settings'
import { saveStoredValue } from '@/store/persistence'

vi.mock('@/store/doku', () => ({ useDokuStore: () => ({ connection: { isTransmitting: false }, isProtocolChanging: false }) }))
vi.mock('@/store/persistence', () => ({ loadStoredValue: vi.fn(), saveStoredValue: vi.fn() }))

beforeEach(() => { setActivePinia(createPinia()); vi.resetAllMocks() })
const mountCard = () => shallowMount(SeparatedOutputSettingsCard, { global: { renderStubDefaultSlot: true } })
type Card = ReturnType<typeof mountCard>
const button = (wrapper: Card, text: string) => wrapper.findAllComponents(IonButton)
  .find(item => (item.attributes('aria-label') ?? item.text()) === text)!
const open = (wrapper: Card) => wrapper.findAllComponents(IonItem)
  .find(item => item.text().includes('Gliederung bearbeiten'))!.trigger('click')
const name = async (wrapper: Card, index: number, value: string) => {
  wrapper.findAllComponents(IonInput)[index].vm.$emit('ionInput', { detail: { value } })
  await wrapper.vm.$nextTick()
}

describe('separated output settings modal', () => {
  test('offers configuration while disabled; cancel and dismissal discard drafts', async () => {
    const settings = useOutputSettingsStore()
    const wrapper = mountCard()
    expect(wrapper.getComponent(IonToggle).props('checked')).toBe(false)
    await open(wrapper)
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    await name(wrapper, 0, 'Changed')
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(settings.config.groups[0].name).toBe('ANAMNESE')
    expect(saveStoredValue).not.toHaveBeenCalled()
    await open(wrapper)
    expect(wrapper.findAllComponents(IonInput)[0].props('value')).toBe('ANAMNESE')
    await name(wrapper, 0, 'Another draft')
    wrapper.getComponent(IonModal).vm.$emit('didDismiss')
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
    expect(settings.config.groups[0].name).toBe('ANAMNESE')
  })

  test('validates names and commits added, moved and renamed groups only on green Save', async () => {
    const settings = useOutputSettingsStore()
    const wrapper = mountCard()
    await open(wrapper)
    await button(wrapper, 'Überschrift hinzufügen').trigger('click')
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    await name(wrapper, 3, 'anamnese')
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    await name(wrapper, 3, ' New group ')
    const complete = vi.fn()
    wrapper.getComponent(IonReorderGroup).vm.$emit('ionItemReorder', { detail: { from: 2, to: 12, complete } })
    await wrapper.vm.$nextTick()
    expect(complete).toHaveBeenCalledWith(false)
    expect(settings.config.groups).toHaveLength(3)
    expect(button(wrapper, 'Speichern').props('color')).toBe('success')
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(settings.config.groups[3]).toMatchObject({ name: 'New group', blocks: ['situation'] })
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test('removes headers without dropping any block and prevents removing the last group', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    await button(wrapper, 'MAẞNAHMEN entfernen').trigger('click')
    await button(wrapper, 'VERLAUF entfernen').trigger('click')
    expect(button(wrapper, 'ANAMNESE entfernen').props('disabled')).toBe(true)
    expect(wrapper.findAll('[data-output-row]')).toHaveLength(10)
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(useOutputSettingsStore().config.groups[0].blocks).toHaveLength(9)
  })

  test('retains a failed-save draft and rolls the toggle back on storage failure', async () => {
    const wrapper = mountCard()
    const target = { checked: true }
    vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('disk'))
    wrapper.getComponent(IonToggle).vm.$emit('ionChange', { target, detail: { checked: true } })
    await flushPromises()
    expect(useOutputSettingsStore().config.enabled).toBe(false)
    expect(target.checked).toBe(false)
    expect(wrapper.text()).toContain('nicht gespeichert')
    await open(wrapper)
    await name(wrapper, 0, 'Kept draft')
    vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('disk'))
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    expect(wrapper.findAllComponents(IonInput)[0].props('value')).toBe('Kept draft')
    expect(useOutputSettingsStore().config.groups[0].name).toBe('ANAMNESE')
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(useOutputSettingsStore().config.groups[0].name).toBe('Kept draft')
  })
})
