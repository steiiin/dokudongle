import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, test } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { ProtocolCourse } from '@/types/protocol'


describe('legacy protocol text compatibility', () => {
  test.each(['normal', 'trauma', 'no_emergency_call', 'verlegung', 'einweisung', 'nef'] as const)('%s output', mode => {
    setActivePinia(createPinia())
    const store = useDokuStore()
    store.doku.setting.location = 'Wohnung'
    store.doku.setting.mobility = 'gehfähig'
    store.doku.redflags.consent = 'Fähig'
    store.doku.situation.setText('Patient sitzend angetroffen. Beschwerden seit gestern.')
    store.doku.treatment.setText('Transport ohne Besonderheiten. Übergabe in der Notaufnahme.')
    store.doku.sampler.pler.PLER.setText('Letzte Mahlzeit vor zwei Stunden.')
    if (mode === 'nef') store.doku.course = ProtocolCourse.NEF_VOR_ORT
    else if (mode !== 'normal') store.doku.flavors[mode] = true
    if (mode === 'trauma') store.doku.sampler.symptoms.trauma.injuries = ['Prellung Arm', 'Schürfwunde Bein']
    expect(store.generatedProtocol).toMatchSnapshot()
    const fragments = store.generatedOutput.spans.map(span => store.generatedProtocol.slice(span.start, span.end))
    expect(fragments.join('')).toBe(store.generatedProtocol)
    if (mode === 'nef') {
      expect(store.generatedOutput.spans.map(span => span.block)).toEqual(['situation'])
      expect(store.outputGroups[0].text).toBe(store.generatedProtocol)
    }
  })
})
