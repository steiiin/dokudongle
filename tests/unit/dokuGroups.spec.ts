import { computed, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ProtocolCourse, resetProtocol } from '@/types/protocol'
import { editedDokuGroups, visibleDokuGroups } from '@/utils/doku-groups'
import { useDokuStore } from '@/store/doku'
import { loadDokuState } from '@/store/persistence'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

const unchanged = { einsatz: false, abcde: false, sampler: false, aufgaben: false }

describe('documentation group state', () => {
  beforeEach(() => setActivePinia(createPinia()))

  test('compares each group with fresh defaults and reacts to nested edits and reversions', () => {
    const protocol = reactive(resetProtocol())
    const edited = computed(() => editedDokuGroups(protocol))
    expect(edited.value).toEqual(unchanged)
    protocol.ident.age.timespan = 65
    expect(edited.value).toEqual({ ...unchanged, einsatz: true })
    protocol.ident.age.timespan = 50
    protocol.xAbcde.obstruction = 'blocked'
    expect(edited.value).toEqual({ ...unchanged, abcde: true })
    protocol.xAbcde = resetProtocol().xAbcde
    protocol.sampler.symptoms.additionalSymptoms.setText('Symptoms')
    expect(edited.value).toEqual({ ...unchanged, sampler: true })
    protocol.sampler.symptoms.additionalSymptoms.undo()
    protocol.treatment.setText('Treatment')
    expect(edited.value).toEqual({ ...unchanged, aufgaben: true })
    protocol.treatment.undo()
    expect(edited.value).toEqual(unchanged)
  })

  test('ignores focus, undo history, and enhancement activity', () => {
    const protocol = resetProtocol()
    protocol.situation.beginEdit()
    protocol.situation.isEnhancing = true
    protocol.treatment.setText('Temporary')
    protocol.treatment.undo()
    expect(editedDokuGroups(protocol)).toEqual(unchanged)
  })

  test('assigns structured details to their editors and activation to the destination', () => {
    const protocol = resetProtocol()
    protocol.textAreaBlocks.verlegung.values.START = 'Hospital'
    expect(editedDokuGroups(protocol)).toEqual({ ...unchanged, einsatz: true })
    protocol.textAreaBlocks = resetProtocol().textAreaBlocks
    protocol.textAreaBlocks.intoxikation.details.otherName = 'Substance'
    expect(editedDokuGroups(protocol)).toEqual({ ...unchanged, abcde: true })
    protocol.textAreaBlocks.intoxikation.active['intoxikation.pler'] = false
    expect(editedDokuGroups(protocol)).toEqual({ ...unchanged, abcde: true, sampler: true })
    protocol.textAreaBlocks = resetProtocol().textAreaBlocks
    protocol.textAreaBlocks.schwindel.values.BEGINN = 'Plötzlich'
    expect(editedDokuGroups(protocol)).toEqual({ ...unchanged, sampler: true })
  })

  test('counts explicit assessment, medication actions, and retained hidden values', () => {
    const protocol = resetProtocol()
    protocol.xabcDe.assessment.headache = 'inactive'
    expect(editedDokuGroups(protocol).abcde).toBe(true)
    protocol.saatreats.selectedIds.push('action')
    expect(editedDokuGroups(protocol).aufgaben).toBe(true)
    protocol.course = ProtocolCourse.NEF_VOR_ORT
    expect(editedDokuGroups(protocol)).toEqual({ ...unchanged, einsatz: true, abcde: true, aufgaben: true })
  })

  test('restores edit indicators from saved values and clears them on a new protocol', async () => {
    const saved = resetProtocol()
    saved.situation.setText('Saved situation')
    saved.sampler.pler.PLER.setText('Saved history')
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: saved })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(editedDokuGroups(store.doku)).toEqual({ ...unchanged, einsatz: true, sampler: true })
    await store.newProtocol()
    expect(editedDokuGroups(store.doku)).toEqual(unchanged)
  })

  test('uses only visible groups in document order', () => {
    expect(visibleDokuGroups(ProtocolCourse.TRANSPORT, { requireABCDE: false, requireSampler: true }).map(g => g.id))
      .toEqual(['einsatz', 'sampler', 'aufgaben'])
    expect(visibleDokuGroups(ProtocolCourse.TRANSPORT, { requireABCDE: false, requireSampler: false }).map(g => g.id))
      .toEqual(['einsatz', 'aufgaben'])
    expect(visibleDokuGroups(ProtocolCourse.NEF_VOR_ORT, { requireABCDE: true, requireSampler: true }).map(g => g.id))
      .toEqual(['einsatz'])
  })
})
