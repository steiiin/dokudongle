import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { IonInput } from '@ionic/vue'

import DodoInputGravTerm from '@/components/DodoInputGravTerm.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoToggleButton from '@/components/DodoToggleButton.vue'
import DodoToggleGroup from '@/components/DodoToggleGroup.vue'
import { PregnancySpan } from '@/types/protocol/pregnancy'

describe('PregnancySpan', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('derives decimal and formatted gestational weeks from the term date', () => {
    const term = new Date(2026, 11, 3)
    const span = new PregnancySpan(term)

    expect(span.total).toBe(24)
    expect(span.totalWeeks).toBe(24)
    expect(span.week).toBe('24+0')
    expect(span.formattedWeek).toBe('24+0')
  })

  test('advances dynamically as the current date changes', () => {
    const span = new PregnancySpan('20+3')

    expect(span.week).toBe('20+3')
    expect(span.total).toBeCloseTo(20 + 3 / 7)

    vi.setSystemTime(new Date(2026, 7, 15, 12))
    expect(span.week).toBe('20+5')
  })

  test('accepts trimester approximations and keeps their source value', () => {
    const span = new PregnancySpan('1. Trimenon')
    expect(span.approx).toBe('1. Trimenon')
    expect(span.isApproximate).toBe(true)
    expect(span.week).toBe('8+0')

    span.approx = '3. Trimenon'
    expect(span.week).toBe('34+0')
    expect(span.calculatedTerm).toEqual(new Date(2026, 8, 24))
  })

  test('switching to an exact term clears the approximation', () => {
    const span = new PregnancySpan('2. Trimenon')
    span.calculatedTerm = new Date(2026, 11, 3)

    expect(span.approx).toBe('')
    expect(span.isApproximate).toBe(false)
  })
})

describe('DodoInputGravTerm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts unrecorded, accepts an exact date without inventing one, and can be cleared', async () => {
    const wrapper = shallowMount(DodoInputGravTerm, {
      props: { modelValue: null, allowClear: true },
      global: { renderStubDefaultSlot: true },
    })
    expect(wrapper.getComponent(DodoToggleGroup).props('modelValue')).toBe('unrecorded')
    expect(wrapper.findComponent(DodoInputSelect).exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.getComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'known')
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(IonInput).props('modelValue')).toBe('')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.getComponent(IonInput).vm.$emit('update:modelValue', '2026-02-31')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.getComponent(IonInput).vm.$emit('update:modelValue', '2026-12-03')
    const value = wrapper.emitted('update:modelValue')!.at(-1)![0] as PregnancySpan
    expect(value.calculatedTerm).toEqual(new Date(2026, 11, 3))
    await wrapper.setProps({ modelValue: value })
    wrapper.getComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'unrecorded')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
    await wrapper.setProps({ modelValue: null })
    expect(wrapper.getComponent(DodoToggleGroup).props('modelValue')).toBe('unrecorded')
    wrapper.getComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'unknown')
    const approximate = wrapper.emitted('update:modelValue')!.at(-1)![0] as PregnancySpan
    expect(approximate.approx).toBe('1. Trimenon')
  })

  test('clearing an exact date removes the recorded term', () => {
    const wrapper = shallowMount(DodoInputGravTerm, {
      props: { modelValue: new PregnancySpan(new Date(2026, 11, 3)), allowClear: true },
    })
    wrapper.getComponent(IonInput).vm.$emit('update:modelValue', '')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })

  test('shows both term modes and the trimester select for an approximation', () => {
    const wrapper = shallowMount(DodoInputGravTerm, {
      props: { modelValue: new PregnancySpan('2. Trimenon') },
      global: { renderStubDefaultSlot: true },
    })

    expect(wrapper.findComponent(DodoToggleGroup).exists()).toBe(true)
    expect(wrapper.findAllComponents(DodoToggleButton)).toHaveLength(2)
    expect(wrapper.text()).toContain('Termin unbekannt')
    expect(wrapper.text()).toContain('Bekannt')
    expect(wrapper.findComponent(DodoInputSelect).props('modelValue')).toBe('2. Trimenon')
  })

  test('emits PregnancySpan values for approximate and exact input', async () => {
    const wrapper = shallowMount(DodoInputGravTerm, {
      props: { modelValue: new PregnancySpan('2. Trimenon') },
    })

    wrapper.findComponent(DodoInputSelect).vm.$emit('update:modelValue', '3. Trimenon')
    const approximate = wrapper.emitted('update:modelValue')?.at(-1)?.[0]
    expect(approximate).toBeInstanceOf(PregnancySpan)
    expect((approximate as PregnancySpan).approx).toBe('3. Trimenon')

    wrapper.findComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'known')
    const exact = wrapper.emitted('update:modelValue')?.at(-1)?.[0]
    expect(exact).toBeInstanceOf(PregnancySpan)
    expect((exact as PregnancySpan).isApproximate).toBe(false)
  })
})
