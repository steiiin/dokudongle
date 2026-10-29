export enum SaamedIndication {
  ACS = 'acs',
  ANAPHYLAXIE = 'anaphylaxie',
  ARTERIELLERVERSCHLUSS = 'arteriellerverschluss',
  ASTHMAANFALL = 'asthmaanfall',
  BRADYKARDIE = 'bradykardie',
  BLUTUNGNACHTRAUMA = 'blutungnachtrauma',
  EXAZERBIERTECOPD = 'exazerbiertecopd',
  EMESIS = 'erbrechen',
  FIEBERKRAMPF = 'fieberkrampf',
  HYPOGLYKAEMIE = 'hypoglykämie',
  HYPERTENSIVERNOTFALL = 'hypertensivernotfall',
  HYPERTONIEBEISCHLAGANFALL = 'hypertoniebeischlaganfall',
  KRAMPFANFALL = 'krampfanfall',
  LUNGENEMBOLIE = 'lungenembolie',
  LUNGENOEDEM = 'lungenödem',
  MULTIPLEVES = 'multipleves',
  OBSTRUKTION = 'obstruktion',
  OPIOIDINTOXIKATION = 'opioidintoxikation',
  PSEUDOKRUPP = 'pseudokrupp',
  REA = 'rea',
  SEDIERUNG = 'sedierung',
  SCHMERZ = 'schmerzen',
  TACHYKARDESVORHOFFLIMMERN = 'tachykardesvorhofflimmern',
}

const saamedIndicationIds: ReadonlySet<string> = new Set(Object.values(SaamedIndication))

export function isSaamedIndication(value: string): value is SaamedIndication {
  return saamedIndicationIds.has(value)
}

export interface ConsentMedIndication {
  name: string
  dosageHint: string
  /** Nested arrays share a color and are hidden together after selecting a chip. */
  dosageChips?: Array<string | string[]>
  consentHint?: string
  requiresContracheck: boolean
  contraReason?: string
}

export class ConsentMed {
  constructor(

    public id: string,
    public Name: string,
    public Indications: Partial<Record<SaamedIndication, ConsentMedIndication>>,
    public alternativeName?: string,

  ) { }
}

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

export type ConsentMedOption = {
  med: ConsentMed,
  indicationId: SaamedIndication,
  indication: ConsentMedIndication,
}
