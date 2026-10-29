import { IonButton, IonProgressBar, IonToast } from '@ionic/vue'
import { shallowMount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DodoTransmission from '@/components/DodoTransmission.vue'

const mocks = vi.hoisted(() => ({
  pauseSend: vi.fn(), resumeSend: vi.fn(), cancelSend: vi.fn(),
  store: {
    isDongleTransmitting: true,
    isDongleConnected: true,
    transmissionProgress: 0.5,
    connection: {
      transmissionPaused: false,
      transmissionBlockPending: false,
      transmissionWaitingForDongle: false,
      transmissionReconnectCount: 0,
    },
  },
}))
vi.mock('@/store/doku', () => ({
  useDokuStore: () => Object.assign(reactive(mocks.store), {
    pauseSend: mocks.pauseSend, resumeSend: mocks.resumeSend, cancelSend: mocks.cancelSend,
  }),
}))

const store = reactive(mocks.store)
const mountOverlay = () => shallowMount(DodoTransmission, { global: { renderStubDefaultSlot: true } })
function button(wrapper: ReturnType<typeof mountOverlay>, label: string) {
  return wrapper.findAllComponents(IonButton).find(component => component.text() === label)!
}

beforeEach(() => {
  vi.clearAllMocks()
  store.isDongleTransmitting = true
  store.isDongleConnected = true
  store.transmissionProgress = 0.5
  Object.assign(store.connection, {
    transmissionPaused: false, transmissionBlockPending: false,
    transmissionWaitingForDongle: false, transmissionReconnectCount: 0,
  })
})

describe('transmission controls', () => {
  test('shows pause, finishing-the-block status, and resume', async () => {
    const wrapper = mountOverlay()
    expect(wrapper.text()).toContain('Übertragung läuft')
    await button(wrapper, 'Pause').trigger('click')
    expect(mocks.pauseSend).toHaveBeenCalledOnce()
    store.connection.transmissionPaused = true
    store.connection.transmissionBlockPending = true
    await nextTick()
    expect(wrapper.text()).toContain('Wird pausiert …')
    store.connection.transmissionBlockPending = false
    await nextTick()
    expect(wrapper.text()).toContain('Übertragung pausiert')
    await button(wrapper, 'Fortsetzen').trigger('click')
    expect(mocks.resumeSend).toHaveBeenCalledOnce()
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(mocks.cancelSend).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  test('keeps the overlay and progress during disconnect and disables resume', async () => {
    store.isDongleConnected = false
    store.connection.transmissionWaitingForDongle = true
    store.connection.transmissionPaused = true
    const wrapper = mountOverlay()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dongle nicht gefunden. Übertragung pausiert. Die Verbindung wird automatisch wiederhergestellt.')
    expect(wrapper.findComponent(IonProgressBar).props('value')).toBe(0.5)
    expect(button(wrapper, 'Fortsetzen').props('disabled')).toBe(true)
    await button(wrapper, 'Abbrechen').trigger('click')
    expect(mocks.cancelSend).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  test.each([false, true])('shows a four-second recovery notice with manual pause = %s', async paused => {
    const wrapper = mountOverlay()
    store.connection.transmissionPaused = paused
    ++store.connection.transmissionReconnectCount
    await nextTick()
    const toast = wrapper.findComponent(IonToast)
    expect(toast.props('isOpen')).toBe(true)
    expect(toast.props('duration')).toBe(4000)
    expect(toast.props('message')).toBe(paused
      ? 'Dongle wieder gefunden. Übertragung bleibt pausiert.'
      : 'Dongle wieder gefunden. Übertragung wird fortgesetzt.')
    // A short remaining transmission must not hide the recovery notice.
    store.isDongleTransmitting = false
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(toast.props('isOpen')).toBe(true)
    wrapper.unmount()
  })
})
