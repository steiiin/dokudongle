import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { OUTPUT_SETTINGS_KEY, useOutputSettingsStore } from '@/store/output-settings'
import { loadDokuState, loadStoredValue, saveDokuState, saveStoredValue } from '@/store/persistence'
import { ProtocolCourse } from '@/types/protocol'
import { transmitDongleEvents } from '@/services/dongle-transmission'
import { previewDifferences } from '@/utils/preview-document'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  loadDokuState: vi.fn(), saveDokuState: vi.fn(), appendProtocolAuditEntry: vi.fn(),
  loadTemporaryProtocolState: vi.fn(), removeTemporaryProtocolState: vi.fn(),
  loadStoredValue: vi.fn(), saveStoredValue: vi.fn(),
}))
vi.mock('@/services/dongle-transmission', () => ({ transmitDongleEvents: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
})

const setup = () => {
  const store = useDokuStore()
  const settings = useOutputSettingsStore()
  settings.config.enabled = true
  store.doku.situation.setText('Patient orientiert.')
  store.doku.treatment.setText('Transport erfolgt.')
  return { store, settings }
}
const mark = async (store: ReturnType<typeof useDokuStore>, id: string) => {
  await store.markOutputGroupSent(id, store.outputRevision, store.doku)
}

describe('output preferences and progress', () => {
  test('persists preferences separately, restoring them before validating progress', async () => {
    const { store, settings } = setup()
    await settings.save(settings.config)
    expect(saveStoredValue).toHaveBeenCalledWith(OUTPUT_SETTINGS_KEY, settings.config)
    await mark(store, 'anamnesis')
    expect(store.sentOutputGroupIds).toEqual(['anamnesis'])
    expect(store.lastProtocolSentAt).toBeNull()
    expect(store.getAutoProtocolResetAction()).toBe('none')
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    const config = JSON.parse(JSON.stringify(settings.config))
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    vi.mocked(loadStoredValue).mockResolvedValue(config)
    setActivePinia(createPinia())
    await useOutputSettingsStore().hydrate()
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.sentOutputGroupIds).toEqual(['anamnesis'])
    expect(restored.getAutoProtocolResetAction()).toBe('none')
    expect(restored.getAutoProtocolResetAction(Date.now() + 61 * 60_000)).toBe('reset')
  })

  test('completes only after every nonempty group succeeds, ignoring empty groups', async () => {
    const { store, settings } = setup()
    settings.config.groups.push({ id: 'empty', name: 'EMPTY', blocks: [] })
    const groups = store.outputGroups.filter(group => group.text)
    for (const [index, group] of groups.entries()) {
      await mark(store, group.id)
      expect(store.wasCurrentProtocolSent()).toBe(index === groups.length - 1)
    }
    expect(store.getAutoProtocolResetAction()).toBe('reset')
    await mark(store, groups[0].id)
    expect(store.sentOutputGroupIds).toHaveLength(groups.length)
  })

  test.each(['text', 'form', 'grouping', 'enabled', 'ownership'] as const)('clears progress and completion on %s changes, even when reverted', async kind => {
    const { store, settings } = setup()
    for (const group of store.outputGroups.filter(group => group.text)) await mark(store, group.id)
    const oldText = store.effectiveProtocolText
    if (kind === 'text') { store.editPreview(oldText + ' Added'); store.editPreview(oldText) }
    if (kind === 'form') { store.doku.situation.setText('Updated'); store.doku.situation.setText('Patient orientiert.') }
    if (kind === 'grouping') settings.config.groups.reverse()
    if (kind === 'enabled') settings.config.enabled = false
    if (kind === 'ownership') store.doku.course = ProtocolCourse.NEF_VOR_ORT
    expect(store.sentOutputGroupIds).toEqual([])
    expect(store.outputProgress).toBeNull()
    expect(store.lastProtocolSentAt).toBeNull()
  })

  test('new and restored protocols clear marks but preserve configuration', async () => {
    const { store, settings } = setup()
    await mark(store, 'anamnesis')
    await store.newProtocol()
    expect(store.outputProgress).toBeNull()
    expect(settings.config.enabled).toBe(true)
    const id = store.protocolHistory[0].id
    await mark(store, 'anamnesis')
    await store.restoreProtocolFromHistory(id)
    expect(store.outputProgress).toBeNull()
    expect(settings.config.enabled).toBe(true)
  })

  test('rejects stale revisions, another protocol identity and empty group acknowledgements', async () => {
    const { store } = setup()
    const revision = store.outputRevision
    store.editPreview('Changed')
    await store.markOutputGroupSent('anamnesis', revision, store.doku)
    await store.markOutputGroupSent('anamnesis', store.outputRevision, { ...store.doku })
    await mark(store, 'missing')
    expect(store.outputProgress).toBeNull()
    expect(saveDokuState).not.toHaveBeenCalled()
  })

  test('storage failure leaves marks unchanged and preferences retain their previous value', async () => {
    const { store, settings } = setup()
    vi.mocked(saveDokuState).mockRejectedValueOnce(new Error('disk'))
    await expect(mark(store, 'anamnesis')).rejects.toThrow('disk')
    expect(store.sentOutputGroupIds).toEqual([])
    vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('disk'))
    await expect(settings.save({ ...settings.config, enabled: false })).rejects.toThrow('disk')
    expect(settings.config.enabled).toBe(true)
    expect(settings.saving).toBe(false)
  })

  test('preview conflict choices are reflected in the transmitted block', () => {
    const { store } = setup()
    store.editPreview(store.generatedProtocol.replace('orientiert', 'müde'))
    store.doku.situation.setText('Patient teilweise orientiert.')
    expect(store.outputGroups[0].text).toContain('Patient teilweise orientiert.')
    const conflict = previewDifferences(store.previewDocument).find(difference => difference.kind === 'conflict')!
    store.resolvePreviewDifference(conflict.id, 'user')
    expect(store.outputGroups[0].text).toContain('Patient müde.')
    expect(store.outputGroups[0].text).not.toContain('teilweise orientiert')
  })

  test('legacy records start disabled without progress; malformed progress is ignored', async () => {
    const store = useDokuStore()
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValue({ ...saved, outputProgress: { revision: 'stale', sentGroupIds: ['anamnesis'] } })
    await store.hydrateFromStorage()
    expect(store.sentOutputGroupIds).toEqual([])
    expect(store.separatedOutputEnabled).toBe(false)
  })
})

