
export class ConsentMedsIndication {
  constructor(
    public Id: string,
    public Name: string,
  ) { }
}

const INDICATION_ACS = 'acs'
const INDICATION_ANAPHYLAXIE = 'anaphylaxie'
const INDICATION_ARTERIELLERVERSCHLUSS = 'arteriellerverschluss'
const INDICATION_ASTHMAANFALL = 'asthmaanfall'
const INDICATION_BRADYKARDIE = 'bradykardie'
const INDICATION_BLUTUNGNACHTRAUMA = 'blutungnachtrauma'
const INDICATION_EXAZERBIERTECOPD = 'exazerbiertecopd'
const INDICATION_EMESIS = 'erbrechen'
const INDICATION_FIEBERKRAMPF = 'fieberkrampf'
const INDICATION_HYPOGLYKAEMIE = 'hypoglykämie'
const INDICATION_HYPERTENSIVERNOTFALL = 'hypertensivernotfall'
const INDICATION_HYPERTONIEBEISCHLAGANFALL = 'hypertoniebeischlaganfall'
const INDICATION_KRAMPFANFALL = 'krampfanfall'
const INDICATION_LUNGENEMBOLIE = 'lungenembolie'
const INDICATION_LUNGENOEDEM = 'lungenödem'
const INDICATION_MULTIPLEVES = 'multipleves'
const INDICATION_OBSTRUKTION = 'obstruktion'
const INDICATION_OPIOIDINTOXIKATION = 'opioidintoxikation'
const INDICATION_PSEUDOKRUPP = 'pseudokrupp'
const INDICATION_REA = 'rea'
const INDICATION_SEDIERUNG = 'sedierung'
const INDICATION_SCHMERZ = 'schmerzen'
const INDICATION_TACHYKARDESVORHOFFLIMMERN = 'tachykardesvorhofflimmern'

export const DATA_SaamedIndications: Record<string, ConsentMedsIndication> = {
  [INDICATION_ACS]: new ConsentMedsIndication(INDICATION_ACS, 'ACS'),
  [INDICATION_ANAPHYLAXIE]: new ConsentMedsIndication(INDICATION_ANAPHYLAXIE, 'Anaphylaxie'),
  [INDICATION_ARTERIELLERVERSCHLUSS]: new ConsentMedsIndication(INDICATION_ARTERIELLERVERSCHLUSS, 'Arterieller Verschluss'),
  [INDICATION_ASTHMAANFALL]: new ConsentMedsIndication(INDICATION_ASTHMAANFALL, 'Asthmaanfall'),
  [INDICATION_BRADYKARDIE]: new ConsentMedsIndication(INDICATION_BRADYKARDIE, 'Bradykardie'),
  [INDICATION_BLUTUNGNACHTRAUMA]: new ConsentMedsIndication(INDICATION_BLUTUNGNACHTRAUMA, 'Blutung nach Trauma'),
  [INDICATION_EXAZERBIERTECOPD]: new ConsentMedsIndication(INDICATION_EXAZERBIERTECOPD, 'Exazerbierte COPD'),
  [INDICATION_EMESIS]: new ConsentMedsIndication(INDICATION_EMESIS, 'Anhaltendes Erbrechen'),
  [INDICATION_FIEBERKRAMPF]: new ConsentMedsIndication(INDICATION_FIEBERKRAMPF, 'Fieberkrampf'),
  [INDICATION_HYPOGLYKAEMIE]: new ConsentMedsIndication(INDICATION_HYPOGLYKAEMIE, 'Hypoglykämie'),
  [INDICATION_HYPERTENSIVERNOTFALL]: new ConsentMedsIndication(INDICATION_HYPERTENSIVERNOTFALL, 'Hypertensiver Notfall'),
  [INDICATION_HYPERTONIEBEISCHLAGANFALL]: new ConsentMedsIndication(INDICATION_HYPERTONIEBEISCHLAGANFALL, 'Hypertonie bei Schlaganfall'),
  [INDICATION_KRAMPFANFALL]: new ConsentMedsIndication(INDICATION_KRAMPFANFALL, 'Krampfanfall'),
  [INDICATION_LUNGENEMBOLIE]: new ConsentMedsIndication(INDICATION_LUNGENEMBOLIE, 'Lungenembolie'),
  [INDICATION_LUNGENOEDEM]: new ConsentMedsIndication(INDICATION_LUNGENOEDEM, 'Lungenödem'),
  [INDICATION_MULTIPLEVES]: new ConsentMedsIndication(INDICATION_MULTIPLEVES, 'Multiple VES'),
  [INDICATION_OBSTRUKTION]: new ConsentMedsIndication(INDICATION_OBSTRUKTION, 'Atemwegsobstruktion'),
  [INDICATION_OPIOIDINTOXIKATION]: new ConsentMedsIndication(INDICATION_OPIOIDINTOXIKATION, 'Opioid-Intoxikation'),
  [INDICATION_PSEUDOKRUPP]: new ConsentMedsIndication(INDICATION_PSEUDOKRUPP, 'Pseudokrupp'),
  [INDICATION_REA]: new ConsentMedsIndication(INDICATION_REA, 'Reanimation'),
  [INDICATION_SEDIERUNG]: new ConsentMedsIndication(INDICATION_SEDIERUNG, 'Sedierung'),
  [INDICATION_SCHMERZ]: new ConsentMedsIndication(INDICATION_SCHMERZ, 'Schmerzen'),
  [INDICATION_TACHYKARDESVORHOFFLIMMERN]: new ConsentMedsIndication(INDICATION_TACHYKARDESVORHOFFLIMMERN, 'Tachykardes Vorhofflimmern'),
}

