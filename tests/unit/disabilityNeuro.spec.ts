import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'

import { useDokuStore } from '@/store/doku'
import { DisabilityNeuro } from '@/types/protocol/abcde'
import { OptionalValue } from '@/types/protocol/input'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('DisabilityNeuro non-verbal context', () => {
  test.each([
    {},
    { followInstructions: 'teilweise befolgt' },
    { followInstructions: 'nicht befolgt' },
    { msMeningism: '' },
    { msMeningism: 'kein' },
    { msMeningism: 'leichter' },
    { msMeningism: 'ausgeprägter' },
    { sensitivity: OptionalValue.active('Taubheit li. Arm') },
    { paraesthesia: OptionalValue.active('Kribbeln li. Arm') },
    { dysarthria: '' },
    { dysarthria: 'verwaschen' },
    { dysarthria: 'unverständlich' },
    { dysarthria: 'stumm' },
    { aphasia: '' },
    { aphasia: 'leichte' },
    { aphasia: 'schwere' },
    { aphasia: 'globale' },
  ] satisfies Partial<DisabilityNeuro>[])('ignores inapplicable findings without mutating stored values: %j', finding => {
    const store = useDokuStore()
    const neuro: DisabilityNeuro = Object.assign(new DisabilityNeuro(), finding)
    const originalValues = JSON.stringify(neuro)
    const originalOutput = [neuro.text, neuro.symptomsText, neuro.summaryText, neuro.state, neuro.hasAbnormalities]

    store.doku.flavors.non_verbal = true
    expect(neuro.text).toBe('')
    expect(neuro.symptomsText).toBe('')
    expect(neuro.neckStiffnessText).toBe('')
    expect(neuro.summaryText).toBe('keine Paresen')
    expect(neuro.state).toBe('normal')
    expect(neuro.hasAbnormalities).toBe(false)
    expect(JSON.stringify(neuro)).toBe(originalValues)

    store.doku.flavors.non_verbal = false
    expect([neuro.text, neuro.symptomsText, neuro.summaryText, neuro.state, neuro.hasAbnormalities])
      .toEqual(originalOutput)
  })

  test.each([
    [{ msFace: 'leichte' }, 'leichte Fazialisparese', 'Facialparese'],
    [{ msArmLeft: 'Absinken' }, 'Absinken Arm li', 'Armparese'],
    [{ msLegRight: 'Absinken' }, 'Absinken Bein re', 'Beinparese'],
    [{ msTremor: true }, 'Tremor/Myoklonien', 'keine Paresen'],
  ] satisfies [Partial<DisabilityNeuro>, string, string][])('keeps applicable findings: %j', (finding, detail, summary) => {
    useDokuStore().doku.flavors.non_verbal = true
    const neuro = Object.assign(new DisabilityNeuro(), finding)
    expect(neuro.text).toBe(detail)
    expect(neuro.state).toBe(detail)
    expect(neuro.hasAbnormalities).toBe(true)
    expect(neuro.summaryText).toBe(summary)
  })
})

