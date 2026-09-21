import { IonButton, IonFabButton, IonSpinner } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import type OpenAI from 'openai'
import { webcrypto } from 'node:crypto'
import { reactive, watch } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import DodoProtocolCheckModal from '@/components/DodoProtocolCheckModal.vue'
import DodoSendAction from '@/components/DodoSendAction.vue'
import { ProtocolCheckService, type ProtocolCheckResult } from '@/services/protocol-check'
import TabPagePreview from '@/views/TabPagePreview.vue'

const mocks = vi.hoisted(() => ({
  getNetworkStatus: vi.fn(),
  checkProtocol: vi.fn(),
  getCachedResult: vi.fn(),
  connectDongle: vi.fn(),
  markProtocolSent: vi.fn(),
  sendProtocol: vi.fn(),
  scrollToTop: vi.fn(),
  createAlert: vi.fn(),
  store: {
    generatedProtocol: 'Generated protocol text',
    isDongleConnected: true,
    isDongleConnecting: false,
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

vi.mock('@/services/protocol-check', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/protocol-check')>(),
  default: {
    checkProtocol: mocks.checkProtocol,
    getCachedResult: mocks.getCachedResult,
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => Object.assign(reactive(mocks.store), {
    connectDongle: mocks.connectDongle,
    markProtocolSent: mocks.markProtocolSent,
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

const connectButton = (wrapper: ReturnType<typeof mountAction>) => {
  const button = wrapper.findAllComponents(IonButton)
    .find(candidate => candidate.text().includes('Verbinden'))
  if (!button) throw new Error('Connect button not found')
  return button
}

const modal = (wrapper: ReturnType<typeof mountAction>) =>
  wrapper.getComponent(DodoProtocolCheckModal)

const useRealCheckCache = (result: ProtocolCheckResult) => {
  const create = vi.fn().mockResolvedValue({ output_text: JSON.stringify(result) })
  const client = { responses: { create } } as unknown as Pick<OpenAI, 'responses'>
  const service = new ProtocolCheckService(client)
  mocks.checkProtocol.mockImplementation(text => service.checkProtocol(text))
  mocks.getCachedResult.mockImplementation(text => service.getCachedResult(text))
  return { service, create }
}

describe('DodoSendAction protocol check', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('crypto', webcrypto)
    mocks.store.generatedProtocol = 'Generated protocol text'
    mocks.store.isDongleConnected = true
    mocks.store.isDongleConnecting = false
    mocks.store.connection.isConnected = true
    mocks.store.connection.isTransmitting = false
    mocks.getNetworkStatus.mockResolvedValue({ connected: true, connectionType: 'wifi' })
    mocks.checkProtocol.mockResolvedValue(cleanResult)
    mocks.getCachedResult.mockResolvedValue(null)
    mocks.markProtocolSent.mockResolvedValue(undefined)
    mocks.sendProtocol.mockResolvedValue(true)
    mocks.scrollToTop.mockResolvedValue(undefined)
    mocks.connectDongle.mockResolvedValue(undefined)
    mocks.createAlert.mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role: 'confirm' }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('reuses a manual check across preview and send components, even offline', async () => {
    const { create } = useRealCheckCache(cleanResult)
    const preview = shallowMount(TabPagePreview, { global: { renderStubDefaultSlot: true } })
    await preview.getComponent(IonFabButton).trigger('click')
    await vi.waitFor(() => expect(preview.getComponent(DodoProtocolCheckModal).props('result')).toEqual(cleanResult))
    preview.getComponent(DodoProtocolCheckModal).vm.$emit('close')

    mocks.getNetworkStatus.mockResolvedValue({ connected: false, connectionType: 'none' })
    const wrapper = mountAction()
    const openedModal = vi.fn()
    const stopWatching = watch(() => modal(wrapper).props('isOpen'), openedModal, { flush: 'sync' })
    await sendButton(wrapper).trigger('click')
    await vi.waitFor(() => expect(mocks.sendProtocol).toHaveBeenCalledOnce())

    expect(create).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(mocks.getNetworkStatus).not.toHaveBeenCalled()
    expect(modal(wrapper).props('isOpen')).toBe(false)
    expect(openedModal).not.toHaveBeenCalled()
    stopWatching()
  })

  test('checks and caches the text captured before asynchronous work', async () => {
    const { service, create } = useRealCheckCache(findingResult)
    let resolveNetwork!: (status: { connected: boolean }) => void
    mocks.getNetworkStatus.mockReturnValue(new Promise(resolve => { resolveNetwork = resolve }))
    const originalText = mocks.store.generatedProtocol
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await vi.waitFor(() => expect(mocks.getNetworkStatus).toHaveBeenCalledOnce())
    reactive(mocks.store).generatedProtocol = 'Edited while checking'
    resolveNetwork({ connected: true })
    await vi.waitFor(() => expect(modal(wrapper).props('result')).toEqual(findingResult))

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ input: originalText }))
    expect(await service.getCachedResult(originalText)).toEqual(findingResult)
    expect(await service.getCachedResult(mocks.store.generatedProtocol)).toBeNull()
  })

  test('reuses a clean result on repeated sends and checks again after text changes', async () => {
    const { create } = useRealCheckCache(cleanResult)
    const wrapper = mountAction()
    await sendButton(wrapper).trigger('click')
    await vi.waitFor(() => expect(mocks.sendProtocol).toHaveBeenCalledOnce())

    await sendButton(wrapper).trigger('click')
    await vi.waitFor(() => expect(mocks.sendProtocol).toHaveBeenCalledTimes(2))
    expect(create).toHaveBeenCalledOnce()
    expect(mocks.getNetworkStatus).toHaveBeenCalledOnce()

    reactive(mocks.store).generatedProtocol += ' '
    await sendButton(wrapper).trigger('click')
    await vi.waitFor(() => expect(mocks.sendProtocol).toHaveBeenCalledTimes(3))
    expect(create).toHaveBeenCalledTimes(2)
    expect(mocks.getNetworkStatus).toHaveBeenCalledTimes(2)
  })

  test('requires confirmation for cached findings on every send', async () => {
    const { service, create } = useRealCheckCache(findingResult)
    await service.checkProtocol(mocks.store.generatedProtocol)
    const wrapper = mountAction()

    for (let sendCount = 1; sendCount <= 2; sendCount++) {
      await sendButton(wrapper).trigger('click')
      await vi.waitFor(() => expect(modal(wrapper).props()).toMatchObject({
        isOpen: true,
        isChecking: false,
        result: findingResult,
      }))
      expect(mocks.sendProtocol).toHaveBeenCalledTimes(sendCount - 1)
      modal(wrapper).vm.$emit('send-anyway')
      await flushPromises()
      expect(mocks.sendProtocol).toHaveBeenCalledTimes(sendCount)
    }

    expect(create).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).not.toHaveBeenCalled()
    expect(mocks.getNetworkStatus).not.toHaveBeenCalled()
  })

  test('checks the current protocol and automatically sends when no issues are found', async () => {
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.getNetworkStatus).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledOnce()
    expect(mocks.checkProtocol).toHaveBeenCalledWith('Generated protocol text')
    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
    expect(mocks.markProtocolSent).toHaveBeenCalledOnce()
    expect(mocks.scrollToTop).toHaveBeenCalledOnce()
  })

  test('replaces sending with a white connection shortcut while disconnected', () => {
    mocks.store.isDongleConnected = false
    mocks.store.connection.isConnected = false
    const wrapper = mountAction()
    const button = connectButton(wrapper)

    // Ionic's always-dark palette maps "dark" to the light foreground color.
    expect(button.props('color')).toBe('dark')
    expect(button.props('fill')).toBe('solid')
    expect(wrapper.text()).not.toContain('Senden')
  })

  test('shows connecting state and prevents duplicate connection attempts', async () => {
    mocks.store.isDongleConnected = false
    mocks.store.connection.isConnected = false
    let resolveConnection!: () => void
    mocks.connectDongle.mockImplementation(() => {
      reactive(mocks.store).isDongleConnecting = true
      return new Promise<void>(resolve => {
        resolveConnection = resolve
      })
    })
    const wrapper = mountAction()
    const button = connectButton(wrapper)

    await button.trigger('click')
    await wrapper.vm.$nextTick()
    await button.trigger('click')

    expect(mocks.connectDongle).toHaveBeenCalledOnce()
    expect(button.props('disabled')).toBe(true)
    expect(button.findComponent(IonSpinner).exists()).toBe(true)

    resolveConnection()
    await flushPromises()
  })

  test('does not expire the protocol when Bluetooth transmission fails', async () => {
    mocks.sendProtocol.mockResolvedValue(false)
    const wrapper = mountAction()

    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.sendProtocol).toHaveBeenCalledOnce()
    expect(mocks.markProtocolSent).not.toHaveBeenCalled()
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
