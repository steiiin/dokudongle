import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  auscultationFindings, auscultationText, auscultationLocationText, confirmAuscultationFinding,
  emptyAuscultation, emptyAuscultationLocations, hasAuscultationFindings, normalizeAuscultation,
  selectLungRegion, selectLungSides, lungSides, lungRegions, reconcileRestoredAuscultation,
  type AuscultationFinding, setNormalAuscultation, setAuscultationGroupNormal,
} from '@/types/protocol/abcde/auscultation'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))
beforeEach(() => { setActivePinia(createPinia()); vi.resetAllMocks() })

function fields(mask: number) {
  return {
    right: { upper: !!(mask & 1), base: !!(mask & 2) },
    left: { upper: !!(mask & 4), base: !!(mask & 8) },
  }
}
function findings(choices: Partial<Record<AuscultationFinding, number>>) {
  const value = emptyAuscultation()
  for (const [key, mask] of Object.entries(choices)) value.findings[key as AuscultationFinding] = fields(mask)
  return value
}

const examples: [Partial<Record<AuscultationFinding, number>>, string][] = [
  [{ diminished: 2 }, 're. basal AG abgeschwächt.'],
  [{ crackles: 10 }, 'bds. basal RGs.'],
  [{ wheezing: 4 }, 'li. Oberfeld Giemen.'],
  [{ enhanced: 3, wheezing: 3 }, 're. AG verschärft, Giemen.'],
  [{ silent: 3 }, 're. kein AG.'],
  [{ wheezing: 15, rhonchi: 15 }, 'Ubiquitär Giemen und Brummen.'],
  [{ diminished: 10, crackles: 10 }, 'bds. basal AG abgeschwächt, RGs.'],
  [{ diminished: 3, crackles: 8 }, 're. AG abgeschwächt. li. basal RGs.'],
  [{ diminished: 11 }, 'bds. basal und re. Oberfeld AG abgeschwächt.'],
]

