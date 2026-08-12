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
}))

import DodoInputSampleLimb from '@/components/DodoInputSampleLimb.vue'
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
