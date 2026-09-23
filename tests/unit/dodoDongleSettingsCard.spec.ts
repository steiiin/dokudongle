import { IonButton, IonCard, IonInput, IonModal, IonProgressBar, IonRange } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DongleSettingsCard from '@/views/settingsCards/DongleSettingsCard.vue'
import type { DongleConfig } from '@/types/dongle'

const mocks = vi.hoisted(() => ({
  updateDongleConfig: vi.fn(),
  refreshDongleConfig: vi.fn(),
  store: {
    isDongleConnected: true,
    connectedDongleName: 'DokuDongle-Test123',
    connection: {
      isConnected: true,
      isSavingSettings: false,
      isTransmitting: false,
      config: { name: 'Test123', keyGapMs: 30 } as DongleConfig | null,
      configStatus: 'ready',
      device: { id: 'dongle-1' },
    },
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => Object.assign(reactive(mocks.store), {
    updateDongleConfig: mocks.updateDongleConfig,
    refreshDongleConfig: mocks.refreshDongleConfig,
  }),
}))

const mountCard = () => shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true } })
type Card = ReturnType<typeof mountCard>
const button = (wrapper: Card, text: string) => wrapper.findAllComponents(IonButton).find(button => button.text() === text)!
const open = async (wrapper: Card) => { await button(wrapper, 'Einstellungen ändern').trigger('click') }
const enterName = async (wrapper: Card, value: string) => {
  wrapper.getComponent(IonInput).vm.$emit('ionInput', { detail: { value } })
  await wrapper.vm.$nextTick()
}
const setGap = async (wrapper: Card, value: number) => {
  wrapper.getComponent(IonRange).vm.$emit('ionInput', { detail: { value } })
  await wrapper.vm.$nextTick()
}

