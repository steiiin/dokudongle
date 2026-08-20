import { IonButton } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoProtocolCheckModal from '@/components/DodoProtocolCheckModal.vue'
import DodoSendAction from '@/components/DodoSendAction.vue'
import type { ProtocolCheckResult } from '@/services/protocol-check'

const mocks = vi.hoisted(() => ({
  getNetworkStatus: vi.fn(),
  checkProtocol: vi.fn(),
  sendProtocol: vi.fn(),
  scrollToTop: vi.fn(),
  createAlert: vi.fn(),
  store: {
    generatedProtocol: 'Generated protocol text',
    connection: {
      isConnected: true,
      isTransmitting: false,
    },
  },
}))

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: mocks.getNetworkStatus,
  },
}))

vi.mock('@ionic/core', () => ({
  alertController: {
    create: mocks.createAlert,
  },
}))

vi.mock('@/services/protocol-check', () => ({
  default: {
    checkProtocol: mocks.checkProtocol,
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => ({
    ...mocks.store,
    sendProtocol: mocks.sendProtocol,
  }),
}))

vi.mock('@/utils/input', () => ({
  tryScrollingToTop: mocks.scrollToTop,
}))

const cleanResult: ProtocolCheckResult = { status: 'ok', issues: [] }
const findingResult: ProtocolCheckResult = {
  status: 'warning',
  issues: [{
    type: 'context_gap',
    severity: 'medium',
    confidence: 0.8,
    message: 'Kontext fehlt.',
    evidence: ['Unklare Angabe'],
    check: 'Kontext ergänzen.',
  }],
}

const mountAction = () => shallowMount(DodoSendAction, {
  global: {
    renderStubDefaultSlot: true,
  },
})

const sendButton = (wrapper: ReturnType<typeof mountAction>) => {
  const button = wrapper.findAllComponents(IonButton)
    .find(candidate => candidate.text().includes('Senden'))
  if (!button) throw new Error('Send button not found')
  return button
}

const modal = (wrapper: ReturnType<typeof mountAction>) =>
  wrapper.getComponent(DodoProtocolCheckModal)

describe('DodoSendAction protocol check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.store.generatedProtocol = 'Generated protocol text'
    mocks.store.connection.isConnected = true
    mocks.store.connection.isTransmitting = false
    mocks.getNetworkStatus.mockResolvedValue({ connected: true, connectionType: 'wifi' })
    mocks.checkProtocol.mockResolvedValue(cleanResult)
    mocks.sendProtocol.mockResolvedValue(true)
    mocks.scrollToTop.mockResolvedValue(undefined)
    mocks.createAlert.mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role: 'confirm' }),
    })
  })

  test('checks the current protocol and automatically sends when no issues are found', async () => {
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.getNetworkStatus).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledWith('Generated protocol text')
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
    expect(mocks.scrollToTop).toHaveBeenCalledOnce()
  })

  test('shows findings and sends only after the explicit bypass', async () => {
    mocks.checkProtocol.mockResolvedValue(findingResult)
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.sendProtocol).not.toHaveBeenCalled()
    expect(modal(wrapper).props()).toMatchObject({
      isOpen: true,
      isChecking: false,
      result: findingResult,
      allowSendAnyway: true,
    })

    modal(wrapper).vm.$emit('send-anyway')
    modal(wrapper).vm.$emit('send-anyway')
    await flushPromises()

    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
  })

  test('requires confirmation before checking a protocol with missing inputs', async () => {
    mocks.store.generatedProtocol = 'Protocol with [missing input]'
    mocks.createAlert.mockResolvedValueOnce({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
    })
    const cancelled = mountAction()

    await sendButton(cancelled).trigger('click')
    await flushPromises()

    expect(mocks.createAlert).toHaveBeenCalledOnce()
    expect(mocks.getNetworkStatus).not.toHaveBeenCalled()
    expect(mocks.checkProtocol).not.toHaveBeenCalled()
    expect(mocks.sendProtocol).not.toHaveBeenCalled()

    vi.clearAllMocks()
    mocks.getNetworkStatus.mockResolvedValue({ connected: true, connectionType: 'cellular' })
    mocks.checkProtocol.mockResolvedValue(cleanResult)
    mocks.sendProtocol.mockResolvedValue(true)
    mocks.scrollToTop.mockResolvedValue(undefined)
    mocks.createAlert.mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role: 'confirm' }),
    })
    const confirmed = mountAction()

    await sendButton(confirmed).trigger('click')
    await flushPromises()

    expect(mocks.getNetworkStatus).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
  })

  test('shows offline confirmation and retries the entire connectivity check', async () => {
    mocks.getNetworkStatus
      .mockResolvedValueOnce({ connected: false, connectionType: 'none' })
      .mockResolvedValueOnce({ connected: true, connectionType: 'wifi' })
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.checkProtocol).not.toHaveBeenCalled()
    expect(modal(wrapper).props('checkError')).toBe(true)
    expect(modal(wrapper).props('errorMessage')).toContain('keine Internetverbindung')

    modal(wrapper).vm.$emit('retry')
    await flushPromises()

    expect(mocks.getNetworkStatus).toHaveBeenCalledTimes(2)
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
  })

  test('allows retry or explicit bypass after connectivity and check failures', async () => {
    mocks.getNetworkStatus.mockRejectedValueOnce(new Error('native status failed'))
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(modal(wrapper).props('checkError')).toBe(true)
    expect(mocks.sendProtocol).not.toHaveBeenCalled()

    modal(wrapper).vm.$emit('send-anyway')
    await flushPromises()
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()

    mocks.getNetworkStatus.mockResolvedValue({ connected: true, connectionType: 'wifi' })
    mocks.checkProtocol
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(cleanResult)
    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(modal(wrapper).props('checkError')).toBe(true)
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()

    modal(wrapper).vm.$emit('retry')
    await flushPromises()

    expect(mocks.sendProtocol).toHaveBeenCalledTimes(2)
    expect(mocks.checkProtocol).toHaveBeenCalledTimes(2)
    expect(mocks.getNetworkStatus).toHaveBeenCalledTimes(3)
  })

  test('prevents duplicate checks while a check is pending', async () => {
    let resolveCheck!: (result: ProtocolCheckResult) => void
    mocks.checkProtocol.mockReturnValue(new Promise(resolve => {
      resolveCheck = resolve
    }))
    const wrapper = mountAction()
    const button = sendButton(wrapper)

    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()

    expect(mocks.getNetworkStatus).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(button.props('disabled')).toBe(true)

    resolveCheck(cleanResult)
    await flushPromises()

    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
  })

  test('disables sending during an existing Bluetooth transmission', () => {
    mocks.store.connection.isTransmitting = true
    const wrapper = mountAction()

    expect(sendButton(wrapper).props('disabled')).toBe(true)
  })
})
