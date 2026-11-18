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

  const anchor = (id: DokuGroupId) => {
    const section = content.value?.$el?.querySelector<HTMLElement>(`[data-doku-group="${id}"]`)
    return section?.querySelector<HTMLElement>('ion-card') ?? section
  }

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
    const top = scrollElement.getBoundingClientRect().top
    activeId.value = groups.value.reduce<DokuGroupId>((active, group) => {
      const element = anchor(group.id)
      return element && element.getBoundingClientRect().top <= top + 2 ? group.id : active
    }, 'einsatz')
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
    const y = id === 'einsatz' ? 0 : scrollElement.scrollTop + target.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top
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