describe('localized auscultation', () => {
  test.each(examples)('formats %j as %s', (choices, expected) => {
    const value = findings(choices)
    expect(auscultationText(value)).toBe(expected)
    const breathing = useDokuStore().doku.xaBcde
    breathing.auscultation.assessed = true
    breathing.auscultation.value = value
    expect(breathing.auscultationText).toBe(expected)
    expect(breathing.generateText()).toContain(expected)
    expect(breathing.generateText()).not.toMatch(/\.\.|\.;/)
  })

  const locations = [
    '', 're. Oberfeld', 're. basal', 're.', 'li. Oberfeld', 'bds. Oberfeld',
    're. basal und li. Oberfeld', 'bds. Oberfeld und re. basal', 'li. basal',
    're. Oberfeld und li. basal', 'bds. basal', 'bds. basal und re. Oberfeld',
    'li.', 'bds. Oberfeld und li. basal', 'bds. basal und li. Oberfeld', 'Ubiquitär',
  ]
  test.each(locations.map((text, mask) => [mask, text] as const))('formats field mask %i', (mask, text) => {
    expect(auscultationLocationText(fields(mask))).toBe(text)
    expect(auscultationLocationText(fields(mask), true)).toBe(text.charAt(0).toLowerCase() + text.slice(1))
  })

  test('groups identical masks only, preserves order and joins all added sounds', () => {
    expect(auscultationText(findings({ enhanced: 15, wheezing: 15, rhonchi: 15, crackles: 15 })))
      .toBe('Ubiquitär AG verschärft, Giemen, Brummen und RGs.')
    expect(auscultationText(findings({ diminished: 3, wheezing: 1, crackles: 3 })))
      .toBe('re. AG abgeschwächt, RGs. re. Oberfeld Giemen.')
    expect(auscultationText(findings({ enhanced: 1, diminished: 2, silent: 4, crackles: 8 })))
      .toBe('re. Oberfeld AG verschärft. re. basal AG abgeschwächt. li. Oberfeld kein AG. li. basal RGs.')
  })

  test('the latest finding wins every conflicting pair at each field without changing other fields or inputs', () => {
    for (const { key: first } of auscultationFindings) for (const { key: second } of auscultationFindings) {
      if (first === second) continue
      const conflicts = first === 'silent' || second === 'silent'
        || (['enhanced', 'diminished'].includes(first) && ['enhanced', 'diminished'].includes(second))
      for (const side of lungSides) for (const region of lungRegions) {
        const state = findings({ [first]: 15 })
        const selection = emptyAuscultationLocations()
        selection[side][region] = true
        const next = confirmAuscultationFinding(state, second, selection)
        const expected = fields(15)
        expected[side][region] = !conflicts
        expect(next.findings[first]).toEqual(expected)
        expect(next.findings[second]).toEqual(selection)
        expect(state).toEqual(findings({ [first]: 15 }))
        const removed = confirmAuscultationFinding(next, second, emptyAuscultationLocations())
        expect(removed.findings[first]).toEqual(expected)
        expect(removed.findings[second]).toEqual(fields(0))
        expect(selection[side][region]).toBe(true)
      }
    }
  })

  test('quick selections select fields and obey the same conflict rules', () => {
    let state = confirmAuscultationFinding(emptyAuscultation(), 'wheezing', selectLungSides(lungSides))
    state = confirmAuscultationFinding(state, 'silent', selectLungSides(['right']))
    expect(state.findings.silent).toEqual(fields(3))
    expect(state.findings.wheezing).toEqual(fields(12))
    state = confirmAuscultationFinding(state, 'crackles', selectLungSides(['right']))
    expect(state.findings.silent).toEqual(fields(0))
    expect(state.findings.crackles).toEqual(fields(3))
    const selection = selectLungSides(lungSides)
    selectLungRegion(selection, 'right', 'upper')
    expect(selection).toEqual(fields(14))
  })

  test('normal groups clear only their own findings and suppress normal text alongside pathology', () => {
    let value = setNormalAuscultation(true)
    value = confirmAuscultationFinding(value, 'wheezing', fields(2))
    expect(value.normalVolume).toBe(true)
    expect(auscultationText(value)).toBe('re. basal Giemen.')
    value = confirmAuscultationFinding(value, 'silent', fields(2))
    value = setAuscultationGroupNormal(value, 'addedSounds', true)
    expect(value.findings.silent).toEqual(fields(2))
    expect(auscultationText(value)).toBe('re. basal kein AG.')
    value = setAuscultationGroupNormal(value, 'volume', true)
    expect(value).toEqual(setNormalAuscultation(true))
    expect(auscultationText(value)).toBe('Ausk. unauffällig')
    expect(auscultationText(setAuscultationGroupNormal(value, 'volume', false))).toBe('keine Nebengeräusche')
    expect(auscultationText(setAuscultationGroupNormal(value, 'addedSounds', false))).toBe('AG normal')
    value = confirmAuscultationFinding(value, 'wheezing', fields(1))
    value = confirmAuscultationFinding(value, 'wheezing', fields(0))
    expect(value).toEqual({ ...emptyAuscultation(), normalVolume: true })
    expect(hasAuscultationFindings(setNormalAuscultation(true))).toBe(false)
    expect(setNormalAuscultation(false)).toEqual(emptyAuscultation())
  })

  test('restoration gives current fields precedence without replaying conflicting old fields', () => {
    for (const { key: first } of auscultationFindings) for (const { key: second } of auscultationFindings) {
      for (const mask of [1, 2, 4, 8, 3, 12, 15]) {
        const old = findings({ [first]: 15 })
        const current = findings({ [second]: mask })
        const expected = confirmAuscultationFinding(old, second, fields(mask))
        // Restored fields of the same finding should survive outside the new selection.
        if (first === second) expected.findings[second] = fields(15)
        expect(reconcileRestoredAuscultation(old, current)).toEqual(expected)
      }
    }
    expect(reconcileRestoredAuscultation(findings({ silent: 2, diminished: 8 }), findings({ enhanced: 2, silent: 8 })))
      .toEqual(findings({ enhanced: 2, silent: 8 }))
  })

  test('text and treatment use only active confirmed findings', () => {
    const breathing = useDokuStore().doku.xaBcde
    expect(breathing.auscultationText).toBe('')
    expect(breathing.normalAuscultation).toBe(false)
    breathing.auscultation.assessed = true
    expect(breathing.auscultationState).toBe('Keine Angaben')
    for (const { key } of auscultationFindings) {
      breathing.resetAuscultation()
      breathing.auscultation.value.findings[key].right.upper = true
      expect(breathing.needTreatment).toBe(true)
      expect(breathing.auscultationText).toBe(auscultationText(breathing.auscultation.value))
      breathing.auscultation.assessed = false
      expect(breathing.needTreatment).toBe(false)
      expect(breathing.auscultationText).toBe('')
      breathing.auscultation.assessed = true
    }
  })
})

