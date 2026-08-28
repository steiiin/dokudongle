import { IonContent } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import TabPageDoku from '@/views/TabPageDoku.vue'

const mocks = vi.hoisted(() => ({
  store: {
    lastProtocolResetAt: '2026-08-28T10:00:00.000Z',
    isDongleConnecting: false,
    doku: {
      course: 'transport',
    },
    context: {
      requireFlavors: true,
      requireSceneDetails: true,
      requireABCDE: true,
      requireSampler: true,
    },
  },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => reactive(mocks.store),
}))

describe('TabPageDoku', () => {
  beforeEach(() => {
    mocks.store.lastProtocolResetAt = '2026-08-28T10:00:00.000Z'
    mocks.store.isDongleConnecting = false
  })

  test('scrolls its own content to the top after the protocol is reset', async () => {
    const wrapper = shallowMount(TabPageDoku, {
      global: {
        renderStubDefaultSlot: true,
      },
    })
    const scrollToTop = vi.fn().mockResolvedValue(undefined)
    const content = wrapper.getComponent(IonContent).element as HTMLIonContentElement
    content.scrollToTop = scrollToTop

    reactive(mocks.store).lastProtocolResetAt = '2026-08-28T11:00:00.000Z'
    await flushPromises()

    expect(scrollToTop).toHaveBeenCalledOnce()
    expect(scrollToTop).toHaveBeenCalledWith(300)
  })

  test('blurs only its content while dongle dialogs are active', async () => {
    const wrapper = shallowMount(TabPageDoku, {
      global: {
        renderStubDefaultSlot: true,
      },
    })
    const content = wrapper.getComponent(IonContent)

    expect(content.classes()).not.toContain('dongle-connecting')

    reactive(mocks.store).isDongleConnecting = true
    await wrapper.vm.$nextTick()

    expect(content.classes()).toContain('dongle-connecting')
    expect(wrapper.classes()).not.toContain('dongle-connecting')
  })
})
