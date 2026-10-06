import { describe, expect, test } from 'vitest'

import { DisabilityNeuro } from '@/types/protocol/abcde'
import { OptionalValue } from '@/types/protocol/input'

describe('DisabilityNeuro text', () => {
  test('omits normal defaults and keeps the normal state', () => {
    const neuro = new DisabilityNeuro()
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
    expect(neuro.hasAbnormalities).toBe(false)
  })

  test.each([
    [{ followInstructions: 'teilweise befolgt' }, 'Anweisungen teilweise befolgt'],
    [{ followInstructions: 'nicht befolgt' }, 'Anweisungen nicht befolgt'],
    [{ msFace: 'leichte' }, 'leichte Fazialisparese'],
    [{ msFace: 'ausgeprägte' }, 'ausgeprägte Fazialisparese'],
    [{ msFace: 'komplette' }, 'komplette Fazialisparese'],
    [{ msMeningism: 'leichter' }, 'leichter Meningismus'],
    [{ msMeningism: 'ausgeprägter' }, 'ausgeprägter Meningismus'],
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
    ['msArmLeft', 'Arm links'],
    ['msArmRight', 'Arm rechts'],
    ['msLegLeft', 'Bein links'],
    ['msLegRight', 'Bein rechts'],
  ] as const)('%s', (field, label) => {
    test.each(['leichtes Absinken', 'Absinken', 'nur Restbewegungen', 'keine aktive Bewegung'] as const)(
      'identifies the limb and side for %s', (value) => {
        const neuro = new DisabilityNeuro()
        neuro[field] = value
        expect(neuro.text).toBe(`${label}: ${value}`)
        expect(neuro.state).toBe(neuro.text)
      },
    )
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
  })

  test('omits not-applicable selections', () => {
    const neuro = new DisabilityNeuro()
    neuro.msMeningism = ''
    neuro.dysarthria = ''
    neuro.aphasia = ''
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
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
      'Anweisungen nicht befolgt; leichte Fazialisparese; Arm links: leichtes Absinken; '
      + 'Arm rechts: Absinken; Bein links: nur Restbewegungen; Bein rechts: keine aktive Bewegung; '
      + 'leichter Meningismus; Tremor/Myoklonien; Sensibilitätsstörung: Taubheit li. Arm; '
      + 'Kribbeln li. Bein; verwaschene Artikulation; schwere Aphasie',
    )
    expect(neuro.state).toBe(neuro.text)

    Object.assign(neuro, new DisabilityNeuro())
    expect(neuro.text).toBe('')
    expect(neuro.state).toBe('normal')
  })
})
