import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, ref, shallowRef } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuGroupNavigation } from '@/composables/useDokuGroupNavigation'
import { DOKU_GROUPS, type DokuGroup, type DokuGroupId } from '@/utils/doku-groups'

vi.mock('@ionic/vue', async importOriginal => ({
  ...await importOriginal<typeof import('@ionic/vue')>(),
  onIonViewDidEnter: vi.fn(),
  onIonViewWillLeave: vi.fn(),
}))

let wrapper: VueWrapper | undefined
let pendingFrame: FrameRequestCallback | undefined
let onResize: () => void

function frame() {
  const callback = pendingFrame
  pendingFrame = undefined
  callback?.(0)
}

async function setup() {
  const content = document.createElement('ion-content')
  const scroll = document.createElement('div')
  // The viewport starts below fixed app chrome and is 1000px tall.
  vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 400, 1000))
  Object.defineProperties(scroll, {
    clientHeight: { configurable: true, value: 1000 },
    scrollHeight: { value: 10000 },
  })
  scroll.scrollTop = 100
  const bounds = new Map<DokuGroupId, DOMRect>()
  for (const group of DOKU_GROUPS) {
    const section = document.createElement('section')
    section.dataset.dokuGroup = group.id
    section.append(document.createElement('ion-card'))
    content.append(section)
    vi.spyOn(section, 'getBoundingClientRect').mockImplementation(() => bounds.get(group.id) ?? new DOMRect())
  }
  content.getScrollElement = vi.fn().mockResolvedValue(scroll)
  const groups = ref<DokuGroup[]>([...DOKU_GROUPS])
  let navigation!: ReturnType<typeof useDokuGroupNavigation>
  wrapper = mount(defineComponent({
    setup() {
      navigation = useDokuGroupNavigation(shallowRef({ $el: content }), groups)
      return () => null
    },
  }))
  await flushPromises()
  frame()
  // Bounds are expressed relative to the content viewport, not the window.
  const place = (id: DokuGroupId, top: number, bottom: number) => bounds.set(id, new DOMRect(0, 100 + top, 400, bottom - top))
  const update = () => {
    scroll.dispatchEvent(new Event('scroll'))
    frame()
  }
  return { ...navigation, groups, scroll, place, update }
}

beforeEach(() => {
  pendingFrame = undefined
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { pendingFrame = callback; return 1 })
  vi.stubGlobal('cancelAnimationFrame', () => { pendingFrame = undefined })
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { onResize = callback }
    observe() {}
    disconnect() {}
  })
})

afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('documentation group visibility tracking', () => {
  test('switches before the heading reaches the top and follows scrolling in both directions', async () => {
    const { place, update, current, previous, next } = await setup()
    place('einsatz', -1000, 350)
    place('abcde', 350, 2000)
    update()
    expect(current.value.id).toBe('abcde')
    expect(previous.value?.id).toBe('einsatz')
    expect(next.value?.id).toBe('sampler')
    place('einsatz', -1000, 650)
    place('abcde', 650, 2000)
    update()
    expect(current.value.id).toBe('einsatz')
  })

  test('selects the largest visible portion even below 60%, clipping both viewport edges', async () => {
    const { place, update, current } = await setup()
    place('einsatz', -2000, 300)
    place('abcde', 300, 750)
    place('sampler', 750, 4000)
    update()
    expect(current.value.id).toBe('abcde')
  })

  test('keeps the current group on ties, otherwise selects the first tied group', async () => {
    const { place, update, current } = await setup()
    place('abcde', -1000, 500)
    place('sampler', 500, 2000)
    update()
    expect(current.value.id).toBe('abcde')
    place('abcde', -1000, 350)
    place('sampler', 350, 2000)
    update()
    expect(current.value.id).toBe('sampler')
    place('abcde', -1000, 500)
    place('sampler', 500, 2000)
    update()
    expect(current.value.id).toBe('sampler')
  })

  test('excludes hidden groups and reevaluates when available groups change', async () => {
    const { place, update, current, groups } = await setup()
    place('abcde', 0, 700)
    place('aufgaben', 700, 2000)
    update()
    expect(current.value.id).toBe('abcde')
    groups.value = [DOKU_GROUPS[0], DOKU_GROUPS[3]]
    await flushPromises()
    frame()
    expect(current.value.id).toBe('aufgaben')
  })

  test('preserves first and last groups at page edges even when they are short', async () => {
    const { place, update, current, scroll } = await setup()
    place('einsatz', 0, 100)
    place('abcde', 100, 2000)
    scroll.scrollTop = 0
    update()
    expect(current.value.id).toBe('einsatz')
    place('abcde', -1000, 900)
    place('aufgaben', 900, 1000)
    scroll.scrollTop = 9000
    update()
    expect(current.value.id).toBe('aufgaben')
  })

  test('recalculates coverage on section and viewport resize without scrolling', async () => {
    const { place, update, current, scroll } = await setup()
    place('einsatz', -1000, 350)
    place('abcde', 350, 2000)
    update()
    expect(current.value.id).toBe('abcde')
    place('einsatz', -1000, 650)
    place('abcde', 650, 2000)
    onResize()
    frame()
    expect(current.value.id).toBe('einsatz')
    Object.defineProperty(scroll, 'clientHeight', { value: 1500 })
    window.dispatchEvent(new Event('resize'))
    frame()
    expect(current.value.id).toBe('abcde')
  })

  test('retains selection when the viewport has no height or no section overlaps', async () => {
    const { place, update, current, scroll } = await setup()
    place('abcde', 0, 1000)
    update()
    expect(current.value.id).toBe('abcde')
    place('abcde', -2000, -1000)
    update()
    expect(current.value.id).toBe('abcde')
    Object.defineProperty(scroll, 'clientHeight', { value: 0 })
    scroll.scrollTop = 0
    update()
    expect(current.value.id).toBe('abcde')
  })
})
