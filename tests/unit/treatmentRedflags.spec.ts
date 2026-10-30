import { describe, expect, test } from 'vitest'
import { DATA_Signals } from '@/data/redflags'
import { TreatmentRedflags, type LegacyRedflagScenario } from '@/types/protocol/treatment/treatmentRedflags'

const legacy: LegacyRedflagScenario = {
  id: 'old-scenario', name: 'Stored name', requirements: 'Stored requirement', application: 'Verweigerung', category: 'neuro',
  majorSignals: ['Removed', 'First', 'Shared'], minorSignals: ['Minor'],
  diagnoses: ['First diagnosis', 'Shared diagnosis'], consequences: 'Stored risk',
}

describe('RedFlags text generation', () => {
  test('retains exact historical output, exclusions, duplicates and interleaving for old records', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'Verweigerung'
    value.choosenScenarios = [legacy, { ...legacy, id: 'old-second', majorSignals: ['Second', 'Shared'],
      diagnoses: ['Second diagnosis'], consequences: 'Other risk' }]
    value.choosenSignals = [{ id: 'old-signal', text: 'Shared' }]
    value.removedMajorSignals = ['Removed']
    expect(value.getRedflagBlock()).toBe(
      'Aufklärung bzgl. First diagnosis; Second diagnosis; Shared diagnosis. \n'
      + 'Bei Second, First, Shared oder Shared erneut Notruf/Vorstellung NFA. \n'
      + 'Bei Minor Rücksprache Haus-/Facharzt. \n'
      + 'Transport nicht gewünscht. Auch nach Verdeutlichung mgl. Konsequenzen, wie Stored risk oder Other risk, weiterhin Transport/Behandlung verweigert. \n'
      + 'Pat. einsichtsfähig (versteht Bedeutung/Tragweite/Risiken) & steuerungsfähig (kann eigenes Urteil bilden/umsetzen). \nEntscheidung eigenverantwortlich getroffen.',
    )
  })

  test('uses selected children, leaves requirements out of the text and shares visible signals', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'BvO'
    value.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['synkope-bvo-orthostatisch'] }]
    let text = value.getRedflagBlock()
    expect(text).toContain('Aufklärung bzgl. orthostatische Synkope.')
    expect(text).not.toContain('vasovagale Ursache')
    expect(text).not.toContain('kurzzeitiger Bewusstseinsverlust')
    const content = value.getResolvedContent()
    for (const signal of [...content.majorSignals, ...content.minorSignals]) expect(text).toContain(signal.text)
    value.disableMinorBlock = true
    text = value.getRedflagBlock()
    for (const signal of content.minorSignals) expect(text).not.toContain(signal.text)
    expect(text).not.toContain('Rücksprache Haus-/Facharzt')
    value.noTransportType = ''
    expect(value.getRedflagBlock()).toBe('')
  })

  test('deduplicates inherited/custom warnings, gives major priority and removes every contribution', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'BvO'
    value.scenarioSelections = [
      { scenarioId: 'synkope-bvo', subscenarioIds: [] },
      { scenarioId: 'synkope-verweigerung', subscenarioIds: [] },
    ]
    const signal = DATA_Signals.find(entry => entry.id === 'kreislauf-belastungsSchwaeche-anhaltend')!
    value.choosenSignals = [signal, signal]
    value.choosenScenarios = [{ ...legacy, majorSignals: [signal.text], minorSignals: [signal.text] }]
    const content = value.getResolvedContent()
    expect(content.majorSignals.filter(entry => entry.id === signal.id)).toHaveLength(1)
    expect(content.minorSignals.some(entry => entry.id === signal.id)).toBe(false)
    value.removeVisibleSignal(content.majorSignals.find(entry => entry.id === signal.id)!)
    expect(value.choosenSignals).toEqual([])
    expect(value.removedMajorSignalIds).toContain(signal.id)
    expect(value.removedMinorSignalIds).toContain(signal.id)
    expect(value.getRedflagBlock()).not.toContain(signal.text)
    value.scenarioSelections = []
    expect(value.getRedflagBlock()).not.toContain(signal.text)
  })

  test('interleaves multiple scenarios and flattens consequences without blank fragments', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'Verweigerung'
    value.choosenScenarios = [{ ...legacy, consequences: '' }]
    value.scenarioSelections = [{ scenarioId: 'synkope-verweigerung', subscenarioIds: [] }]
    expect(value.getResolvedContent().diagnoses.slice(0, 4)).toEqual(['First diagnosis', 'Arrhythmie', 'Shared diagnosis', 'vasovagal./orthost. Ursache'])
    expect(value.getResolvedContent().consequences).toHaveLength(1)
    expect(value.getRedflagBlock()).not.toContain('wie ,')
    value.choosenScenarios = []
    value.scenarioSelections = [{ scenarioId: 'abdominaltrauma-innere-verletzung-verweigerung', subscenarioIds: [] }]
    expect(value.getResolvedContent().majorSignals).toEqual([])
    expect(value.getRedflagBlock()).toContain('Konsequenzen (bleibende Schäden/Tod)')
    expect(value.getRedflagBlock()).not.toContain('Aufklärung bzgl.')
  })

  test('keeps invalid selections and marks them without silently aggregating children', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'BvO'
    value.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['unknown-child'] }]
    const original = JSON.stringify(value.scenarioSelections)
    expect(value.getResolvedContent().majorSignals).toEqual([])
    expect(value.getRedflagBlock()).toContain('[RedFlags-Auswahl prüfen: Unbekanntes Unterszenario: unknown-child]')
    expect(value.getRedflagBlock()).not.toContain('orthostatische Synkope')
    expect(JSON.stringify(value.scenarioSelections)).toBe(original)
  })
})