describe('auscultation persistence', () => {
  const oldRegional = {
    normalVolume: true, noAddedSounds: true,
    findings: {
      enhanced: { right: { apex: true }, left: { apex: true, base: true } },
      diminished: { right: { middle: true }, left: { middle: true } },
      silent: { right: { apex: true } },
      wheezing: { right: { middle: true }, left: { unspecified: true } },
      rhonchi: { right: { base: true, unspecified: true } },
      crackles: { left: { apex: true, unspecified: true } },
    },
  }
  const migrated = findings({ enhanced: 8, diminished: 4, silent: 1, wheezing: 12, rhonchi: 2, crackles: 4 })

  test('merges old regions with fixed conflict precedence and is idempotent', () => {
    const input = { assessed: true, value: oldRegional }
    const before = JSON.stringify(input)
    const normalized = normalizeAuscultation(input)
    expect(normalized).toEqual({ assessed: true, value: migrated })
    expect(normalizeAuscultation(normalized)).toEqual(normalized)
    expect(JSON.stringify(input)).toBe(before)
  })

  test.each(['saved', 'temporary', 'history'] as const)('round-trips migrated regional data through %s', async source => {
    const store = useDokuStore()
    const doku = { xaBcde: { auscultation: { assessed: true, value: oldRegional } } }
    const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
    if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
    if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
    if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, protocolHistory: [{ id: 'regional', archivedAt: payload.savedAt, doku: doku as never }],
    })
    await store.hydrateFromStorage()
    if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
    expect(store.doku.xaBcde.auscultation.value).toEqual(migrated)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.schemaVersion).toBe(1)
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    expect(store.doku.xaBcde.auscultation.value).toEqual(migrated)
  })

  test.each(['apex', 'middle', 'base', 'unspecified'])('maps old %s independently', region => {
    const value = normalizeAuscultation({ value: { findings: { crackles: { right: { [region]: true } } } } }).value
    expect(value).toEqual(findings({ crackles: region === 'unspecified' ? 3 : region === 'base' ? 2 : 1 }))
  })

  test.each(['saved', 'temporary', 'history'] as const)('migrates all old side values and round-trips through %s', async source => {
    for (const side of ['', 're.', 'li.', 'bds.']) {
      for (const assessed of [false, true]) {
        const store = useDokuStore()
        const old = { assessed, value: { wheezing: side, crackles: side, dimished: side } }
        const doku = { xaBcde: { auscultation: old }, xabcDe: { psychDementia: true } }
        const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
        if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
        if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
        if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
          schemaVersion: 1, protocolHistory: [{ id: 'old', archivedAt: payload.savedAt, doku: doku as never }],
        })
        await store.hydrateFromStorage()
        if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
        const restored = store.doku.xaBcde.auscultation
        expect(restored.assessed).toBe(assessed)
        expect(restored.value.normalVolume).toBe(assessed && side === '')
        expect(restored.value.noAddedSounds).toBe(assessed && side === '')
        for (const key of ['wheezing', 'crackles', 'diminished'] as const) {
          expect(restored.value.findings[key]).toEqual(fields(side === 'bds.' ? 15 : side === 're.' ? 3 : side === 'li.' ? 12 : 0))
        }
        expect(restored.value.findings.rhonchi).toEqual(emptyAuscultationLocations())
        const selection = emptyAuscultationLocations()
        selection.right.base = true
        selection.left.upper = true
        restored.value = confirmAuscultationFinding(restored.value, 'silent', selection)
        await store.persistToStorage()
        const saved = vi.mocked(saveDokuState).mock.lastCall![0]
        expect(saved.schemaVersion).toBe(1)
        vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
        await store.hydrateFromStorage()
        expect(store.doku.xaBcde.auscultation).toEqual(restored)
      }
    }
  })

  test.each([false, true])('migrates the previous global normal=%s without inventing partial assessments', normal => {
    const legacy = { normal, findings: emptyAuscultation().findings }
    expect(normalizeAuscultation({ assessed: true, value: legacy }).value).toEqual(setNormalAuscultation(normal))
    const mixed = setNormalAuscultation(false)
    mixed.normalVolume = true
    mixed.findings.wheezing.left.base = true
    expect(normalizeAuscultation({ assessed: true, value: { ...mixed, normal } }).value).toEqual(mixed)
  })

  test('missing, incomplete and new empty data never become an inferred normal finding', () => {
    for (const input of [undefined, { assessed: true }, { assessed: true, value: {} },
      { assessed: true, value: emptyAuscultation() }, { assessed: false, value: { wheezing: '', crackles: '', dimished: '' } }]) {
      expect(normalizeAuscultation(input).value.normalVolume).toBe(false)
      expect(normalizeAuscultation(input).value.noAddedSounds).toBe(false)
    }
  })
})
