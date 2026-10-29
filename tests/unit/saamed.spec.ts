import { afterEach, describe, expect, test } from 'vitest'
import { DATA_SaamedMeta, DATA_SaamedOptions } from '@/data/lists/saamed'
import { ConsentMed, ConsentMedTask, SaamedIndication } from '@/types/lists/saamed'
import { TreatmentSaamed } from '@/types/protocol/treatment/treatmentSaamed'

describe('SAAMED compatibility', () => {
  const originalAdrenalin = DATA_SaamedMeta.adrenalin
  afterEach(() => { DATA_SaamedMeta.adrenalin = originalAdrenalin })

  test('renders no block without medication entries', () => {
    expect(new TreatmentSaamed().getBlock()).toBe('')
  })

  test.each([
    ['250mg iv', '', 'SAA ASS (ACS); 250mg iv;'],
    ['', '', 'SAA ASS (ACS);'],
    ['250mg iv', 'notiz', 'SAA ASS (ACS); 250mg iv, Notiz;'],
    ['', 'notiz', 'SAA ASS (ACS); Notiz;'],
  ])('renders a single entry with dose %j and note %j inline', (dose, note, line) => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('ass', 'acs', dose, true, '', note)]
    expect(treatment.getBlock()).toBe([
      line,
      'keine Unverträglichkeit; kein Hinweis auf relevante KI:',
    ].join('\n'))
  })

  test('renders single entries inline in indication order', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [
      new ConsentMedTask('furosemid', 'lungenödem', '40mg iv', true, '', ''),
      new ConsentMedTask('ass', 'acs', '250mg iv', true, '', ''),
    ]
    expect(treatment.getBlock()).toBe([
      'SAA Furosemid (Lungenödem); 40mg iv;',
      'SAA ASS (ACS); 250mg iv;',
      'keine Unverträglichkeit; kein Hinweis auf relevante KI:',
    ].join('\n'))
  })

  test('preserves cave, note and consent text for a single entry', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('dimenhydrinat', 'erbrechen', 'dokumentierte Dosis', false, 'begründung', 'notiz')]
    expect(treatment.getBlock()).toBe([
      'SAA Dimenhydrinat (Anhaltendes Erbrechen); cave: Begründung; dokumentierte Dosis, Notiz;',
      'Aufkl.: kein Fahrzeug führen/Sturzrisiko bis 24h;',
      'sonst keine Hinweise auf relevante KI oder Unverträglichkeit:',
    ].join('\n'))
  })

  test('keeps separate dose output for repeated entries of the same medication and indication', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [
      new ConsentMedTask('adrenalin', 'rea', 'erste Dosis', true, '', ''),
      new ConsentMedTask('adrenalin', 'rea', 'zweite Dosis', true, '', 'notiz'),
    ]
    expect(treatment.getBlock()).toBe([
      'SAA Adrenalin (Reanimation);',
      'Adrenalin erste Dosis (Reanimation); Adrenalin zweite Dosis (Reanimation), Notiz;',
    ].join('\n'))
  })

  test.each([
    ['ass', 'acs', 'ACS'],
    ['dimenhydrinat', 'erbrechen', 'Anhaltendes Erbrechen'],
    ['glucose', 'hypoglykämie', 'Hypoglykämie'],
    ['furosemid', 'lungenödem', 'Lungenödem'],
  ])('resolves the stored IDs for %s / %s', (medId, indicationId, name) => {
    const option = DATA_SaamedOptions().find(option => (
      option.med.id === medId && option.indicationId === indicationId
    ))
    expect(option?.indication.name).toBe(name)
  })

  test('preserves indication order for medication selection', () => {
    const options = DATA_SaamedOptions().filter(option => option.med.id === 'adrenalin')
    expect(options.map(option => option.indicationId)).toEqual([
      'rea', 'bradykardie', 'anaphylaxie', 'pseudokrupp', 'obstruktion',
    ])
  })

  test('preserves all medication IDs and their ordered indication assignments', () => {
    expect(Object.values(DATA_SaamedMeta).map(med => [med.id, Object.keys(med.Indications)])).toEqual([
      ['adrenalin', ['rea', 'bradykardie', 'anaphylaxie', 'pseudokrupp', 'obstruktion']],
      ['amiodaron', ['rea']],
      ['ass', ['acs']],
      ['atropin', ['bradykardie']],
      ['butylscopolamin', ['schmerzen']],
      ['dimenhydrinat', ['erbrechen']],
      ['dimetinden', ['anaphylaxie']],
      ['esketamin', ['schmerzen']],
      ['fentanyl', ['schmerzen']],
      ['furosemid', ['lungenödem']],
      ['glucagon', ['hypoglykämie']],
      ['glucose', ['hypoglykämie']],
      ['glyceroltrinitrat', ['lungenödem', 'hypertensivernotfall', 'acs']],
      ['heparin', ['acs', 'lungenembolie', 'arteriellerverschluss']],
      ['ibuprofen', ['fieberkrampf', 'schmerzen']],
      ['ipratropium', ['asthmaanfall', 'exazerbiertecopd', 'obstruktion']],
      ['metamizol', ['schmerzen']],
      ['metoprolol', ['tachykardesvorhofflimmern', 'multipleves']],
      ['midazolam', ['krampfanfall', 'schmerzen']],
      ['morphin', ['schmerzen']],
      ['naloxon', ['opioidintoxikation']],
      ['paracetamol', ['fieberkrampf', 'schmerzen']],
      ['predni', ['anaphylaxie', 'obstruktion', 'asthmaanfall', 'exazerbiertecopd', 'pseudokrupp']],
      ['salbutamol', ['obstruktion', 'asthmaanfall', 'exazerbiertecopd']],
      ['tranexam', ['blutungnachtrauma']],
      ['urapidil', ['hypertensivernotfall', 'hypertoniebeischlaganfall']],
    ])
  })

  test('renders stored tasks with the existing labels and explicit doses', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = JSON.parse(JSON.stringify([
      new ConsentMedTask('ass', 'acs', '250mg iv', true, '', ''),
      new ConsentMedTask('heparin', 'acs', '5000IE iv', true, '', ''),
      new ConsentMedTask('furosemid', 'lungenödem', '40mg iv', true, '', ''),
    ]))
    expect(treatment.getBlock()).toBe([
      'SAA ASS+Heparin (ACS);',
      'SAA Furosemid (Lungenödem); 40mg iv;',
      'keine Unverträglichkeit; kein Hinweis auf relevante KI:',
      'ASS 250mg iv; Heparin 5000IE iv;',
    ].join('\n'))
  })

  test('preserves the consent hint without supplying a dose', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('dimenhydrinat', 'erbrechen', '', true, '', '')]
    expect(treatment.getBlock()).toBe([
      'SAA Dimenhydrinat (Anhaltendes Erbrechen);',
      'Aufkl.: kein Fahrzeug führen/Sturzrisiko bis 24h;',
      'keine Unverträglichkeit; kein Hinweis auf relevante KI:',
    ].join('\n'))
  })

  test.each([
    ['rea', 'Reanimation', false],
    ['bradykardie', 'Bradykardie', false],
    ['anaphylaxie', 'Anaphylaxie', false],
    ['pseudokrupp', 'Pseudokrupp', true],
    ['obstruktion', 'Atemwegsobstruktion', true],
  ])('preserves the adrenaline contraindication rule for %s', (id, name, requiresCheck) => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('adrenalin', id, '', true, '', '')]
    expect(treatment.getBlock()).toBe([
      `SAA Adrenalin (${name});`,
      ...(requiresCheck ? ['keine Unverträglichkeit; kein Hinweis auf relevante KI:'] : []),
    ].join('\n'))
  })

  test('keeps the fallback for unknown indication IDs', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('adrenalin', 'alte indikation', '', true, '', '')]
    expect(treatment.getBlock()).toBe([
      'SAA Adrenalin (Alte indikation);',
    ].join('\n'))
  })

  test('keeps empty doses empty and never exports placeholders', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('ass', 'acs', '', false, '', '')]
    expect(treatment.getBlock()).toBe([
      'SAA ASS (ACS);',
      'sonst keine Hinweise auf relevante KI oder Unverträglichkeit:',
    ].join('\n'))
  })

  test('keeps unknown medications and explicit doses readable', () => {
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('altes medikament', 'alte indikation', 'eigene Dosis', true, '', '')]
    expect(treatment.getBlock()).toBe([
      'SAA Altes medikament (Alte indikation); eigene Dosis;',
    ].join('\n'))
  })

  test('uses consent hints and contraindication rules for the exact medication and indication', () => {
    const original = DATA_SaamedMeta.adrenalin
    const med = new ConsentMed(original.id, original.Name, {
      [SaamedIndication.REA]: {
        name: 'Reanimation', dosageHint: 'Erster Platzhalter',
        requiresContracheck: false, consentHint: 'Erster Hinweis',
      },
      [SaamedIndication.BRADYKARDIE]: {
        name: 'Bradykardie', dosageHint: 'Zweiter Platzhalter',
        requiresContracheck: true, consentHint: 'Zweiter Hinweis', contraReason: 'Begründungsplatzhalter',
      },
    })
    DATA_SaamedMeta.adrenalin = med
    const treatment = new TreatmentSaamed()
    treatment.medTasks = [new ConsentMedTask('adrenalin', 'rea', 'dokumentierte Dosis', true, '', '')]
    expect(treatment.getBlock()).toBe('SAA Adrenalin (Reanimation); dokumentierte Dosis;\nErster Hinweis;')
    treatment.medTasks.push(new ConsentMedTask('adrenalin', 'bradykardie', '', true, '', 'notiz'))
    expect(treatment.getBlock()).toBe([
      'SAA Adrenalin (Reanimation); dokumentierte Dosis;',
      'Erster Hinweis;',
      'SAA Adrenalin (Bradykardie); Notiz;',
      'Zweiter Hinweis;',
      'keine Unverträglichkeit; kein Hinweis auf relevante KI:',
    ].join('\n'))
  })

  test('initializes neutral hints and preserves units and contraindication defaults', () => {
    const specialUnits: Record<string, string> = {
      esketamin: 'mg/kg', glucose: 'g', glyceroltrinitrat: 'Hub',
      heparin: 'IE', metamizol: 'g', paracetamol: 'g',
    }
    for (const { med, indicationId, indication } of DATA_SaamedOptions()) {
      expect(indication.dosageHint).toBe('Dosierung eingeben …')
      expect(indication.dosageChips).toEqual([specialUnits[med.id] ?? 'mg'])
      expect(indication.contraReason).toBeUndefined()
      const unchecked = med.id === 'adrenalin' && [
        SaamedIndication.REA, SaamedIndication.BRADYKARDIE, SaamedIndication.ANAPHYLAXIE,
      ].includes(indicationId)
      expect(indication.requiresContracheck).toBe(!unchecked)
    }
  })
})
