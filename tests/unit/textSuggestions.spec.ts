import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, expect, test, vi } from 'vitest'

import DodoTextSuggestionHost from '@/components/DodoTextSuggestionHost.vue'
import DodoTextSuggestionPanel from '@/components/DodoTextSuggestionPanel.vue'
import { provideTextSuggestionScope } from '@/services/text-suggestions'
import type { TextSuggestion } from '@/services/text-assist'

const suggestion = (id: string): TextSuggestion => ({
  id,
  label: id,
  replacement: id,
  type: 'phrase',
  source: 'learned',
  score: 1,
  start: 0,
  end: 0,
})

const NestedHost = defineComponent({
  components: { DodoTextSuggestionHost },
  setup(_, { expose }) {
    const scope = provideTextSuggestionScope()
    expose({ scope })
  },
  template: '<div class="nested"><DodoTextSuggestionHost /></div>',
})

const HostHarness = defineComponent({
  components: { DodoTextSuggestionHost, NestedHost },
  setup(_, { expose }) {
    const scope = provideTextSuggestionScope()
    const nested = ref<InstanceType<typeof NestedHost> | null>(null)
    expose({ scope, nested })
    return { nested }
  },
  template: `
    <div class="outer"><DodoTextSuggestionHost /></div>
    <NestedHost ref="nested" />
  `,
})

describe('text suggestion panel interactions', () => {
  test('preserves input focus on pointerdown and selects once on click', async () => {
    const item = suggestion('candidate')
    const wrapper = mount(DodoTextSuggestionPanel, {
      props: { suggestions: [item] },
    })
    const button = wrapper.get('button')

    await button.trigger('pointerdown')
    expect(wrapper.emitted('select')).toBeUndefined()

    await button.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[item]])
  })
})

describe('scoped text suggestion hosts', () => {
  test('keeps nested modal suggestions separate and ignores stale owners', async () => {
    const wrapper = mount(HostHarness)
    const outerScope = (wrapper.vm as any).scope
    const nestedScope = (wrapper.vm as any).nested.scope
    const outerOwner = Symbol('outer')
    const staleOwner = Symbol('stale')
    const nestedOwner = Symbol('nested')
    const selectOuter = vi.fn()
    const selectNested = vi.fn()

    outerScope.activate(outerOwner, selectOuter)
    outerScope.update(outerOwner, [suggestion('outer')])
    outerScope.update(staleOwner, [suggestion('stale')])
    nestedScope.activate(nestedOwner, selectNested)
    nestedScope.update(nestedOwner, [suggestion('nested')])
    await nextTick()

    const panels = wrapper.findAllComponents(DodoTextSuggestionPanel)
    expect(panels[0].props('suggestions').map(item => item.id)).toEqual(['outer'])
    expect(panels[1].props('suggestions').map(item => item.id)).toEqual(['nested'])

    panels[1].vm.$emit('select', panels[1].props('suggestions')[0])
    expect(selectNested).toHaveBeenCalledOnce()
    expect(selectOuter).not.toHaveBeenCalled()

    nestedScope.clear(staleOwner)
    expect(panels[1].props('suggestions')).toHaveLength(1)
    nestedScope.clear(nestedOwner)
    await nextTick()
    expect(panels[1].props('suggestions')).toEqual([])
  })
})