describe('Dongle settings card and modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateDongleConfig.mockResolvedValue(true)
    mocks.store.isDongleConnected = true
    mocks.store.connectedDongleName = 'DokuDongle-Test123'
    Object.assign(mocks.store.connection, {
      isConnected: true,
      isSavingSettings: false,
      isTransmitting: false,
      config: { name: 'Test123', keyGapMs: 30 },
      configStatus: 'ready',
      device: { id: 'dongle-1' },
    })
  })

  test('shows only current settings and an edit button in the main card', () => {
    const wrapper = mountCard()
    const card = wrapper.getComponent(IonCard)
    expect(card.text()).toContain('DokuDongle-Test123')
    expect(card.text()).toContain('Tastenabstand: 30 ms')
    expect(card.findComponent(IonInput).exists()).toBe(false)
    expect(card.findComponent(IonRange).exists()).toBe(false)
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test('opens with confirmed values, a fixed prefix, and the configured slider', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Test123')
    expect(wrapper.get('.name-prefix').text()).toBe('DokuDongle-')
    expect(wrapper.getComponent(IonInput).props('maxlength')).toBe(18)
    expect(wrapper.getComponent(IonRange).props()).toMatchObject({ min: 0, max: 200, step: 10, value: 30, snaps: true })
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    expect(wrapper.get('[data-testid="cancel-settings"]').element.parentElement?.getAttribute('slot')).toBe('start')
    expect(wrapper.get('[data-testid="save-settings"]').element.parentElement?.getAttribute('slot')).toBe('end')
  })

  test('cancel discards the draft and reopening loads the current settings', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    await enterName(wrapper, 'Unsaved')
    await setGap(wrapper, 200)
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
    expect(mocks.updateDongleConfig).not.toHaveBeenCalled()
    await open(wrapper)
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Test123')
    expect(wrapper.getComponent(IonRange).props('value')).toBe(30)
  })

  test('filters invalid typed and pasted characters and limits the suffix to 18 bytes', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    await enterName(wrapper, 'Ab c-ä_!01234567890123456789')
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Abc012345678901234')
    expect((wrapper.getComponent(IonInput).element as HTMLIonInputElement).value).toBe('Abc012345678901234')
    await button(wrapper, 'Speichern').trigger('click')
    expect(mocks.updateDongleConfig).toHaveBeenCalledWith({ name: 'Abc012345678901234', keyGapMs: 30 })
  })

  test.each(['name', 'gap', 'both'])('saves complete settings after changing %s and closes on success', async field => {
    const wrapper = mountCard()
    await open(wrapper)
    if (field !== 'gap') await enterName(wrapper, 'Changed')
    if (field !== 'name') await setGap(wrapper, 200)
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(mocks.updateDongleConfig).toHaveBeenCalledWith({
      name: field === 'gap' ? 'Test123' : 'Changed', keyGapMs: field === 'name' ? 30 : 200,
    })
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test('rejects unchanged and empty suffixes, even with a changed gap', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    await button(wrapper, 'Speichern').trigger('click')
    await enterName(wrapper, '!!!')
    await setGap(wrapper, 200)
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(true)
    await button(wrapper, 'Speichern').trigger('click')
    expect(mocks.updateDongleConfig).not.toHaveBeenCalled()
  })

  test('locks controls, prevents duplicate saves, and keeps the modal mounted across restart', async () => {
    let finish!: (saved: boolean) => void
    mocks.updateDongleConfig.mockReturnValue(new Promise<boolean>(resolve => { finish = resolve }))
    const wrapper = mountCard()
    await open(wrapper)
    await setGap(wrapper, 0)
    await button(wrapper, 'Speichern').trigger('click')
    await button(wrapper, 'Speichern').trigger('click')
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(mocks.updateDongleConfig).toHaveBeenCalledOnce()
    expect(wrapper.getComponent(IonModal).props('canDismiss')).toBe(false)
    expect(wrapper.getComponent(IonInput).props('disabled')).toBe(true)
    expect(wrapper.getComponent(IonRange).props('disabled')).toBe(true)
    expect(wrapper.findComponent(IonProgressBar).exists()).toBe(true)
    const store = reactive(mocks.store)
    store.isDongleConnected = false
    store.connection.isConnected = false
    store.connection.config = null
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    store.connection.config = { name: 'Test123', keyGapMs: 0 }
    store.connection.isConnected = true
    store.isDongleConnected = true
    finish(true)
    await flushPromises()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test.each(['rejection', 'false result'])('retains the draft and permits retry after %s', async failure => {
    if (failure === 'rejection') mocks.updateDongleConfig.mockRejectedValueOnce(new Error('failed'))
    else mocks.updateDongleConfig.mockResolvedValueOnce(false)
    const wrapper = mountCard()
    await open(wrapper)
    await enterName(wrapper, 'Changed')
    await setGap(wrapper, 200)
    await button(wrapper, 'Speichern').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain('nicht gespeichert oder bestätigt')
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Changed')
    expect(wrapper.getComponent(IonRange).props('value')).toBe(200)
    expect(button(wrapper, 'Speichern').props('disabled')).toBe(false)
    await button(wrapper, 'Speichern').trigger('click')
    expect(mocks.updateDongleConfig).toHaveBeenCalledTimes(2)
  })

  test('closes the editor on an unexpected disconnect or device change', async () => {
    const wrapper = mountCard()
    await open(wrapper)
    await enterName(wrapper, 'Unsaved')
    reactive(mocks.store).connection.isConnected = false
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
    reactive(mocks.store).connection.isConnected = true
    await open(wrapper)
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Test123')
    reactive(mocks.store).connection.device = { id: 'dongle-2' }
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test('shows unavailable settings for legacy firmware and blocks editing while transmitting', async () => {
    const wrapper = mountCard()
    reactive(mocks.store).connection.isTransmitting = true
    await open(wrapper)
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
    const connection = reactive(mocks.store).connection
    connection.isTransmitting = false
    connection.config = null
    connection.configStatus = 'unsupported'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Tastenabstand: nicht verfügbar')
    expect(wrapper.text()).toContain('XIAO-Firmware')
    expect(button(wrapper, 'Einstellungen ändern').props('disabled')).toBe(true)
  })
})