describe('group transmission completion', () => {
  const connected = () => {
    const { store } = setup()
    store.connection.isConnected = true
    store.connection.device = { id: 'dongle', name: 'Dongle' }
    vi.spyOn(store, 'checkConnection').mockResolvedValue(undefined)
    return store
  }

  test('records success before unlocking transmission, without marking a partial protocol complete', async () => {
    const store = connected()
    const group = store.outputGroups[0]
    let release!: () => void
    vi.mocked(saveDokuState).mockReturnValueOnce(new Promise(resolve => { release = resolve }))
    const sending = store.sendProtocol(group.text, { markComplete: false, groupId: group.id, revision: store.outputRevision })
    await vi.waitFor(() => expect(saveDokuState).toHaveBeenCalled())
    expect(store.connection.isTransmitting).toBe(true)
    expect(store.sentOutputGroupIds).toEqual([])
    release()
    expect(await sending).toBe(true)
    expect(store.sentOutputGroupIds).toEqual([group.id])
    expect(store.lastProtocolSentAt).toBeNull()
    expect(store.connection.isTransmitting).toBe(false)
  })

  test.each(['failure', 'cancel'] as const)('%s never creates a success mark', async kind => {
    const store = connected()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(transmitDongleEvents).mockImplementationOnce(async () => {
      if (kind === 'cancel') await store.cancelSend()
      else throw new Error('BLE failed')
    })
    const group = store.outputGroups[0]
    expect(await store.sendProtocol(group.text, { markComplete: false, groupId: group.id, revision: store.outputRevision })).toBe(false)
    expect(store.sentOutputGroupIds).toEqual([])
    expect(store.lastProtocolSentAt).toBeNull()
    vi.restoreAllMocks()
  })
})
