import { ConsentMed, isSaamedIndication, SaamedIndication } from '@/types/lists/saamed'
import type { ConsentMedOption } from '@/types/lists/saamed'

export const DATA_SaamedIndicationNames: Record<SaamedIndication, string> = {
  [SaamedIndication.ACS]: 'ACS',
  [SaamedIndication.ANAPHYLAXIE]: 'Anaphylaxie',
  [SaamedIndication.ARTERIELLERVERSCHLUSS]: 'Arterieller Verschluss',
  [SaamedIndication.ASTHMAANFALL]: 'Asthmaanfall',
  [SaamedIndication.BRADYKARDIE]: 'Bradykardie',
  [SaamedIndication.BLUTUNGNACHTRAUMA]: 'Blutung nach Trauma',
  [SaamedIndication.EXAZERBIERTECOPD]: 'Exazerbierte COPD',
  [SaamedIndication.EMESIS]: 'Anhaltendes Erbrechen',
  [SaamedIndication.FIEBERKRAMPF]: 'Fieberkrampf',
  [SaamedIndication.HYPOGLYKAEMIE]: 'Hypoglykämie',
  [SaamedIndication.HYPERTENSIVERNOTFALL]: 'Hypertensiver Notfall',
  [SaamedIndication.HYPERTONIEBEISCHLAGANFALL]: 'Hypertonie bei Schlaganfall',
  [SaamedIndication.KRAMPFANFALL]: 'Krampfanfall',
  [SaamedIndication.LUNGENEMBOLIE]: 'Lungenembolie',
  [SaamedIndication.LUNGENOEDEM]: 'Lungenödem',
  [SaamedIndication.MULTIPLEVES]: 'Multiple VES',
  [SaamedIndication.OBSTRUKTION]: 'Atemwegsobstruktion',
  [SaamedIndication.OPIOIDINTOXIKATION]: 'Opioid-Intoxikation',
  [SaamedIndication.PSEUDOKRUPP]: 'Pseudokrupp',
  [SaamedIndication.REA]: 'Reanimation',
  [SaamedIndication.SEDIERUNG]: 'Sedierung',
  [SaamedIndication.SCHMERZ]: 'Schmerzen',
  [SaamedIndication.TACHYKARDESVORHOFFLIMMERN]: 'Tachykardes Vorhofflimmern',
}

