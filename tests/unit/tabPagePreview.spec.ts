import { IonFabButton } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoProtocolCheckModal from '@/components/DodoProtocolCheckModal.vue'
import protocolCheckService, { type ProtocolCheckResult } from '@/services/protocol-check'
import TabPagePreview from '@/views/TabPagePreview.vue'

const generatedProtocol = 'Generated protocol text'

vi.mock('@/services/protocol-check', () => ({
  default: {
    checkProtocol: vi.fn(),
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => ({
    generatedProtocol,
  }),
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
})
