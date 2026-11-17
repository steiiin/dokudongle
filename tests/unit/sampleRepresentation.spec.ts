import { describe, expect, test } from 'vitest'
import { SampleRepresentation, representativeRoles, representativeInvolvements } from '@/types/protocol/sample/sampleRepresentation'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'

describe('representation and protocol text', () => {
  describe.each([
    ['Sorgeberechtigt', 'Sorgeberechtigter'],
    ['Rechtl. Betreuer', 'Rechtl. Betreuer'],
    ['Bevollmächtigter', 'Bevollmächtigter'],
    ['Sonstige', 'Sonstige Vertretung'],
  ] as const)('standalone sentences for %s', (role, roleText) => {
    test.each([
      ['Anwesend', 'anwesend'],
      ['Telefonisch', 'tel. informiert'],
      ['Nicht Erreicht', 'nicht erreicht'],
      ['Nicht Kontaktiert', 'nicht kontaktiert'],
    ] as const)('formats %s with optional names', (involvement, involvementText) => {
      const value = new SampleRepresentation()
      value.representative = { role, name: '  Hr. Müller  ', involvement }
      expect(value.generateText()).toBe(`${roleText} (Hr. Müller) ${involvementText}.`)
      expect(value.representativeSummary).toBe(`${role} · Hr. Müller · ${involvement}`)
      for (const name of ['', '   ']) {
        value.representative.name = name
        expect(value.generateText()).toBe(`${roleText} ${involvementText}.`)
      }
    })
  })

  test('keeps the directive in its own sentence without a heading', () => {
    const value = new SampleRepresentation()
    value.representative = { role: 'Sorgeberechtigt', name: 'Mama', involvement: 'Nicht Erreicht' }
    value.setDirectiveStatus('Keine')
    expect(value.generateText()).toBe('Sorgeberechtigter (Mama) nicht erreicht.\nKeine Patientenverfügung.')
    value.setDirectiveStatus('Vorhanden')
    value.setRestrictions(['Keine Einschränkungen'])
    expect(value.generateText()).toBe('Sorgeberechtigter (Mama) nicht erreicht.\nPatientenverfügung vorhanden, keine Therapiebeschränkungen.')
    value.representative.role = ''
    expect(value.generateText()).toBe('Patientenverfügung vorhanden, keine Therapiebeschränkungen.')
  })

  test('formats other restrictions with optional free text and preserves its capitalization', () => {
    const value = new SampleRepresentation()
    value.setDirectiveStatus('Vorhanden')
    value.setRestrictions(['Andere'])
    for (const text of ['', '   ']) {
      value.advanceDirective.otherRestriction = text
      expect(value.generateText()).toBe('Patientenverfügung vorhanden, andere.')
    }
    value.advanceDirective.otherRestriction = '  Keine Dialyse  '
    expect(value.generateText()).toBe('Patientenverfügung vorhanden, andere: Keine Dialyse.')
    expect(value.advanceDirective.otherRestriction).toBe('  Keine Dialyse  ')
  })

  test('omits defaults and power of attorney and reports explicit directive choices', () => {
    const value = new SampleRepresentation()
    expect(value.representativeSummary).toBe('Nein')
    expect(value.generateText()).toBe('')
    value.setDirectiveStatus('Keine')
    expect(value.generateText()).toBe('Keine Patientenverfügung.')
    value.setDirectiveStatus('Vorhanden')
    expect(value.generateText()).toBe('Patientenverfügung vorhanden.')
    value.setDirectiveStatus('Keine Angabe')
    expect(value.generateText()).toBe('')
    value.setRepresentativeRole('Bevollmächtigter')
    expect(value.generateText()).toBe('Bevollmächtigter anwesend.')
    expect(value.generateText()).not.toContain('Vorsorgevollmacht')
  })

  test('preserves details between roles and clears them when selecting Nein', () => {
    const value = new SampleRepresentation()
    value.representative = { role: 'Sorgeberechtigt', name: 'Alex', involvement: 'Telefonisch' }
    value.setRepresentativeRole('Bevollmächtigter')
    expect(value.representative).toEqual({ role: 'Bevollmächtigter', name: 'Alex', involvement: 'Telefonisch' })
    value.setRepresentativeRole('')
    expect(value.representative).toEqual({ role: '', name: '', involvement: 'Anwesend' })
    expect(value.generateText()).toBe('')
    expect(value.explanationContext).toEqual({ addressee: '', contactStatus: '' })
  })

  test('removes conflicting restrictions while retaining other details and clears hidden data', () => {
    const value = new SampleRepresentation()
    value.setDirectiveStatus('Vorhanden')
    value.setRestrictions(['Keine Reanimation', 'Keine Beatmung', 'Keine Klinikeinweisung', 'Andere'])
    value.advanceDirective.otherRestriction = 'Keine Dialyse'
    expect(value.generateText()).toBe('Patientenverfügung vorhanden, keine Reanimation; keine Beatmung; keine Klinikeinweisung; andere: Keine Dialyse.')
    value.setRestrictions([...value.advanceDirective.restrictions, 'Keine Einschränkungen'])
    expect(value.advanceDirective.restrictions).toEqual(['Keine Einschränkungen', 'Andere'])
    expect(value.generateText()).toBe('Patientenverfügung vorhanden, keine Therapiebeschränkungen; andere: Keine Dialyse.')
    expect(value.generateText()).not.toContain('keine Reanimation')
    value.setRestrictions(['Andere'])
    expect(value.advanceDirective.restrictions).toEqual(['Andere'])
    value.setRestrictions([])
    expect(value.advanceDirective.otherRestriction).toBe('')
    value.setRestrictions(['Andere'])
    value.advanceDirective.otherRestriction = 'Keine Dialyse'
    value.setDirectiveStatus('Keine Angabe')
    expect(value.advanceDirective.restrictions).toEqual([])
    expect(value.advanceDirective.otherRestriction).toBe('')
    value.setDirectiveStatus('Vorhanden')
    expect(value.generateText()).not.toContain('Therapiebeschränkung')
  })

  describe.each(['BvO', 'Verweigerung'] as const)('explanation mode %s', mode => {
    test.each(representativeRoles.flatMap(role => representativeInvolvements.map(involvement => [role, involvement] as const)))(
      'uses %s with participation %s without assigning the patient decision to the representative', (role, involvement) => {
        const value = new SampleRepresentation()
        value.representative = { role, name: '  Alex Muster  ', involvement }
        const flags = new TreatmentRedflags()
        flags.noTransportType = mode
        const text = flags.getRedflagBlock(value.explanationContext)
        const reached = involvement === 'Anwesend' || involvement === 'Telefonisch'
        if (role === 'Sonstige') {
          expect(text).not.toContain('Alex Muster')
        } else if (reached) {
          expect(text).toContain(`gegenüber Alex Muster (${role}), ${involvement.toLowerCase()}`)
        } else {
          expect(text).toContain(`Vertreter Alex Muster (${role}) ${involvement.toLowerCase()}.`)
          expect(text).not.toContain('gegenüber')
        }
        expect(text).toContain(mode === 'BvO' ? (reached && role !== 'Sonstige' ? 'Pat. entscheidungsfähig' : 'Pat. aufgeklärt') : 'Pat. einsichtsfähig')
        expect(text).not.toContain('Alex Muster eingewilligt')
      },
    )
  })

  test('does not use unnamed representatives or an empty role as an addressee', () => {
    const value = new SampleRepresentation()
    value.representative = { role: 'Bevollmächtigter', name: ' ', involvement: 'Telefonisch' }
    expect(value.explanationContext.addressee).toBe('')
    value.representative.name = 'Alex'
    value.representative.role = ''
    expect(value.explanationContext.addressee).toBe('')
    expect(value.generateText()).toBe('')
  })
})