describe('DisabilityNeuro text', () => {
  test('omits normal defaults and keeps the normal state', () => {
    const neuro = new DisabilityNeuro()
    expect(neuro.text).toBe('')
    expect(neuro.symptomsText).toBe('keine Nackensteife')
    expect(neuro.state).toBe('normal')
    expect(neuro.hasAbnormalities).toBe(false)
    expect(neuro.summaryText).toBe('keine Paresen/Parästhesien')
  })

  test.each([
    [{ followInstructions: 'teilweise befolgt' }, 'Anweisungen teilweise befolgt'],
    [{ followInstructions: 'nicht befolgt' }, 'Anweisungen nicht befolgt'],
    [{ msFace: 'leichte' }, 'leichte Fazialisparese'],
    [{ msFace: 'ausgeprägte' }, 'ausgeprägte Fazialisparese'],
    [{ msFace: 'komplette' }, 'komplette Fazialisparese'],
    [{ msMeningism: 'leichter' }, 'leichte Nackensteife'],
    [{ msMeningism: 'ausgeprägter' }, 'ausgeprägte Nackensteife'],
    [{ msTremor: true }, 'Tremor/Myoklonien'],
    [{ dysarthria: 'verwaschen' }, 'verwaschene Artikulation'],
    [{ dysarthria: 'unverständlich' }, 'unverständliche Artikulation'],
    [{ dysarthria: 'stumm' }, 'stumm'],
    [{ aphasia: 'leichte' }, 'leichte Aphasie'],
    [{ aphasia: 'schwere' }, 'schwere Aphasie'],
    [{ aphasia: 'globale' }, 'globale Aphasie'],
  ] satisfies [Partial<DisabilityNeuro>, string][])('describes an isolated finding: %j', (finding, expected) => {
    const neuro = Object.assign(new DisabilityNeuro(), finding)
    expect(neuro.text).toBe(expected)
    expect(neuro.state).toBe(expected)
    expect(neuro.hasAbnormalities).toBe(true)
  })

  describe.each([
    ['msArmLeft', 'Arm li'],
    ['msArmRight', 'Arm re'],
    ['msLegLeft', 'Bein li'],
    ['msLegRight', 'Bein re'],
  ] as const)('%s', (field, label) => {
    test.each(['leichtes Absinken', 'Absinken', 'nur Restbewegungen', 'keine aktive Bewegung'] as const)(
      'identifies the limb and side for %s', (value) => {
        const neuro = new DisabilityNeuro()
        neuro[field] = value
        expect(neuro.text).toBe(`${value} ${label}`)
        expect(neuro.state).toBe(neuro.text)
        expect(neuro.summaryText).toBe(field.startsWith('msArm') ? 'Armparese' : 'Beinparese')
      },
    )
  })

  describe.each([
    [['msArmLeft', 'msLegLeft'], 'li'],
    [['msArmRight', 'msLegRight'], 're'],
    [['msArmLeft', 'msArmRight'], 'Arme'],
    [['msLegLeft', 'msLegRight'], 'Beine'],
    [['msArmLeft', 'msArmRight', 'msLegLeft', 'msLegRight'], 'Extremitäten'],
    [['msArmLeft', 'msArmRight', 'msLegLeft'], 'Arme und Bein li'],
    [['msArmLeft', 'msArmRight', 'msLegRight'], 'Arme und Bein re'],
    [['msArmLeft', 'msLegLeft', 'msLegRight'], 'Arm li und Beine'],
    [['msArmRight', 'msLegLeft', 'msLegRight'], 'Arm re und Beine'],
    [['msArmLeft', 'msLegRight'], 'Arm li und Bein re'],
    [['msArmRight', 'msLegLeft'], 'Arm re und Bein li'],
  ] as const)('matching findings in %j', (fields, label) => {
    test.each(['leichtes Absinken', 'Absinken', 'nur Restbewegungen', 'keine aktive Bewegung'] as const)(
      'groups %s without including normal limbs', value => {
        const neuro = new DisabilityNeuro()
        for (const field of fields) neuro[field] = value
        expect(neuro.text).toBe(`${value} ${label}`)
        expect(neuro.state).toBe(neuro.text)
      },
    )
  })

  test('keeps different findings separate in first-limb order and regroups after edits', () => {
    const neuro: DisabilityNeuro = Object.assign(new DisabilityNeuro(), {
      msArmLeft: 'leichtes Absinken', msArmRight: 'Absinken',
      msLegLeft: 'Absinken', msLegRight: 'leichtes Absinken',
    } satisfies Partial<DisabilityNeuro>)
    expect(neuro.text).toBe('leichtes Absinken Arm li und Bein re; Absinken Arm re und Bein li')

    neuro.msArmLeft = 'Absinken'
    expect(neuro.text).toBe('Absinken Arme und Bein li; leichtes Absinken Bein re')
    neuro.msLegRight = 'Absinken'
    expect(neuro.text).toBe('Absinken Extremitäten')
    neuro.msArmRight = 'ohne Absinken'
    neuro.msLegRight = 'ohne Absinken'
    expect(neuro.text).toBe('Absinken li')
    neuro.msArmLeft = 'leichtes Absinken'
    expect(neuro.text).toBe('leichtes Absinken Arm li; Absinken Bein li')

    Object.assign(neuro, new DisabilityNeuro())
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
  })

  describe.each(['sensitivity', 'paraesthesia'] as const)('%s', (field) => {
    test.each([
      [false, 'Taubheit li. Arm'],
      [false, ''],
      [true, ''],
      [true, '   '],
    ])('omits inactive or blank descriptions: active=%s, value=%j', (active, value) => {
      const neuro = new DisabilityNeuro()
      neuro[field] = new OptionalValue(active, value)
      expect(neuro.text).toBe('')
      expect(neuro.state).toBe('normal')
      expect(neuro.summaryText).toBe('keine Paresen/Parästhesien')
    })
  })

  test.each([
    ['sensitivity', 'Taubheit li. Arm', 'Sensibilitätsstörung: Taubheit li. Arm'],
    ['paraesthesia', 'li. Arm', 'Parästhesie: li. Arm'],
    ['paraesthesia', 'Kribbeln li. Arm', 'Kribbeln li. Arm'],
    ['paraesthesia', 'Parästhesie: li. Arm', 'Parästhesie: li. Arm'],
  ] as const)('formats active %s description %j', (field, value, expected) => {
    const neuro = new DisabilityNeuro()
    neuro[field] = OptionalValue.active(value)
    expect(neuro.text).toBe(expected)
    expect(neuro.state).toBe(expected)
    expect(neuro.summaryText).toBe(field === 'sensitivity' ? 'Störung Sensibilität' : 'Parästhesien')
  })

  test('omits not-applicable selections', () => {
    const neuro = new DisabilityNeuro()
    neuro.msMeningism = ''
    neuro.dysarthria = ''
    neuro.aphasia = ''
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
    expect(neuro.summaryText).toBe('keine Paresen/Parästhesien')
  })

  test('combines findings in property order and recomputes after edits', () => {
    const neuro = Object.assign(new DisabilityNeuro(), {
      followInstructions: 'nicht befolgt',
      msFace: 'leichte',
      msArmLeft: 'leichtes Absinken',
      msArmRight: 'Absinken',
      msLegLeft: 'nur Restbewegungen',
      msLegRight: 'keine aktive Bewegung',
      msMeningism: 'leichter',
      msTremor: true,
      sensitivity: OptionalValue.active('Taubheit li. Arm'),
      paraesthesia: OptionalValue.active('Kribbeln li. Bein'),
      dysarthria: 'verwaschen',
      aphasia: 'schwere',
    } satisfies Partial<DisabilityNeuro>)
    expect(neuro.text).toBe(
      'Anweisungen nicht befolgt; leichte Fazialisparese; leichtes Absinken Arm li; '
      + 'Absinken Arm re; nur Restbewegungen Bein li; keine aktive Bewegung Bein re; '
      + 'leichte Nackensteife; Tremor/Myoklonien; Sensibilitätsstörung: Taubheit li. Arm; '
      + 'Kribbeln li. Bein; verwaschene Artikulation; schwere Aphasie',
    )
    expect(neuro.state).toBe(neuro.text)
    expect(neuro.summaryText).toBe('Aphasie, Paresen, Störung Sensibilität, Parästhesien, leichte Nackensteife')

    Object.assign(neuro, new DisabilityNeuro())
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
    expect(neuro.summaryText).toBe('keine Paresen/Parästhesien')
  })
})

