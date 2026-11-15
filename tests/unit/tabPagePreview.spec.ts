import { IonContent, IonFabButton } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoProtocolCheckModal from '@/components/protocol/DodoProtocolCheckModal.vue'
import protocolCheckService, { type ProtocolCheckResult } from '@/services/protocol-check'
import TabPagePreview from '@/views/TabPagePreview.vue'

const generatedProtocol = 'Generated protocol text'

const mocks = vi.hoisted(() => ({
  store: {
    effectiveProtocolText: 'Generated protocol text',
    isDongleConnecting: false,
    connection: { isTransmitting: false },
  },
}))

vi.mock('@/services/protocol-check', () => ({
  default: {
    checkProtocol: vi.fn(),
    getCachedResult: vi.fn(),
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => reactive(mocks.store),
}))

const mountPreview = () => shallowMount(TabPagePreview, {
  global: {
    renderStubDefaultSlot: true,
  },
})

const successfulResult: ProtocolCheckResult = { status: 'ok', issues: [] }

describe('TabPagePreview protocol check', () => {
  beforeEach(() => {
    vi.mocked(protocolCheckService.checkProtocol).mockReset()
    vi.mocked(protocolCheckService.getCachedResult).mockReset().mockResolvedValue(null)
    mocks.store.effectiveProtocolText = generatedProtocol
    mocks.store.isDongleConnecting = false
  })

  test('sends the displayed protocol and prevents duplicate checks while loading', async () => {
    let resolveCheck!: (result: ProtocolCheckResult) => void
    vi.mocked(protocolCheckService.checkProtocol).mockReturnValue(new Promise((resolve) => {
      resolveCheck = resolve
    }))
    const wrapper = mountPreview()
    const fab = wrapper.getComponent(IonFabButton)

    await fab.trigger('click')
    await fab.trigger('click')

    expect(protocolCheckService.checkProtocol).toHaveBeenCalledOnce()
    expect(protocolCheckService.checkProtocol).toHaveBeenCalledWith(generatedProtocol)
    expect(fab.props('disabled')).toBe(true)
    expect(wrapper.getComponent(DodoProtocolCheckModal).props()).toMatchObject({
      isOpen: true,
      isChecking: true,
    })

    resolveCheck(successfulResult)
    await flushPromises()

    expect(fab.props('disabled')).toBe(false)
    expect(wrapper.getComponent(DodoProtocolCheckModal).props()).toMatchObject({
      isChecking: false,
      result: successfulResult,
    })
  })

  test('discards an in-flight result when the displayed text changes', async () => {
    let finish!: (result: ProtocolCheckResult) => void
    vi.mocked(protocolCheckService.checkProtocol).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = mountPreview()
    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()
    reactive(mocks.store).effectiveProtocolText = 'New edited text'
    await wrapper.vm.$nextTick()
    finish(successfulResult)
    await flushPromises()
    expect(wrapper.getComponent(DodoProtocolCheckModal).props()).toMatchObject({
      isOpen: false, isChecking: false, result: null,
    })
  })

  test('hides checks for an empty draft or remaining placeholders', async () => {
    const wrapper = mountPreview()
    reactive(mocks.store).effectiveProtocolText = ' \n '
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(IonFabButton).exists()).toBe(false)
    reactive(mocks.store).effectiveProtocolText = '[Missing]'
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(IonFabButton).exists()).toBe(false)
  })

  test('passes all issues to the shared modal in API order', async () => {
    const result: ProtocolCheckResult = {
      status: 'warning',
      issues: [
        {
          type: 'contradiction',
          severity: 'high',
          confidence: 0.91,
          message: 'Erste Auffälligkeit',
          evidence: ['Beleg A', 'Beleg B'],
          check: 'Erste Prüfung',
        },
        {
          type: 'context_gap',
          severity: 'medium',
          confidence: 0.65,
          message: 'Zweite Auffälligkeit',
          evidence: [],
          check: 'Zweite Prüfung',
        },
      ],
    }
    vi.mocked(protocolCheckService.checkProtocol).mockResolvedValue(result)
    const wrapper = mountPreview()

    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    expect(wrapper.getComponent(DodoProtocolCheckModal).props('result')).toEqual(result)
  })

  test('shows a retryable error without exposing the service error', async () => {
    vi.mocked(protocolCheckService.checkProtocol)
      .mockRejectedValueOnce(new Error('secret API detail'))
      .mockResolvedValueOnce(successfulResult)
    const wrapper = mountPreview()

    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    const modal = wrapper.getComponent(DodoProtocolCheckModal)
    expect(modal.props('checkError')).toBe(true)
    expect(wrapper.text()).not.toContain('secret API detail')

    modal.vm.$emit('retry')
    await flushPromises()

    expect(protocolCheckService.checkProtocol).toHaveBeenCalledTimes(2)
    expect(modal.props('result')).toEqual(successfulResult)
  })

  test('closes a completed result modal', async () => {
    vi.mocked(protocolCheckService.checkProtocol).mockResolvedValue(successfulResult)
    const wrapper = mountPreview()
    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    const modal = wrapper.getComponent(DodoProtocolCheckModal)
    modal.vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(modal.props('isOpen')).toBe(false)
  })

  test('reopens a cached result without starting another check', async () => {
    vi.mocked(protocolCheckService.checkProtocol).mockResolvedValue(successfulResult)
    const wrapper = mountPreview()
    const button = wrapper.getComponent(IonFabButton)
    await button.trigger('click')
    await flushPromises()
    wrapper.getComponent(DodoProtocolCheckModal).vm.$emit('close')
    vi.mocked(protocolCheckService.getCachedResult).mockResolvedValue(successfulResult)

    await button.trigger('click')
    await flushPromises()

    expect(protocolCheckService.checkProtocol).toHaveBeenCalledOnce()
    expect(wrapper.getComponent(DodoProtocolCheckModal).props()).toMatchObject({
      isOpen: true,
      isChecking: false,
      result: successfulResult,
    })
  })

  test('blurs only its content while dongle dialogs are active', async () => {
    const wrapper = mountPreview()
    const content = wrapper.getComponent(IonContent)

    expect(content.classes()).not.toContain('dongle-connecting')

    reactive(mocks.store).isDongleConnecting = true
    await wrapper.vm.$nextTick()

    expect(content.classes()).toContain('dongle-connecting')
    expect(wrapper.classes()).not.toContain('dongle-connecting')
  })
})
