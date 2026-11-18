import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState, type ProtocolHistoryEntry } from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import { SampleRepresentation } from '@/types/protocol/sample/sampleRepresentation'
import { SampleContactsItem } from '@/types/protocol/sample/sampleContacts'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(), loadDokuState: vi.fn(), loadProtocolAuditEntries: vi.fn(),
  loadTemporaryProtocolState: vi.fn(), removeTemporaryProtocolState: vi.fn(), saveDokuState: vi.fn(),
}))
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  vi.mocked(loadDokuState).mockResolvedValue(null)
  vi.mocked(loadTemporaryProtocolState).mockResolvedValue(null)
})

function filledProtocol() {
  const protocol = resetProtocol()
  const value = protocol.sampler.representation
  value.representative = { role: 'Gesetzl. Betreuer', name: 'Alex Muster', involvement: 'Telefonisch' }
  value.setDirectiveStatus('Vorhanden')
  value.setRestrictions(['Keine Reanimation', 'Andere'])
  value.advanceDirective.otherRestriction = 'Keine Dialyse'
  protocol.redflags.noTransportType = 'BvO'
  protocol.sampler.contacts.contacts.push(new SampleContactsItem({ contactName: 'Kontakt Muster', telephone: '0123456' }))
  return protocol
}

describe('representation store integration', () => {
  test.each([
    ['Rechtl. Betreuer', 'Gesetzl. Betreuer', 'Nicht Kontaktiert'],
    ['Bevollmächtigter', 'Bevollmächtigter', 'Anwesend'],
    ['Sonstige', 'Sonstige', 'Anwesend'],
  ])('migrates %s in current, historical and temporary protocols', async (oldRole, role, involvement) => {
    for (const wrapped of [false, true]) {
      setActivePinia(createPinia())
      const protocol = copy(filledProtocol())
      const representative = { role: oldRole, name: 'Alex Muster', involvement: 'Nicht Kontaktiert' }
      Object.assign(protocol.sampler.representation, {
        representative: wrapped ? { assessed: true, value: representative } : representative,
      })
      vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: protocol,
        protocolHistory: [{ id: 'legacy', archivedAt: '2026-11-15T10:00:00.000Z', doku: copy(protocol) }] })
      vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce({ schemaVersion: 1, savedAt: '2026-11-15T11:00:00.000Z', doku: copy(protocol) })
      const store = useDokuStore()
      await store.hydrateFromStorage()
      expect(store.protocolHistory).toHaveLength(2)
      for (const restored of [store.doku, ...store.protocolHistory.map(entry => entry.doku)]) {
        const value = restored.sampler.representation
        expect(value.representative).toEqual({ role, name: 'Alex Muster', involvement })
        expect(value.generateText()).not.toContain('Rechtl. Betreuer')
        expect(value.representativeSummary).toBe(`${role} · Alex Muster · ${involvement}`)
        expect(value.explanationContext.contactStatus).toBe(role === 'Gesetzl. Betreuer'
          ? 'Vertreter Alex Muster (Gesetzl. Betreuer) nicht kontaktiert.' : '')
      }
      await store.persistToStorage()
      expect(copy(vi.mocked(saveDokuState).mock.lastCall![0]).doku.sampler.representation.representative)
        .toEqual({ role, name: 'Alex Muster', involvement })
    }
  })

  test('round-trips active, historical and temporary protocols with class methods and resets new protocols', async () => {
    const protocol = filledProtocol()
    const expected = protocol.sampler.representation.generateText()
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: copy(protocol),
      protocolHistory: [{ id: 'history', archivedAt: '2026-11-15T10:00:00.000Z', doku: copy(protocol) }] })
    vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce({ schemaVersion: 1, savedAt: '2026-11-15T11:00:00.000Z', doku: copy(protocol) })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toHaveLength(2)
    for (const restored of [store.doku, ...store.protocolHistory.map(entry => entry.doku)]) {
      expect(restored.sampler.representation).toBeInstanceOf(SampleRepresentation)
      expect(restored.sampler.representation.generateText()).toBe(expected)
    }
    expect(store.generatedProtocol).toContain(expected)
    expect(store.generatedProtocol).toContain('Kontakt Muster')
    expect(store.generatedProtocol.indexOf('Kontakt Muster')).toBeLessThan(store.generatedProtocol.indexOf(expected))
    expect(store.generatedProtocol).toContain('gegenüber Alex Muster (Gesetzl. Betreuer), telefonisch')
    await store.persistToStorage()
    const saved = copy(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    const restarted = useDokuStore()
    await restarted.hydrateFromStorage()
    expect(restarted.doku.sampler.representation.generateText()).toBe(expected)
    await restarted.newProtocol()
    expect(restarted.doku.sampler.representation).toEqual(new SampleRepresentation())
    expect(restarted.generatedProtocol).not.toContain('Hat Gesetzl. Betreuer (Alex Muster); tel. informiert.')
    expect(await restarted.restoreProtocolFromHistory('history')).toBe(true)
    expect(restarted.doku.sampler.representation.generateText()).toBe(expected)
  })

  test('supplies empty defaults for older protocols and migrates only active named attendants', async () => {
    for (const attendant of [undefined, { active: false, value: 'Altname' }, { active: true, value: '' }, { active: true, value: 'Altname' }]) {
      setActivePinia(createPinia())
      const protocol = copy(resetProtocol())
      delete (protocol.sampler as Partial<typeof protocol.sampler>).representation
      Object.assign(protocol.redflags, { attendant })
      vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: protocol })
      const store = useDokuStore()
      await store.hydrateFromStorage()
      const value = store.doku.sampler.representation
      if (attendant?.active && attendant.value) {
        expect(value.representative).toEqual({ role: 'Sonstige', name: 'Altname (Vormund/Betreuer – Altangabe)', involvement: 'Anwesend' })
        expect(value.generateText()).toContain('Altname')
        expect(value.explanationContext.addressee).toBe('')
      } else {
        expect(value).toEqual(new SampleRepresentation())
      }
      expect(store.doku.redflags).not.toHaveProperty('attendant')
    }
  })

  test('does not overwrite new representation data with a legacy attendant', async () => {
    const protocol = filledProtocol()
    Object.assign(protocol.redflags, { attendant: { active: true, value: 'Altname' } })
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: copy(protocol) })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.sampler.representation.representative.name).toBe('Alex Muster')
  })

  test.each([true, false])('migrates wrapped entries with assessed=%s in current, historical and temporary protocols', async assessed => {
    const protocol = copy(filledProtocol())
    const legacy = {
      ...protocol,
      sampler: {
        ...protocol.sampler,
        representation: {
          expanded: true,
          representative: { assessed, value: { role: 'Bevollmächtigter', name: 'Tochter', involvement: '' } },
          advanceDirective: { assessed, value: protocol.sampler.representation.advanceDirective },
          powerOfAttorney: { assessed: true, value: false },
        },
      },
    }
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: legacy,
      protocolHistory: [{ id: 'legacy', archivedAt: '2026-11-15T10:00:00.000Z', doku: legacy as unknown as ProtocolHistoryEntry['doku'] }] })
    vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce({ schemaVersion: 1, savedAt: '2026-11-15T11:00:00.000Z', doku: legacy })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toHaveLength(2)
    for (const restored of [store.doku, ...store.protocolHistory.map(entry => entry.doku)]) {
      const value = restored.sampler.representation
      expect(value).toBeInstanceOf(SampleRepresentation)
      expect(value).not.toHaveProperty('expanded')
      expect(value).not.toHaveProperty('powerOfAttorney')
      expect(value.representative).not.toHaveProperty('assessed')
      expect(value.generateText()).not.toContain('Vorsorgevollmacht')
      if (assessed) {
        expect(value.representative).toEqual({ role: 'Bevollmächtigter', name: 'Tochter', involvement: 'Anwesend' })
        expect(value.advanceDirective).toEqual(protocol.sampler.representation.advanceDirective)
        expect(value.generateText()).toContain('andere: Keine Dialyse')
      } else {
        expect(value).toEqual(new SampleRepresentation())
        expect(value.generateText()).toBe('')
      }
    }
  })

  test('preserves existing SAMPLE and explanation visibility rules', () => {
    const store = useDokuStore()
    store.doku = filledProtocol()
    store.setFlavor('verlegung', true)
    expect(store.generatedProtocol).not.toContain('Hat Gesetzl. Betreuer (Alex Muster); tel. informiert.')
    expect(store.generatedProtocol).not.toContain('Alex Muster')
    store.setFlavor('verlegung', false)
    expect(store.generatedProtocol).toContain('Hat Gesetzl. Betreuer (Alex Muster); tel. informiert.')
    store.doku.redflags.noTransportType = ''
    expect(store.generatedProtocol).not.toContain('gegenüber Alex Muster')
    expect(store.generatedProtocol).toContain('Hat Gesetzl. Betreuer (Alex Muster); tel. informiert.')
  })
})