// ######################################################################################

export class ConsentMed {
  constructor(

    public id: string,
    public Name: string,
    public Indications: Set<string>,
    public defaultDosage: string,
    public defaultHint?: string,
    public requiresContraCheck?: Set<string>,
    public alternativeName?: string,

  ) {
    this.requiresContraCheck = requiresContraCheck ?? Indications
    this.defaultHint = defaultHint ?? ''
  }
}

// ######################################################################################

export class ConsentMedTask {
  constructor(

    public MedId: string,
    public MedIndication: string,

    public dosageText: string,

    public contraOk: boolean,
    public contraText: string,
    public noteText: string,

  ) { }
}

// ######################################################################################

export const DATA_SaamedMeta: Record<string, ConsentMed> = {

  adrenalin: new ConsentMed('adrenalin',
    'Adrenalin', new Set([
      INDICATION_REA,
      INDICATION_BRADYKARDIE,
      INDICATION_ANAPHYLAXIE,
      INDICATION_PSEUDOKRUPP,
      INDICATION_OBSTRUKTION,
    ]),
    '1mg iv', '', new Set([
      INDICATION_PSEUDOKRUPP,
      INDICATION_OBSTRUKTION,
    ]),
  ),

  amiodaron: new ConsentMed('amiodaron',
    'Amiodaron', new Set([
      INDICATION_REA,
    ]),
    '300mg iv'
  ),

  ass: new ConsentMed('ass',
    'ASS', new Set([
      INDICATION_ACS,
    ]),
    '250mg iv'
  ),

  atropin: new ConsentMed('atropin',
    'Atropin', new Set([
      INDICATION_BRADYKARDIE,
    ]),
    '0,5mg iv'
  ),

  butylscopolamin: new ConsentMed('butylscopolamin',
    'Butylscopolamin', new Set([
      INDICATION_SCHMERZ,
    ]),
    '20mg iv'
  ),

  dimenhydrinat: new ConsentMed('dimenhydrinat',
    'Dimenhydrinat', new Set([
      INDICATION_EMESIS,
    ]),
    '62mg iv', 'Aufkl.: kein Fahrzeug führen/Sturzrisiko bis 24h'
  ),

  dimetinden: new ConsentMed('dimetinden',
    'Dimetinden', new Set([
      INDICATION_ANAPHYLAXIE,
    ]),
    '4mg iv'
  ),

  esketamin: new ConsentMed('esketamin',
    'Esketamin', new Set([
      INDICATION_SCHMERZ,
    ]),
    '0,25mg/kg iv'
  ),

  fentanyl: new ConsentMed('fentanyl',
    'Fentanyl', new Set([
      INDICATION_SCHMERZ,
    ]),
    '0,05mg iv'
  ),

  furosemid: new ConsentMed('furosemid',
    'Furosemid', new Set([
      INDICATION_LUNGENOEDEM,
    ]),
    '40mg iv'
  ),

  glucagon: new ConsentMed('glucagon',
    'Glucagon', new Set([
      INDICATION_HYPOGLYKAEMIE,
    ]),
    '1mg im'
  ),

  glucose: new ConsentMed('glucose',
    'Glucose', new Set([
      INDICATION_HYPOGLYKAEMIE,
    ]),
    '10g iv'
  ),

  glyceroltrinitrat: new ConsentMed('glyceroltrinitrat',
    'Nitrospray', new Set([
      INDICATION_LUNGENOEDEM,
      INDICATION_HYPERTENSIVERNOTFALL,
      INDICATION_ACS,
    ]),
    '1 Hub (0,4mg)'
  ),

  heparin: new ConsentMed('heparin',
    'Heparin', new Set([
      INDICATION_ACS,
      INDICATION_LUNGENEMBOLIE,
      INDICATION_ARTERIELLERVERSCHLUSS
    ]),
    '5000IE iv'
  ),

  ibuprofen: new ConsentMed('ibuprofen',
    'Ibuprofen', new Set([
      INDICATION_FIEBERKRAMPF,
      INDICATION_SCHMERZ,
    ]),
    '400mg po'
  ),

  ipratropium: new ConsentMed('ipratropium',
    'Ipratropiumbromid', new Set([
      INDICATION_ASTHMAANFALL,
      INDICATION_EXAZERBIERTECOPD,
      INDICATION_OBSTRUKTION,
    ]),
    '0,5mg inhalativ'
  ),

  metamizol: new ConsentMed('metamizol',
    'Metamizol', new Set([
      INDICATION_SCHMERZ,
    ]),
    '1g iv'
  ),

  metoprolol: new ConsentMed('metoprolol',
    'Metoprolol', new Set([
      INDICATION_TACHYKARDESVORHOFFLIMMERN,
      INDICATION_MULTIPLEVES,
    ]),
    '2mg iv'
  ),

  midazolam: new ConsentMed('midazolam',
    'Midazolam', new Set([
      INDICATION_KRAMPFANFALL,
      INDICATION_SCHMERZ,
    ]),
    '2mg iv'
  ),

  morphin: new ConsentMed('morphin',
    'Morphin', new Set([
      INDICATION_SCHMERZ,
    ]),
    '2mg iv'
  ),

  naloxon: new ConsentMed('naloxon',
    'Naloxon', new Set([
      INDICATION_OPIOIDINTOXIKATION,
    ]),
    '0,1mg iv'
  ),

  paracetamol: new ConsentMed('paracetamol',
    'Paracetamol', new Set([
      INDICATION_FIEBERKRAMPF,
      INDICATION_SCHMERZ,
    ]),
    '1g KI'
  ),

  predni: new ConsentMed('predni',
    'Prednisolon', new Set([
      INDICATION_ANAPHYLAXIE,
      INDICATION_OBSTRUKTION,
      INDICATION_ASTHMAANFALL,
      INDICATION_EXAZERBIERTECOPD,
      INDICATION_PSEUDOKRUPP,
    ]),
    '100mg iv'
  ),

  salbutamol: new ConsentMed('salbutamol',
    'Salbutamol', new Set([
      INDICATION_OBSTRUKTION,
      INDICATION_ASTHMAANFALL,
      INDICATION_EXAZERBIERTECOPD,
    ]),
    '2,5mg inhalativ'
  ),

  tranexam: new ConsentMed('tranexam',
    'Tranexamsäure', new Set([
      INDICATION_BLUTUNGNACHTRAUMA,
    ]),
    '500mg iv'
  ),

  urapidil: new ConsentMed('urapidil',
    'Urapidil', new Set([
      INDICATION_HYPERTENSIVERNOTFALL,
      INDICATION_HYPERTONIEBEISCHLAGANFALL
    ]),
    '5mg iv'
  ),

}

export type ConsentMedOption = {
  med: ConsentMed,
  indication: ConsentMedsIndication,
}

export function DATA_SaamedOptions(): Array<ConsentMedOption> {
  const options: Array<ConsentMedOption> = []
  for (const med of Object.values(DATA_SaamedMeta)) {
    for (const indicationId of med.Indications) {
      const indication = DATA_SaamedIndications[indicationId] ?? new ConsentMedsIndication(indicationId, indicationId)
      options.push({ med, indication })
    }
  }
  return options
}
