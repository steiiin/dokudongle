import { IonFabButton, IonModal } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

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
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    expect(wrapper.text()).toContain('Das Protokoll wird geprüft')

    resolveCheck(successfulResult)
    await flushPromises()

    expect(fab.props('disabled')).toBe(false)
    expect(wrapper.text()).toContain('Keine Auffälligkeiten gefunden.')
  })

  test('renders all issue details in API order', async () => {
    vi.mocked(protocolCheckService.checkProtocol).mockResolvedValue({
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
    })
    const wrapper = mountPreview()

    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Widerspruch')
    expect(text).toContain('Kontextlücke')
    expect(text).toContain('0.91')
    expect(text).toContain('Beleg A')
    expect(text).toContain('Beleg B')
    expect(text).toContain('Erste Prüfung')
    expect(text.indexOf('Erste Auffälligkeit')).toBeLessThan(text.indexOf('Zweite Auffälligkeit'))
  })

  test('shows a retryable error without exposing the service error', async () => {
    vi.mocked(protocolCheckService.checkProtocol)
      .mockRejectedValueOnce(new Error('secret API detail'))
      .mockResolvedValueOnce(successfulResult)
    const wrapper = mountPreview()

    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Prüfung fehlgeschlagen')
    expect(wrapper.text()).not.toContain('secret API detail')

    const retry = wrapper.findAllComponents({ name: 'IonButton' })
      .find((button) => button.text().includes('Erneut versuchen'))
    expect(retry).toBeDefined()
    await retry!.trigger('click')
    await flushPromises()

    expect(protocolCheckService.checkProtocol).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Keine Auffälligkeiten gefunden.')
  })

  test('closes a completed result modal', async () => {
    vi.mocked(protocolCheckService.checkProtocol).mockResolvedValue(successfulResult)
    const wrapper = mountPreview()
    await wrapper.getComponent(IonFabButton).trigger('click')
    await flushPromises()

    const close = wrapper.findAllComponents({ name: 'IonButton' })
      .find((button) => button.text().includes('Schließen'))
    expect(close).toBeDefined()
    await close!.trigger('click')

    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(false)
  })
})
