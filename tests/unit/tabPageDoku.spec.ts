import { IonContent } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import TabPageDoku from '@/views/TabPageDoku.vue'
import DodoBlockToolbar from '@/components/ui/DodoBlockToolbar.vue'
import { ProtocolCourse, resetProtocol, type Protocol } from '@/types/protocol'

const mocks = vi.hoisted(() => ({
  store: {
    lastProtocolResetAt: '2026-08-28T10:00:00.000Z',
    isDongleConnecting: false,
    doku: {} as Protocol,
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
    mocks.store.doku = resetProtocol()
    mocks.store.context.requireABCDE = true
    mocks.store.context.requireSampler = true
  })

  afterEach(() => vi.unstubAllGlobals())

  test('groups setup and Situation in Einsatz and skips hidden groups', async () => {
    const wrapper = shallowMount(TabPageDoku, { global: { renderStubDefaultSlot: true } })
    const einsatz = wrapper.get('[data-doku-group="einsatz"]')
    expect(einsatz.find('identifikation-card-stub').exists()).toBe(true)
    expect(einsatz.find('flavors-card-stub').exists()).toBe(true)
    expect(einsatz.find('setting-card-stub').exists()).toBe(true)
    expect(einsatz.find('situation-card-stub').exists()).toBe(true)
    const toolbar = wrapper.getComponent(DodoBlockToolbar)
    expect(toolbar.props('next')?.id).toBe('abcde')
    reactive(mocks.store).context.requireABCDE = false
    await wrapper.vm.$nextTick()
    expect(toolbar.props('next')?.id).toBe('sampler')
    expect(wrapper.get('[data-doku-group="abcde"]').attributes('style')).toContain('display: none')
    reactive(mocks.store).doku.course = ProtocolCourse.NEF_VOR_ORT
    await wrapper.vm.$nextTick()
    expect(toolbar.props('next')).toBeUndefined()
    expect(toolbar.props('previous')).toBeUndefined()
    expect(toolbar.props('edited')).toBe(true)
    expect(einsatz.get('situation-card-stub').attributes('style')).toContain('display: none')
    wrapper.unmount()
  })

  test('tracks the scroll viewport, handles the bottom, and respects reduced motion', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const wrapper = shallowMount(TabPageDoku, { global: { renderStubDefaultSlot: true } })
    const content = wrapper.getComponent(IonContent).element as HTMLIonContentElement
    const scroll = document.createElement('div')
    Object.defineProperties(scroll, { clientHeight: { value: 500 }, scrollHeight: { value: 2000 } })
    scroll.getBoundingClientRect = () => ({ top: 100 }) as DOMRect
    content.getScrollElement = vi.fn().mockResolvedValue(scroll)
    content.scrollToPoint = vi.fn().mockResolvedValue(undefined)
    const sections = wrapper.findAll('[data-doku-group]')
    sections.forEach((section, index) => {
      section.element.getBoundingClientRect = () => ({ top: 100 + index * 600 - scroll.scrollTop }) as DOMRect
    })
    const flushFrames = async () => {
      await flushPromises()
      while (frames.length) frames.shift()!(0)
      await wrapper.vm.$nextTick()
    }
    await flushFrames()
    const toolbar = wrapper.getComponent(DodoBlockToolbar)
    expect(toolbar.props('current').id).toBe('einsatz')
    toolbar.vm.$emit('navigate', 'abcde')
    await flushFrames()
    expect(content.scrollToPoint).toHaveBeenCalledWith(0, 600, 0)
    scroll.scrollTop = 601
    scroll.dispatchEvent(new Event('scroll'))
    await flushFrames()
    expect(toolbar.props('current').id).toBe('abcde')
    scroll.scrollTop = 1500
    scroll.dispatchEvent(new Event('scroll'))
    await flushFrames()
    expect(toolbar.props('current').id).toBe('aufgaben')
    expect(toolbar.props('next')).toBeUndefined()
    scroll.scrollTop = 0
    scroll.dispatchEvent(new Event('scroll'))
    await flushFrames()
    expect(toolbar.props('current').id).toBe('einsatz')
    const removeListener = vi.spyOn(scroll, 'removeEventListener')
    wrapper.unmount()
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
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
