import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { IonPopover } from '@ionic/vue'
import DodoInputAuscultation from '@/components/inputs/DodoInputAuscultation.vue'
import { emptyAuscultation, emptyAuscultationLocations, setNormalAuscultation } from '@/types/protocol/abcde/auscultation'

function editor(modelValue = emptyAuscultation()) {
  return mount(DodoInputAuscultation, {
    props: { modelValue },
    global: {
      renderStubDefaultSlot: true,
      stubs: { IonPopover: true, IonContent: true, IonButton: true, IonIcon: true, IonRippleEffect: true },
    },
  })
}

async function dismiss(wrapper: ReturnType<typeof editor>) {
  wrapper.getComponent(IonPopover).vm.$emit('didDismiss')
  await wrapper.vm.$nextTick()
}

const toggle = (wrapper: ReturnType<typeof editor>) => wrapper.get('[data-testid="auscultation-detail-toggle"]').trigger('click')
const save = (wrapper: ReturnType<typeof editor>) => wrapper.findAll('ion-button-stub').find(item => item.text() === 'Speichern')!.trigger('click')

test('shows ordered quick choices and a separated detail navigation without extra actions', async () => {
  const wrapper = editor()
  await wrapper.get('[data-finding="wheezing"]').trigger('click')
  expect(wrapper.findAll('.quick-sides ion-item').map(item => item.text())).toEqual(['Rechts', 'Links', 'Beidseits', 'Detailierter'])
  expect(wrapper.get('[role="separator"]').element.nextElementSibling?.textContent).toBe('Detailierter')
  expect(wrapper.find('.lung-map').exists()).toBe(false)
  expect(wrapper.findAll('ion-button-stub')).toHaveLength(0)
  await toggle(wrapper)
  expect(wrapper.get('.localization-panel ion-item').text()).toBe('Einfach')
  expect(wrapper.findAll('[data-side]')).toHaveLength(0)
  expect(wrapper.findAll('[data-region]')).toHaveLength(4)
  expect(wrapper.findAll('ion-button-stub').map(item => item.text())).toEqual(['Speichern'])
})

test('keeps region edits across navigation, commits once and reopens details', async () => {
  const initial = setNormalAuscultation(true)
  const wrapper = editor(initial)
  await wrapper.get('[data-finding="wheezing"]').trigger('click')
  await toggle(wrapper)
  await wrapper.get('[data-region="right-upper"]').trigger('click')
  await wrapper.get('[data-region="left-base"]').trigger('keydown', { key: ' ' })
  await toggle(wrapper)
  await toggle(wrapper)
  expect(wrapper.get('[data-region="right-upper"]').attributes('aria-pressed')).toBe('true')
  expect(wrapper.get('[data-region="left-base"]').attributes('aria-pressed')).toBe('true')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  expect(initial).toEqual(setNormalAuscultation(true))
  await save(wrapper)
  expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
  const value = wrapper.emitted('update:modelValue')![0][0] as typeof initial
  expect(value.normalVolume).toBe(true)
  expect(value.noAddedSounds).toBe(false)
  expect(value.findings.wheezing.right.upper).toBe(true)
  expect(value.findings.wheezing.left.base).toBe(true)
  await wrapper.setProps({ modelValue: value })
  await dismiss(wrapper)
  await wrapper.get('[data-finding="wheezing"]').trigger('click')
  expect(wrapper.get('[data-region="right-upper"]').attributes('aria-pressed')).toBe('true')
  await wrapper.get('[data-region="right-upper"]').trigger('click')
  await wrapper.get('[data-region="left-base"]').trigger('click')
  await dismiss(wrapper)
  expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  await wrapper.get('[data-finding="wheezing"]').trigger('click')
  expect(wrapper.get('[data-region="right-upper"]').attributes('aria-pressed')).toBe('true')
  await wrapper.get('[data-region="right-upper"]').trigger('click')
  await wrapper.get('[data-region="left-base"]').trigger('click')
  await save(wrapper)
  expect(wrapper.emitted('update:modelValue')![1][0]).toEqual({ ...emptyAuscultation(), normalVolume: true })
})

for (const side of ['right', 'left', 'both'] as const) {
  test(`quick ${side} replaces regions and saves immediately, including repeated selection`, async () => {
    const initial = emptyAuscultation()
    initial.findings.wheezing.right.upper = true
    initial.findings.wheezing.left.base = true
    const wrapper = editor(initial)
    await wrapper.get('[data-finding="wheezing"]').trigger('click')
    await toggle(wrapper)
    await wrapper.get(`[data-side="${side}"]`).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
    const value = wrapper.emitted('update:modelValue')![0][0] as typeof initial
    const expected = emptyAuscultationLocations()
    expected.right = { upper: side !== 'left', base: side !== 'left' }
    expected.left = { upper: side !== 'right', base: side !== 'right' }
    expect(value.findings.wheezing).toEqual(expected)
    expect(initial.findings.wheezing.right.upper).toBe(true)
    await wrapper.setProps({ modelValue: value })
    await dismiss(wrapper)
    await wrapper.get('[data-finding="wheezing"]').trigger('click')
    expect(wrapper.find('.lung-map').exists()).toBe(false)
    await toggle(wrapper)
    for (const selected of wrapper.findAll('[data-region]')) {
      const isRight = selected.attributes('data-region')!.startsWith('right-')
      expect(selected.attributes('aria-pressed')).toBe(String(isRight ? side !== 'left' : side !== 'right'))
    }
    await toggle(wrapper)
    await wrapper.get(`[data-side="${side}"]`).trigger('click')
    expect(wrapper.emitted('update:modelValue')![1][0]).toEqual(value)
  })
}

test('discards an unsaved region after navigating back and dismissing', async () => {
  const wrapper = editor()
  await wrapper.get('[data-finding="silent"]').trigger('click')
  await toggle(wrapper)
  await wrapper.get('[data-region="right-upper"]').trigger('click')
  await toggle(wrapper)
  await dismiss(wrapper)
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  await wrapper.get('[data-finding="silent"]').trigger('click')
  expect(wrapper.find('.lung-map').exists()).toBe(false)
  await toggle(wrapper)
  expect(wrapper.get('[data-region="right-upper"]').attributes('aria-pressed')).toBe('false')
})

test('normal and none only clear their respective chip group', async () => {
  const initial = emptyAuscultation()
  initial.findings.silent.right.base = true
  initial.findings.wheezing.left.upper = true
  const wrapper = editor(initial)
  expect(wrapper.text()).not.toContain('Unauffällig')
  await wrapper.get('[data-testid="auscultation-volume-normal"]').trigger('click')
  const next = wrapper.emitted('update:modelValue')![0][0] as typeof initial
  expect(next.normalVolume).toBe(true)
  expect(next.findings.silent.right.base).toBe(false)
  expect(next.findings.wheezing.left.upper).toBe(true)
  await wrapper.setProps({ modelValue: next })
  await wrapper.get('[data-testid="auscultation-addedSounds-normal"]').trigger('click')
  expect(wrapper.emitted('update:modelValue')![1][0]).toEqual(setNormalAuscultation(true))
})
