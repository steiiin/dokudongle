import { IonButton, IonCard, IonInput, IonProgressBar } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoDongleSettingsCard from '@/components/DodoDongleSettingsCard.vue'

const mocks = vi.hoisted(() => ({
  renameDongle: vi.fn(),
  store: {
    isDongleConnected: true,
    connectedDongleName: 'DokuDongle-Test123',
    connection: {
      isRenaming: false,
      device: { id: 'dongle-1' },
    },
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => Object.assign(reactive(mocks.store), {
    renameDongle: mocks.renameDongle,
  }),
}))

const mountCard = () => shallowMount(DodoDongleSettingsCard, {
  global: { renderStubDefaultSlot: true },
})

const enterName = async (wrapper: ReturnType<typeof mountCard>, value: string) => {
  wrapper.getComponent(IonInput).vm.$emit('ionInput', { detail: { value } })
  await wrapper.vm.$nextTick()
}

describe('Dongle settings card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.renameDongle.mockResolvedValue(undefined)
    mocks.store.isDongleConnected = true
    mocks.store.connectedDongleName = 'DokuDongle-Test123'
    mocks.store.connection.isRenaming = false
    mocks.store.connection.device = { id: 'dongle-1' }
  })

  test('shows the connected device and prefilled name without opening a modal', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('DokuDongle-Test123')
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Test123')
    expect(wrapper.getComponent(IonButton).props('disabled')).toBe(true)
    expect(wrapper.find('ion-modal').exists()).toBe(false)
  })

  test('hides on disconnect and refreshes the draft on reconnect or device change', async () => {
    const wrapper = mountCard()
    const store = reactive(mocks.store)
    await enterName(wrapper, 'Unsaved')

    store.isDongleConnected = false
    store.connectedDongleName = ''
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(IonCard).exists()).toBe(false)

    store.isDongleConnected = true
    store.connectedDongleName = 'DokuDongle-Renamed'
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Renamed')

    await enterName(wrapper, 'AnotherDraft')
    store.connection.device = { id: 'dongle-2' }
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Renamed')

    store.connectedDongleName = 'DokuDongle-Other'
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonInput).props('value')).toBe('Other')
  })

  test('filters invalid characters and caps names at the firmware limit', async () => {
    const wrapper = mountCard()
    await enterName(wrapper, 'Ab c-ä_!01234567890123456789')

    const input = wrapper.getComponent(IonInput)
    expect(input.props('maxlength')).toBe(18)
    expect(input.props('value')).toBe('Abc012345678901234')
    expect((input.element as HTMLIonInputElement).value).toBe('Abc012345678901234')
    await wrapper.getComponent(IonButton).trigger('click')
    expect(mocks.renameDongle).toHaveBeenCalledWith('Abc012345678901234')
  })

  test('rejects empty and unchanged names, including programmatic save attempts', async () => {
    const wrapper = mountCard()
    const button = wrapper.getComponent(IonButton)
    await button.trigger('click')
    await enterName(wrapper, '!!!')
    expect(button.props('disabled')).toBe(true)
    await button.trigger('click')
    expect(mocks.renameDongle).not.toHaveBeenCalled()

    await enterName(wrapper, 'Changed')
    expect(button.props('disabled')).toBe(false)
    await enterName(wrapper, 'Test123')
    expect(button.props('disabled')).toBe(true)
  })

  test('locks editing and prevents duplicate saves before the store marks renaming', async () => {
    let finish!: () => void
    mocks.renameDongle.mockReturnValue(new Promise<void>(resolve => { finish = resolve }))
    const wrapper = mountCard()
    await enterName(wrapper, 'NewName')
    const button = wrapper.getComponent(IonButton)
    await button.trigger('click')
    await button.trigger('click')

    expect(mocks.renameDongle).toHaveBeenCalledOnce()
    expect(button.props('disabled')).toBe(true)
    expect(wrapper.getComponent(IonInput).props('disabled')).toBe(true)
    expect(wrapper.findComponent(IonProgressBar).exists()).toBe(true)

    finish()
    await flushPromises()
    expect(wrapper.findComponent(IonProgressBar).exists()).toBe(false)
  })

  test('shows progress and disables saving while the store is renaming', async () => {
    const wrapper = mountCard()
    await enterName(wrapper, 'NewName')
    reactive(mocks.store).connection.isRenaming = true
    await wrapper.vm.$nextTick()

    expect(wrapper.getComponent(IonButton).props('disabled')).toBe(true)
    expect(wrapper.getComponent(IonInput).props('disabled')).toBe(true)
    expect(wrapper.findComponent(IonProgressBar).exists()).toBe(true)
  })

  test.each(['rejection', 'false result'])('shows an inline error after a %s and allows retry', async failure => {
    if (failure === 'rejection') mocks.renameDongle.mockRejectedValueOnce(new Error('BLE write failed'))
    else mocks.renameDongle.mockResolvedValueOnce(false)
    const wrapper = mountCard()
    await enterName(wrapper, 'NewName')
    const button = wrapper.getComponent(IonButton)
    await button.trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('nicht gespeichert')
    expect(wrapper.getComponent(IonInput).props('value')).toBe('NewName')
    expect(button.props('disabled')).toBe(false)
    expect(wrapper.findComponent(IonProgressBar).exists()).toBe(false)

    await button.trigger('click')
    await flushPromises()
    expect(mocks.renameDongle).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
