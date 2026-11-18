import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue'
import { DOKU_GROUPS, type DokuGroup, type DokuGroupId } from '@/utils/doku-groups'

export function useDokuGroupNavigation(
  content: Ref<{ $el?: HTMLIonContentElement } | null>,
  groups: Ref<DokuGroup[]>,
) {
  const activeId = ref<DokuGroupId>('einsatz')
  const activeIndex = computed(() => Math.max(0, groups.value.findIndex(group => group.id === activeId.value)))
  const current = computed(() => groups.value[activeIndex.value] ?? DOKU_GROUPS[0])
  const previous = computed(() => groups.value[activeIndex.value - 1])
  const next = computed(() => groups.value[activeIndex.value + 1])
  let scrollElement: HTMLElement | undefined
  let observer: ResizeObserver | undefined
  let frame: number | undefined
  let generation = 0

  const section = (id: DokuGroupId) => content.value?.$el?.querySelector<HTMLElement>(`[data-doku-group="${id}"]`)

  const anchor = (id: DokuGroupId) => {
    const element = section(id)
    return element?.querySelector<HTMLElement>('ion-card') ?? element
  }

  // Share the browser's scroll clearance so group headings land below the floating pill.
  const topClearance = () => scrollElement ? parseFloat(getComputedStyle(scrollElement).scrollPaddingTop) || 0 : 0

  function updateCurrentGroup() {
    if (!scrollElement || scrollElement.clientHeight === 0) return
    if (scrollElement.scrollTop <= 1) {
      activeId.value = 'einsatz'
      return
    }
    if (scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 2) {
      activeId.value = groups.value[groups.value.length - 1].id
      return
    }
    const viewportTop = scrollElement.getBoundingClientRect().top + scrollElement.clientTop
    const top = viewportTop + topClearance()
    const bottom = viewportTop + scrollElement.clientHeight
    let largestHeight = 0
    let largestId = activeId.value
    for (const group of groups.value) {
      const bounds = section(group.id)?.getBoundingClientRect()
      if (!bounds) continue
      const visibleHeight = Math.max(0, Math.min(bounds.bottom, bottom) - Math.max(bounds.top, top))
      // Keep the current group on ties to avoid flickering at an even split.
      if (visibleHeight > largestHeight || (visibleHeight > 0 && visibleHeight === largestHeight && group.id === activeId.value)) {
        largestHeight = visibleHeight
        largestId = group.id
      }
    }
    activeId.value = largestId
  }

  function scheduleUpdate() {
    if (!scrollElement || frame !== undefined) return
    frame = requestAnimationFrame(() => {
      frame = undefined
      updateCurrentGroup()
    })
  }

  function disconnect() {
    generation++
    scrollElement?.removeEventListener('scroll', scheduleUpdate)
    window.removeEventListener('resize', scheduleUpdate)
    observer?.disconnect()
    observer = undefined
    scrollElement = undefined
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }

  async function connect() {
    disconnect()
    const attempt = generation
    await nextTick()
    const element = await content.value?.$el?.getScrollElement?.()
    if (!element || generation !== attempt) return
    scrollElement = element
    element.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleUpdate)
      observer.observe(element)
      // Observe the sections as well as the viewport: expanding an earlier card
      // can move the current heading without producing a scroll event.
      content.value?.$el?.querySelectorAll<HTMLElement>('[data-doku-group]').forEach(section => observer!.observe(section, { box: 'border-box' }))
    }
    scheduleUpdate()
  }

  const duration = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 300

  async function navigate(id: DokuGroupId) {
    if (!scrollElement || !groups.value.some(group => group.id === id)) return
    const target = anchor(id)
    if (!target) return
    const y = id === 'einsatz' ? 0 : scrollElement.scrollTop + target.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top - topClearance()
    await content.value?.$el?.scrollToPoint(0, Math.max(0, y), duration())
    scheduleUpdate()
  }

  async function resetToStart() {
    activeId.value = 'einsatz'
    await nextTick()
    await content.value?.$el?.scrollToTop(duration())
    scheduleUpdate()
  }

  watch(groups, async () => {
    if (!groups.value.some(group => group.id === activeId.value)) activeId.value = 'einsatz'
    await nextTick()
    scheduleUpdate()
  })
  onMounted(connect)
  onIonViewDidEnter(connect)
  onIonViewWillLeave(disconnect)
  onBeforeUnmount(disconnect)

  return { current, previous, next, navigate, resetToStart }
}
