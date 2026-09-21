import { IonContent, IonTabButton, IonIcon } from '@ionic/vue'
import { shallowMount } from '@vue/test-utils'
import { cog } from 'ionicons/icons'
import { reactive } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoConnectionBadge from '@/components/DodoConnectionBadge.vue'
import DodoDongleSettingsCard from '@/components/DodoDongleSettingsCard.vue'
import DodoSendAction from '@/components/DodoSendAction.vue'
import TabPageSettings from '@/views/TabPageSettings.vue'
import TabsPage from '@/views/TabsPage.vue'

const mocks = vi.hoisted(() => ({
  store: { isDongleConnecting: false, isDongleTransmitting: false },
}))

vi.mock('@/store/doku', () => ({
  useDokuStore: () => reactive(mocks.store),
}))

describe('Settings tab', () => {
  beforeEach(() => { mocks.store.isDongleConnecting = false })

  test('uses the shared toolbar and only blurs content while connecting', async () => {
    const wrapper = shallowMount(TabPageSettings, {
      global: { renderStubDefaultSlot: true },
    })
    expect(wrapper.text()).toContain('Einstellungen')
    expect(wrapper.findComponent(DodoConnectionBadge).exists()).toBe(true)
    expect(wrapper.findComponent(DodoSendAction).exists()).toBe(true)
    expect(wrapper.getComponent(IonContent).findComponent(DodoDongleSettingsCard).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Dongle suchen')
    expect(wrapper.getComponent(IonContent).classes()).not.toContain('dongle-connecting')

    reactive(mocks.store).isDongleConnecting = true
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonContent).classes()).toContain('dongle-connecting')
    expect(wrapper.classes()).not.toContain('dongle-connecting')
  })

  test('keeps the tab order and links the cog icon to settings', () => {
    const wrapper = shallowMount(TabsPage, {
      global: { renderStubDefaultSlot: true },
    })
    const tabs = wrapper.findAllComponents(IonTabButton)
    expect(tabs.map(tab => tab.text())).toEqual(['Einstellungen', 'Eingabe', 'Vorschau'])
    expect(tabs[0].props()).toMatchObject({ tab: 'settings', href: '/tabs/settings' })
    expect(tabs[0].getComponent(IonIcon).props('icon')).toBe(cog)
  })
})
