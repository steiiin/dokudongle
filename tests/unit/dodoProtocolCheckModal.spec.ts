import { IonButton } from '@ionic/vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import DodoProtocolCheckModal from '@/components/DodoProtocolCheckModal.vue'
import type { ProtocolCheckResult } from '@/services/protocol-check'

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

const mountModal = (overrides: Record<string, unknown> = {}) => shallowMount(DodoProtocolCheckModal, {
  props: {
    isOpen: true,
    isChecking: false,
    result,
    checkError: false,
    ...overrides,
  },
  global: {
    renderStubDefaultSlot: true,
  },
})

describe('DodoProtocolCheckModal', () => {
  test('renders issue details in API order', () => {
    const wrapper = mountModal()
    const text = wrapper.text()

    expect(text).toContain('Widerspruch')
    expect(text).toContain('Kontextlücke')
    expect(text).toContain('0.91')
    expect(text).toContain('Beleg A')
    expect(text).toContain('Beleg B')
    expect(text).toContain('Erste Prüfung')
    expect(text.indexOf('Erste Auffälligkeit')).toBeLessThan(text.indexOf('Zweite Auffälligkeit'))
  })

  test('offers an explicit send-anyway action only for a send flow', async () => {
    const manual = mountModal()
    expect(manual.text()).not.toContain('Trotzdem senden')

    const sendFlow = mountModal({ allowSendAnyway: true })
    const sendAnyway = sendFlow.findAllComponents(IonButton)
      .find(button => button.text().includes('Trotzdem senden'))

    expect(sendAnyway).toBeDefined()
    await sendAnyway!.trigger('click')
    expect(sendFlow.emitted('send-anyway')).toHaveLength(1)
  })

  test('offers retry, back, and send-anyway after a send-time check error', () => {
    const wrapper = mountModal({
      result: null,
      checkError: true,
      errorMessage: 'Keine Verbindung',
      allowSendAnyway: true,
    })

    expect(wrapper.text()).toContain('Keine Verbindung')
    expect(wrapper.text()).toContain('Zurück')
    expect(wrapper.text()).toContain('Erneut prüfen')
    expect(wrapper.text()).toContain('Trotzdem senden')
  })
})
