import { IonItem } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import ProtocolHistorySettingsCard from '@/views/settingsCards/ProtocolHistorySettingsCard.vue'

const mocks = vi.hoisted(() => ({
  store: {
    protocolHistory: [] as { id: string; archivedAt: string; doku: { situation: { _text: string } } }[],
    isProtocolChanging: false,
    restoreProtocolFromHistory: vi.fn(),
  },
  push: vi.fn(),
}))
vi.mock('@/store/doku', () => ({ useDokuStore: () => reactive(mocks.store) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.store.isProtocolChanging = false
  mocks.store.protocolHistory = [
    { id: 'latest', archivedAt: '2026-10-06T10:30:00.000Z', doku: { situation: { _text: 'Situation' } } },
    { id: 'previous', archivedAt: '2026-10-06T09:30:00.000Z', doku: { situation: { _text: '' } } },
  ]
  mocks.store.restoreProtocolFromHistory.mockResolvedValue(true)
})
const mountCard = () => shallowMount(ProtocolHistorySettingsCard, { global: { renderStubDefaultSlot: true } })

describe('protocol history settings', () => {
  test('renders date/time titles and situation subtitles in store order and handles an empty list', async () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Protokolle wiederherstellen')
    const items = wrapper.findAllComponents(IonItem)
    expect(items).toHaveLength(2)
    const expectedTitle = new Date(mocks.store.protocolHistory[0].archivedAt).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    expect(items[0].get('h2').text()).toBe(expectedTitle)
    expect(items[0].get('.situation-preview').text()).toBe('Situation')
    expect(items[1].get('.situation-preview').text()).toBe('Ohne Situationsbeschreibung')
    reactive(mocks.store).protocolHistory = []
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Keine Protokolle zum Wiederherstellen vorhanden.')
  })

  test('restores once, disables items while waiting and switches to doku only after success', async () => {
    let resolve!: (value: boolean) => void
    mocks.store.restoreProtocolFromHistory.mockReturnValueOnce(new Promise<boolean>(done => { resolve = done }))
    const wrapper = mountCard()
    const item = wrapper.findAllComponents(IonItem)[0]
    item.vm.$emit('click')
    item.vm.$emit('click')
    await wrapper.vm.$nextTick()
    expect(mocks.store.restoreProtocolFromHistory).toHaveBeenCalledExactlyOnceWith('latest')
    expect(wrapper.findAllComponents(IonItem).every(item => item.props('disabled'))).toBe(true)
    expect(mocks.push).not.toHaveBeenCalled()
    resolve(true)
    await flushPromises()
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/tabs/doku')
  })

  test.each(['rejected', 'missing'])('shows an error and stays in settings on %s restoration', async failure => {
    if (failure === 'rejected') mocks.store.restoreProtocolFromHistory.mockRejectedValueOnce(new Error('storage'))
    else mocks.store.restoreProtocolFromHistory.mockResolvedValueOnce(false)
    const wrapper = mountCard()
    wrapper.findAllComponents(IonItem)[0].vm.$emit('click')
    await flushPromises()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('nicht wiederhergestellt')
    expect(wrapper.findAllComponents(IonItem)[0].props('disabled')).toBe(false)
  })
})