export const DATA_SaamedMeta: Record<string, ConsentMed> = {

  adrenalin: new ConsentMed('adrenalin', 'Adrenalin', {
    [SaamedIndication.REA]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.REA],
      dosageHint: '1mg (i.v.)',
      dosageChips: [['mg (i.v.)', 'mg (i.o.)']],
      requiresContracheck: false,
    },
    [SaamedIndication.BRADYKARDIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.BRADYKARDIE],
      dosageHint: '2-10µg / min',
      dosageChips: [['µg (i.v.)', 'mg (i.v.)'], 'titriert'],
      requiresContracheck: false,
    },
    [SaamedIndication.ANAPHYLAXIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ANAPHYLAXIE],
      dosageHint: '0.5mg (i.m.)',
      dosageChips: [['0.5', '0.3', '0.15'], 'mg (i.m.)', '+ 4mg (inhalativ)'],
      requiresContracheck: false,
    },
    [SaamedIndication.PSEUDOKRUPP]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.PSEUDOKRUPP],
      dosageHint: '4mg (inhalativ)',
      dosageChips: ['4mg (inhalativ)'],
      requiresContracheck: false,
    },
    [SaamedIndication.OBSTRUKTION]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.OBSTRUKTION],
      dosageHint: '4mg (inhalativ)',
      dosageChips: ['4mg (inhalativ)'],
      requiresContracheck: false,
    },
  }),

  amiodaron: new ConsentMed('amiodaron', 'Amiodaron', {
    [SaamedIndication.REA]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.REA],
      dosageHint: '50mg / 10kg',
      dosageChips: ['mg (i.v.)'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  ass: new ConsentMed('ass', 'ASS', {
    [SaamedIndication.ACS]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ACS],
      dosageHint: '250mg (i.v.)',
      dosageChips: [['250mg (i.v.)', '200mg (p.o.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  atropin: new ConsentMed('atropin', 'Atropin', {
    [SaamedIndication.BRADYKARDIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.BRADYKARDIE],
      dosageHint: '0.5mg (i.v.)',
      dosageChips: [['1x', '2x', '3x', '4x', '5x', '6x'], '0.5mg (i.v.)'],
      requiresContracheck: true,
      contraReason: 'z. B. instabile Bradykardie trotz Schwangerschaft',
    },
  }),

  butylscopolamin: new ConsentMed('butylscopolamin', 'Butylscopolamin', {
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '10-20mg (i.v.)',
      dosageChips: [['10mg (i.v.)', '20mg (i.v.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  dimenhydrinat: new ConsentMed('dimenhydrinat', 'Dimenhydrinat', {
    [SaamedIndication.EMESIS]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.EMESIS],
      dosageHint: '62mg (i.v.)',
      dosageChips: [['62mg (i.v.)', '40mg (i.v.)', '40mg (Zäpfchen)']],
      requiresContracheck: true,
      contraReason: '',
      consentHint: 'Aufkl.: kein Fahrzeug führen/Sturzrisiko bis 24h',
    },
  }),

  dimetinden: new ConsentMed('dimetinden', 'Dimetinden', {
    [SaamedIndication.ANAPHYLAXIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ANAPHYLAXIE],
      dosageHint: '4mg (i.v.)',
      dosageChips: [['4mg (i.v.)', '8mg (i.v.)', 'mg (i.v.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  esketamin: new ConsentMed('esketamin', 'Esketamin', {
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '0.125mg/kg (i.v.)',
      dosageChips: [['mg (i.v.)', 'mg (i.n.)', 'mg (i.m.)']],
      requiresContracheck: true,
      contraReason: 'z. B. starke Schmerzen trotz Glaukom',
    },
  }),

  fentanyl: new ConsentMed('fentanyl', 'Fentanyl', {
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '50µg (i.v.)',
      dosageChips: [['µg (i.v.)', 'µg (i.n.)', 'µg (i.m.)']],
      requiresContracheck: true,
      contraReason: 'z. B. starke Schmerzen trotz COPD',
    },
  }),

  furosemid: new ConsentMed('furosemid', 'Furosemid', {
    [SaamedIndication.LUNGENOEDEM]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.LUNGENOEDEM],
      dosageHint: '20mg (i.v.)',
      dosageChips: [['1x', '2x'], '20mg (i.v.)'],
      requiresContracheck: true,
      contraReason: 'z. B. schweres Lungenödem trotz Schwangerschaft',
    },
  }),

  glucagon: new ConsentMed('glucagon', 'Glucagon', {
    [SaamedIndication.HYPOGLYKAEMIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.HYPOGLYKAEMIE],
      dosageHint: '1mg (i.m.)',
      dosageChips: [['1mg (i.m.)', '0.5mg (i.m.)', '3mg (i.n.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  glucose: new ConsentMed('glucose', 'Glucose', {
    [SaamedIndication.HYPOGLYKAEMIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.HYPOGLYKAEMIE],
      dosageHint: '10g (i.v.)',
      dosageChips: [['8g (i.v.)', '10g (i.v.)', 'g (i.v.)', 'g (p.o.)']],
      requiresContracheck: false,
    },
  }),

  glyceroltrinitrat: new ConsentMed('glyceroltrinitrat', 'Nitrospray', {
    [SaamedIndication.LUNGENOEDEM]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.LUNGENOEDEM],
      dosageHint: '1 Hub (0.4mg, s.l.)',
      dosageChips: [['1x', '2x'], '1 Hub (0.4mg, s.l.)'],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.HYPERTENSIVERNOTFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.HYPERTENSIVERNOTFALL],
      dosageHint: '1 Hub (0.4mg, s.l.)',
      dosageChips: [['1x', '2x'], '1 Hub (0.4mg, s.l.)'],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.ACS]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ACS],
      dosageHint: '1 Hub (0.4mg, s.l.)',
      dosageChips: [['1x', '2x'], '1 Hub (0.4mg, s.l.)'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  heparin: new ConsentMed('heparin', 'Heparin', {
    [SaamedIndication.ACS]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ACS],
      dosageHint: '5000 IE (i.v.)',
      dosageChips: ['5000 IE (i.v.)'],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.LUNGENEMBOLIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.LUNGENEMBOLIE],
      dosageHint: '5000 IE (i.v.)',
      dosageChips: ['5000 IE (i.v.)'],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.ARTERIELLERVERSCHLUSS]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ARTERIELLERVERSCHLUSS],
      dosageHint: '5000 IE (i.v.)',
      dosageChips: ['5000 IE (i.v.)'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  ibuprofen: new ConsentMed('ibuprofen', 'Ibuprofen', {
    [SaamedIndication.FIEBERKRAMPF]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.FIEBERKRAMPF],
      dosageHint: '100mg (p.o.)',
      dosageChips: [['50mg (p.o.)', '100mg (p.o.)', '150mg (p.o.)', '200mg (p.o.)', 'mg (p.o.)', 'mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '600mg (i.v.)',
      dosageChips: [['600mg (i.v.)', '50mg (p.o.)', '100mg (p.o.)', '150mg (p.o.)', '200mg (p.o.)', 'mg (p.o.)', 'mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  ipratropium: new ConsentMed('ipratropium', 'Ipratropiumbromid', {
    [SaamedIndication.ASTHMAANFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ASTHMAANFALL],
      dosageHint: '0.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['0.5mg (inhalativ)', '0.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz Schwangerschaft',
    },
    [SaamedIndication.EXAZERBIERTECOPD]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.EXAZERBIERTECOPD],
      dosageHint: '0.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['0.5mg (inhalativ)', '0.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz Schwangerschaft',
    },
    [SaamedIndication.OBSTRUKTION]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.OBSTRUKTION],
      dosageHint: '0.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['0.5mg (inhalativ)', '0.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz Schwangerschaft',
    },
  }),

  metamizol: new ConsentMed('metamizol', 'Metamizol', {
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: 'Dosierung eingeben …',
      dosageChips: ['g'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  metoprolol: new ConsentMed('metoprolol', 'Metoprolol', {
    [SaamedIndication.TACHYKARDESVORHOFFLIMMERN]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.TACHYKARDESVORHOFFLIMMERN],
      dosageHint: '2mg (i.v.)',
      dosageChips: [['2mg (i.v.)', '2mg + 2mg (i.v.)', '2mg + 2mg + 1mg (i.v.)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.MULTIPLEVES]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.MULTIPLEVES],
      dosageHint: '2mg (i.v.)',
      dosageChips: [['2mg (i.v.)', '2mg + 2mg (i.v.)', '2mg + 2mg + 1mg (i.v.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  midazolam: new ConsentMed('midazolam', 'Midazolam', {
    [SaamedIndication.KRAMPFANFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.KRAMPFANFALL],
      dosageHint: '0.1mg/kg (i.v.)',
      dosageChips: [['mg (i.v.)', '10mg (i.m.)', '2.5mg (i.n.)', '5mg (i.n.)', '10mg (i.n.)', '2.5mg (bukkal)', '5mg (bukkal)', '7.5mg (bukkal)', '10mg (bukkal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '2mg (i.v.)',
      dosageChips: [['1mg (i.v.)', '2mg (i.v.)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  morphin: new ConsentMed('morphin', 'Morphin', {
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '2mg (i.v.)',
      dosageChips: [['2mg (i.v.)', '4mg (i.v.)', '6mg (i.v.)', '8mg (i.v.)', '10mg (i.v.)', 'mg (i.v.)'], 'fraktioniert'],
      requiresContracheck: true,
      contraReason: 'z. B. stärkste Schmerzen trotz COPD',
    },
  }),

  naloxon: new ConsentMed('naloxon', 'Naloxon', {
    [SaamedIndication.OPIOIDINTOXIKATION]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.OPIOIDINTOXIKATION],
      dosageHint: '0.1mg (i.v.)',
      dosageChips: [['0.1mg (i.v.)', 'mg (i.v.)'], 'titriert'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  paracetamol: new ConsentMed('paracetamol', 'Paracetamol', {
    [SaamedIndication.FIEBERKRAMPF]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.FIEBERKRAMPF],
      dosageHint: '125mg (rektal)',
      dosageChips: [['1g (i.v.)', 'mg (i.v.)', '125mg (rektal)', '250mg (rektal)', '500mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.SCHMERZ]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.SCHMERZ],
      dosageHint: '1g (i.v.)',
      dosageChips: [['1g (i.v.)', 'mg (i.v.)', '125mg (rektal)', '250mg (rektal)', '500mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  predni: new ConsentMed('predni', 'Prednisolon', {
    [SaamedIndication.ANAPHYLAXIE]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ANAPHYLAXIE],
      dosageHint: '250mg (i.v.)',
      dosageChips: [['250mg (i.v.)', '100mg (i.v.)', '50mg (i.v.)', '100mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.OBSTRUKTION]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.OBSTRUKTION],
      dosageHint: '80mg (i.v.)',
      dosageChips: [['80mg (i.v.)', 'mg (i.v.)', '100mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.ASTHMAANFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ASTHMAANFALL],
      dosageHint: '80mg (i.v.)',
      dosageChips: [['80mg (i.v.)', 'mg (i.v.)', '100mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.EXAZERBIERTECOPD]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.EXAZERBIERTECOPD],
      dosageHint: '80mg (i.v.)',
      dosageChips: [['80mg (i.v.)', 'mg (i.v.)', '100mg (rektal)']],
      requiresContracheck: true,
      contraReason: '',
    },
    [SaamedIndication.PSEUDOKRUPP]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.PSEUDOKRUPP],
      dosageHint: '100mg (rektal)',
      dosageChips: ['100mg (rektal)'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

  salbutamol: new ConsentMed('salbutamol', 'Salbutamol', {
    [SaamedIndication.OBSTRUKTION]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.OBSTRUKTION],
      dosageHint: '2.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['2.5mg (inhalativ)', '1.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz HOCM',
    },
    [SaamedIndication.ASTHMAANFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.ASTHMAANFALL],
      dosageHint: '2.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['2.5mg (inhalativ)', '1.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz HOCM',
    },
    [SaamedIndication.EXAZERBIERTECOPD]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.EXAZERBIERTECOPD],
      dosageHint: '2.5mg (inhalativ)',
      dosageChips: [['1x', '2x'], ['2.5mg (inhalativ)', '1.25mg (inhalativ)']],
      requiresContracheck: true,
      contraReason: 'z. B. schwere Bronchialobstruktion trotz HOCM',
    },
  }),

  tranexam: new ConsentMed('tranexam', 'Tranexamsäure', {
    [SaamedIndication.BLUTUNGNACHTRAUMA]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.BLUTUNGNACHTRAUMA],
      dosageHint: '1g (i.v.)',
      dosageChips: [['1g (i.v.)', 'mg (i.v.)'], 'über 15min'],
      requiresContracheck: true,
      contraReason: 'z. B. hämorrhagischer Schock trotz Niereninsuffizienz',
    },
  }),

  urapidil: new ConsentMed('urapidil', 'Urapidil', {
    [SaamedIndication.HYPERTENSIVERNOTFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.HYPERTENSIVERNOTFALL],
      dosageHint: '5mg (i.v.)',
      dosageChips: [['5mg (i.v.)', '10mg (i.v.)', '15mg (i.v.)', '20mg (i.v.)', '25mg (i.v.)', 'mg (i.v.)'], 'fraktioniert'],
      requiresContracheck: true,
      contraReason: 'z. B. hypertensiver Notfall; Dosisreduktion bei Niereninsuffizienz',
    },
    [SaamedIndication.HYPERTONIEBEISCHLAGANFALL]: {
      name: DATA_SaamedIndicationNames[SaamedIndication.HYPERTONIEBEISCHLAGANFALL],
      dosageHint: '5mg (i.v.)',
      dosageChips: [['5mg (i.v.)', '10mg (i.v.)', '15mg (i.v.)', '20mg (i.v.)', '25mg (i.v.)', 'mg (i.v.)'], 'fraktioniert'],
      requiresContracheck: true,
      contraReason: '',
    },
  }),

}

export function DATA_SaamedOptions(): Array<ConsentMedOption> {
  const options: Array<ConsentMedOption> = []
  for (const med of Object.values(DATA_SaamedMeta)) {
    for (const [indicationId, indication] of Object.entries(med.Indications)) {
      if (!isSaamedIndication(indicationId) || !indication) continue
      options.push({ med, indicationId, indication })
    }
  }
  return options
}