describe('DisabilityNeuro neck stiffness', () => {
  test.each([
    ['leichter', 'leichte Nackensteife', ''],
    ['ausgeprägter', 'ausgeprägte Nackensteife', ''],
    ['kein', '', 'keine Nackensteife'],
    ['', '', ''],
  ] as const)('separates summary, preview and symptoms for %j', (value, positive, negative) => {
    const neuro = new DisabilityNeuro()
    neuro.msMeningism = value
    expect(neuro.summaryText).toBe(positive || 'keine Paresen/Parästhesien')
    expect(neuro.text).toBe(positive)
    expect(neuro.state).toBe(positive || 'normal')
    expect(neuro.hasAbnormalities).toBe(Boolean(positive))
    expect(neuro.symptomsText).toBe(negative)

    neuro.msArmLeft = 'Absinken'
    neuro.msTremor = true
    expect(neuro.summaryText).toBe(['Armparese', positive].filter(Boolean).join(', '))
    expect(neuro.text).toBe(['Absinken Arm li', positive, 'Tremor/Myoklonien'].filter(Boolean).join('; '))
    expect(neuro.state).toBe(neuro.text)
    expect(neuro.symptomsText).toBe(['Absinken Arm li', negative, 'Tremor/Myoklonien'].filter(Boolean).join('; '))
  })
})

describe('DisabilityNeuro summary', () => {
  test.each([
    [{ msFace: 'leichte' }, 'Facialparese'],
    [{ msFace: 'ausgeprägte' }, 'Facialparese'],
    [{ msFace: 'komplette' }, 'Facialparese'],
    [{ msMeningism: 'leichter' }, 'leichte Nackensteife'],
    [{ msMeningism: 'ausgeprägter' }, 'ausgeprägte Nackensteife'],
    [{ msArmLeft: 'Absinken', msArmRight: 'leichtes Absinken' }, 'Armparese'],
    [{ msLegLeft: 'Absinken', msLegRight: 'keine aktive Bewegung' }, 'Beinparese'],
    [{ msFace: 'leichte', msArmRight: 'Absinken' }, 'Paresen'],
    [{ msFace: 'komplette', msLegLeft: 'Absinken' }, 'Paresen'],
    [{ msArmLeft: 'Absinken', msLegRight: 'Absinken' }, 'Paresen'],
    [{ msTremor: true }, 'keine Paresen/Parästhesien'],
    [{ followInstructions: 'teilweise befolgt' }, 'keine Paresen/Parästhesien'],
    [{ followInstructions: 'nicht befolgt' }, 'keine Paresen/Parästhesien'],
  ] satisfies [Partial<DisabilityNeuro>, string][])('summarizes %j as %s', (finding, expected) => {
    expect(Object.assign(new DisabilityNeuro(), finding).summaryText).toBe(expected)
  })

  describe.each(['', 'keine', 'leichte', 'schwere', 'globale'] as const)('aphasia=%s', aphasia => {
    test.each(['', 'normal', 'verwaschen', 'unverständlich', 'stumm'] as const)(
      'combines articulation=%s into at most one Aphasie finding', dysarthria => {
        const neuro = Object.assign(new DisabilityNeuro(), { aphasia, dysarthria })
        const abnormal = !['', 'keine'].includes(aphasia) || !['', 'normal'].includes(dysarthria)
        expect(neuro.summaryText).toBe(abnormal ? 'Aphasie' : 'keine Paresen/Parästhesien')
      },
    )
  })
})
