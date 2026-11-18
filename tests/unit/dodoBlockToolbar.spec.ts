import { shallowMount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import DodoBlockToolbar from '@/components/ui/DodoBlockToolbar.vue'
import { DOKU_GROUPS } from '@/utils/doku-groups'

describe('block toolbar', () => {
  test('labels and emits navigation destinations, disables boundaries, and exposes edit state', async () => {
    const wrapper = shallowMount(DodoBlockToolbar, {
      props: { current: DOKU_GROUPS[0], next: DOKU_GROUPS[1], edited: false },
    })
    expect(wrapper.get('.group-label').text()).toBe('EINSATZ')
    expect(wrapper.get('.edit-indicator').attributes('aria-label')).toBe('Unverändert')
    expect(wrapper.findAll('button')[0].attributes('disabled')).toBeDefined()
    await wrapper.get('button[aria-label="Zu ABCDE"]').trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['abcde']])
    await wrapper.setProps({ current: DOKU_GROUPS[3], previous: DOKU_GROUPS[2], next: undefined, edited: true })
    expect(wrapper.get('.edit-indicator').classes()).toContain('edited')
    expect(wrapper.get('.edit-indicator').attributes('aria-label')).toBe('Bearbeitet')
    expect(wrapper.findAll('button')[1].attributes('disabled')).toBeDefined()
    await wrapper.get('button[aria-label="Zu SAMPLER"]').trigger('click')
    expect(wrapper.emitted('navigate')?.[1]).toEqual(['sampler'])
  })
})
