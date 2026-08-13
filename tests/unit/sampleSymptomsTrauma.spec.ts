import { shallowMount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/store/doku', () => ({
  useDokuStore: () => ({ context: {} }),
}))

vi.mock('@/utils/filter', () => ({
  onHigh: (text: string) => text,
  onNormal: (text: string) => text,
}))

vi.mock('@/utils/input', () => ({
  gainFocus: vi.fn(),
  setNativeValue: vi.fn(),
}))

import DodoInputNumber from '@/components/DodoInputNumber.vue'
import DodoInputSampleLimb from '@/components/DodoInputSampleLimb.vue'
import { AssessedValue } from '@/types/protocol/input'
import { SstLimb, SstLimbs } from '@/types/protocol/sample'

const noVisibleInjuries = 'keine Verletzungen sichtbar; frei beweglich.'

describe('SstLimbs', () => {
  test('groups uninjured limbs despite a hidden pDMS state', () => {
    const limbs = new SstLimbs()
    limbs.armLeft.dms.state = 'iO'

    expect(limbs.generateText()).toBe(`Arme/Beine: ${noVisibleInjuries} \n`)
  })

  test('groups uninjured limbs despite hidden pDMS deficits', () => {
    const limbs = new SstLimbs()
    limbs.armLeft.dms.state = 'gestoert'
    limbs.armLeft.dms.deficit = 'Taubheit'
    limbs.legRight.dms.deficit = 'nicht mehr sichtbar'

    expect(limbs.generateText()).toBe(`Arme/Beine: ${noVisibleInjuries} \n`)
  })

  test('groups identical injured limbs', () => {
    const limbs = new SstLimbs()

    for (const limb of [limbs.armLeft, limbs.armRight, limbs.legLeft, limbs.legRight]) {
      limb.isInjured = true
      limb.dms.state = 'gestoert'
      limb.dms.deficit = 'Taubheit'
    }

    expect(limbs.generateText()).toBe('Arme/Beine: pDMS gestört (Taubheit) \n')
  })

  test('keeps genuinely different findings separate', () => {
    const limbs = new SstLimbs()
    limbs.armLeft.isInjured = true
    limbs.armLeft.dms.state = 'iO'

    expect(limbs.generateText()).toBe(
      `Arm (li.): pDMS iO \nArm (re.): ${noVisibleInjuries} \nBeine: ${noVisibleInjuries} \n`,
    )
  })

  test('ignores a deficit unless the pDMS state is disturbed', () => {
    const limbs = new SstLimbs()
    limbs.armLeft.isInjured = true
    limbs.armLeft.dms.state = 'iO'
    limbs.armLeft.dms.deficit = 'alter Wert'
    limbs.armRight.isInjured = true
    limbs.armRight.dms.state = 'iO'

    expect(limbs.generateText()).toBe(
      `Arme: pDMS iO \nBeine: ${noVisibleInjuries} \n`,
    )
  })
})

describe('DodoInputSampleLimb', () => {
  test('initializes and clears pDMS when injury status changes', async () => {
    const limb = reactive(new SstLimb())

    shallowMount(DodoInputSampleLimb, {
      props: {
        modelValue: limb,
        label: 'Linker Arm',
      },
    })

    limb.isInjured = true
    await nextTick()
    expect(limb.dms.state).toBe('iO')

    limb.dms.state = 'gestoert'
    await nextTick()
    limb.dms.deficit = 'Taubheit'

    limb.isInjured = false
    await nextTick()
    expect(limb.dms.state).toBe('')
    expect(limb.dms.deficit).toBe('')
  })
})

describe('DodoInputNumber', () => {
  test('clamps values to the configured min and max', async () => {
    const wrapper = shallowMount(DodoInputNumber, {
      props: {
        modelValue: AssessedValue.assessed(50),
        min: 10,
        max: 20,
      },
      global: {
        stubs: {
          IonInput: {
            props: ['modelValue', 'label', 'placeholder', 'class', 'inputmode', 'maxlength', 'clearInput', 'fill', 'labelPlacement'],
            template: `
              <input
                :value="modelValue"
                @input="$emit('ionInput', { detail: { value: $event.target.value } })"
                @blur="$emit('ionBlur')"
                @focus="$emit('ionFocus')"
              />
            `,
          },
        },
      },
    })

    const input = wrapper.find('input')
    await input.setValue('999')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(AssessedValue.assessed(20))

    await input.setValue('2')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(AssessedValue.assessed(10))
  })
})
