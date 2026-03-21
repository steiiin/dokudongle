
export class RedFlagGroup {
  constructor(
    public Name: string,
    public Color: string
  ) { }
}

const GROUP_NEURO = new RedFlagGroup('Neuro', '#ff0000')
const GROUP_KARDIAL = new RedFlagGroup('Kardial', '#ff0000')
const GROUP_LUNGE = new RedFlagGroup('Lunge', '#ff0000')
const GROUP_ABDOMEN = new RedFlagGroup('Abdomen', '#ff0000')
const GROUP_URO = new RedFlagGroup('Urologie', '#ff0000')
const GROUP_VERLETZUNG = new RedFlagGroup('Verletzung', '#ff0000')
const GROUP_MISC = new RedFlagGroup('Sonstige', '#ff0000')

// ######################################################################################

export class RedFlag {
  constructor(
    public id: string,
    public Name: string,
    public IsEmergency: boolean,
    public Group: RedFlagGroup,
    public Description?: string,                    // different description used in RedFlag-text
    public DedupeKey?: string,
    public Priority: number = 0,
  ) {
    this.Description = Description ?? Name
  }
}

// ######################################################################################

export class RedDiagnose {
  constructor(
    public id: string,
    public Name: string,
    public Group: RedFlagGroup,
    public RedFlagIds: Array<string>,
  ) { }
}

// ######################################################################################

export const RedFlags: Record<string, RedFlag> = {

  neuro_vigilanzminderung: new RedFlag('neuro_vigilanzminderung',
    'Vigilanzminderung', true, GROUP_NEURO,
    'Vigilanzminderung (Bewusstseinsverlust, Eintrübung, neue Verwirrtheit oder Desorientierung)'
  ),
  neuro_1st_krampfanfall: new RedFlag('neuro_1st_krampfanfall',
    'Krampfanfall (Erstmalig)', true, GROUP_NEURO,
    'Krampfanfall',
    'neuro_1stkrampfanfall', 1
  ),
  neuro_rez_krampfanfall: new RedFlag('neuro_rez_krampfanfall',
    'Krampfanfall (Erneut)', true, GROUP_NEURO,
    'erneutem Krampfanfall',
    'neuro_rezkrampfanfall', 2
  ),
  neuro_ausfaelle: new RedFlag('neuro_ausfaelle',
    'Neurol. Ausfälle', true, GROUP_NEURO,
    'neurologischen Ausfällen (Taubheit Gesicht/Arme/Beine, Sprachstörung, Sehstörung oder Lähmung)'
  ),
  neuro_kopfschmerz: new RedFlag('neuro_kopfschmerz',
    'Kopfschmerzen', true, GROUP_NEURO,
    'plötzlich einsetzenden, sehr starken Kopfschmerzen'
  ),
  neuro_schwindel: new RedFlag('neuro_schwindel',
    'Schwindel', false, GROUP_NEURO,
    'anhaltendem, starkem Schwindel'
  ),

  kardial_brustschmerz: new RedFlag(
    'kardial_brustschmerz',
    'Brustschmerzen', true, GROUP_KARDIAL,
    'Brustschmerzen bzw. Brustenge',
    'schmerz_thorax', 3
  ),
  kardial_herzrasen: new RedFlag('kardial_herzrasen',
    'Herzrasen', true, GROUP_KARDIAL,
    'anhaltendem Herzrasen'
  ),
  kardial_herzstolpern: new RedFlag('kardial_herzstolpern',
    'Herzstolpern', false, GROUP_KARDIAL,
    'anhaltendem Herzstolpern'
  ),
  kardial_oedeme: new RedFlag('kardial_oedeme',
    'Ödeme', false, GROUP_KARDIAL,
    'zunehmenden Ödemen (Schwellung Unterschenkel)'
  ),
  kardial_schwach: new RedFlag('kardial_schwach',
    'Schwäche', false, GROUP_KARDIAL,
    'ausgeprägter Schwäche'
  ),

  lunge_atemnot: new RedFlag('lunge_atemnot',
    'Luftnot', true, GROUP_LUNGE
  ),
  lunge_haemoptysen: new RedFlag('lunge_haemoptysen',
    'Hämoptyse', true, GROUP_LUNGE,
    'Husten mit blutigem Auswurf'
  ),
  lunge_husten: new RedFlag('lunge_husten',
    'Husten', false, GROUP_LUNGE,
    'anhaltendem, erschöpfenden Husten'
  ),

  abdomen_uebelkeit: new RedFlag('abdomen_uebelkeit',
    'Erbrechen', false, GROUP_ABDOMEN,
    'wiederholtem Erbrechen'
  ),
  abdomen_bauchschmerz: new RedFlag(
    'abdomen_bauchschmerz',
    'Bauchschmerzen', false, GROUP_ABDOMEN,
    'starken Bauchschmerzen',
    'schmerz_abdomen', 2
  ),
  abdomen_abwehrspannung: new RedFlag('abdomen_abwehrspannung',
    'Abwehrspannung', true, GROUP_ABDOMEN,
    'harter Bauchdecke/Abwehrspannung'
  ),
  abdomen_bluterbrechen: new RedFlag('abdomen_bluterbrechen',
    'Bluterbrechen', true, GROUP_ABDOMEN,
    'blutigem/kaffeesatzartigem Erbrechen'
  ),
  abdomen_blutstuhl: new RedFlag('abdomen_blutstuhl',
    'Blut im Stuhl', true, GROUP_ABDOMEN,
    'blutigem/schwarzem/teerartigem Stuhl'
  ),
  abdomen_ikterus: new RedFlag('abdomen_ikterus',
    'Ikterus', false, GROUP_ABDOMEN,
    'Gelbfärbung der Haut/Augen'
  ),
  abdomen_durchfall: new RedFlag(
    'abdomen_durchfall',
    'Durchfall', false, GROUP_ABDOMEN,
    'anhaltendem Durchfall',
  ),

  uro_flankenschmerz: new RedFlag('uro_flankenschmerz',
    'Flankenschmerz', false, GROUP_URO,
    'starkem Flankenschmerz'
  ),
  uro_haematurie: new RedFlag('uro_haematurie',
    'Hämaturie', false, GROUP_URO,
    'Blut im Urin'
  ),
  uro_harnverhalt: new RedFlag('uro_harnverhalt',
    'Harnverhalt', true, GROUP_URO,
    'fehlendem/deutlich weniger Wasserlassen über 12h, trotz ausreichenden Flüssigkeitsaufnahme'
  ),
  uro_inkontinenz: new RedFlag('uro_inkontinenz',
    'Inkontinenz', false, GROUP_URO,
  ),

  verletzung_blutung: new RedFlag('verletzung_blutung',
    'Blutung', true, GROUP_VERLETZUNG,
    'wiederkehrenden, starken Blutungen'
  ),
  verletzung_schwellung: new RedFlag('verletzung_schwellung',
    'Schwellung', false, GROUP_VERLETZUNG,
    'deutlicher Schwellung'
  ),
  verletzung_instabil: new RedFlag('verletzung_instabil',
    'Instabilität', true, GROUP_VERLETZUNG,
    'zunehmender Bewegungseinschränkung/Instabilität'
  ),
  verletzung_dms: new RedFlag('verletzung_dms',
    'Störung DMS', true, GROUP_VERLETZUNG,
    'neuen Lähmung/Taubheit/Durchblutungsstörungen'
  ),
  verletzung_luxation: new RedFlag('verletzung_luxation',
    'Erneute Luxation', true, GROUP_VERLETZUNG,
    'erneuten Ausrenkung eines Gelenks'
  ),
  verletzung_blasenbildung: new RedFlag('verletzung_blasenbildung',
    'Blasenbildung', false, GROUP_VERLETZUNG
  ),

  sonstige_fieber: new RedFlag(
    'sonstige_fieber',
    'Fieber', false, GROUP_MISC,
    'Fieber',
    'fieber', 1
  ),
  sonstige_fieberhoch: new RedFlag(
    'sonstige_fieberhoch',
    'Hohes Fieber', false, GROUP_MISC,
    'hohem Fieber',
    'fieber', 2
  ),
  sonstige_schuettelfrost: new RedFlag('sonstige_schuettelfrost',
    'Schüttelfrost', false, GROUP_MISC
  ),
  sonstige_schmerzen: new RedFlag(
    'sonstige_schmerzen',
    'Schmerzen', false, GROUP_MISC,
    'anhaltenden, starken Schmerzen',
    'schmerz_allgemein', 0
  ),
  sonstige_entzuendung: new RedFlag('sonstige_entzuendung',
    'Entzündung', false, GROUP_MISC,
    'Entzündungszeichen (Rötung, Schwellung, Überwärmung)'
  ),
  sonstige_schwitzen: new RedFlag('sonstige_schwitzen',
    'Schwitzen', false, GROUP_MISC
  ),
  sonstige_durst: new RedFlag('sonstige_durst',
    'Durst', false, GROUP_MISC,
    'ausgeprägtem Durst'
  ),
  sonstige_wasser: new RedFlag('sonstige_wasser',
    'Vermehrtes Wasserlassen', false, GROUP_MISC,
    'vermehrtem Wasserlassen'
  ),
  sonstige_suizid: new RedFlag('sonstige_suizid',
    'Suizidgedanken', true, GROUP_MISC,
  ),

}
export function getAllRedFlags(): Array<RedFlag> { return Object.values(RedFlags) }

// ######################################################################################

export const RedDiagnoses: Record<string, RedDiagnose> = {

  verletzung_wunde: new RedDiagnose('verletzung_wunde',
    'Offene Wunde', GROUP_VERLETZUNG,
    [
      'verletzung_blutung',
      'sonstige_entzuendung',
      'sonstige_fieber',
      'sonstige_schmerzen'
    ]
  ),
  verletzung_prellung: new RedDiagnose('verletzung_prellung',
    'Prellung', GROUP_VERLETZUNG,
    [
      'sonstige_schmerzen',
      'verletzung_schwellung'
    ]
  ),
  verletzung_distorsion: new RedDiagnose('verletzung_distorsion',
    'Distorsion (Verstauchung)', GROUP_VERLETZUNG,
    [
      'sonstige_schmerzen',
      'verletzung_schwellung',
      'verletzung_instabil'
    ]
  ),
  verletzung_luxation: new RedDiagnose('verletzung_luxation',
    'Luxation (Ausrenkung)', GROUP_VERLETZUNG,
    [
      'verletzung_luxation',
      'verletzung_dms',
      'sonstige_schmerzen'
    ]
  ),
  verletzung_sht: new RedDiagnose('verletzung_sht',
    'Schädel-Hirn-Trauma', GROUP_VERLETZUNG,
    [
      'neuro_vigilanzminderung',
      'neuro_ausfaelle',
      'neuro_kopfschmerz',
      'abdomen_uebelkeit',
      'neuro_1st_krampfanfall'
    ]
  ),
  verletzung_hws: new RedDiagnose('verletzung_hws',
    'Schleudertrauma (HWS)', GROUP_VERLETZUNG,
    [
      'neuro_ausfaelle',
      'verletzung_dms',
      'neuro_kopfschmerz',
      'neuro_schwindel'
    ]
  ),
  verletzung_fraktur: new RedDiagnose('verletzung_fraktur',
    'Fraktur', GROUP_VERLETZUNG,
    [
      'sonstige_schmerzen',
      'verletzung_schwellung',
      'verletzung_instabil',
      'verletzung_dms'
    ]
  ),
  verletzung_verbrennung: new RedDiagnose('verletzung_verbrennung',
    'Verbrennung', GROUP_VERLETZUNG,
    [
      'verletzung_blasenbildung',
      'sonstige_schmerzen',
      'sonstige_entzuendung',
      'sonstige_fieber'
    ]
  ),
  verletzung_unterkuehlung: new RedDiagnose('verletzung_unterkuehlung',
    'Unterkühlung', GROUP_VERLETZUNG,
    [
      'neuro_vigilanzminderung',
      'kardial_schwach',
      'sonstige_schuettelfrost'
    ]
  ),
  verletzung_hitzeersch: new RedDiagnose('verletzung_hitzeersch',
    'Hitzeerschöpfung', GROUP_VERLETZUNG,
    [
      'kardial_schwach',
      'abdomen_uebelkeit',
      'sonstige_schwitzen',
      'neuro_vigilanzminderung'
    ]
  ),

  kardial_acs: new RedDiagnose('kardial_acs',
    'ACS', GROUP_KARDIAL,
    [
      'kardial_brustschmerz',
      'lunge_atemnot',
      'kardial_schwach',
      'abdomen_uebelkeit'
    ]
  ),
  kardial_rhythmus: new RedDiagnose('kardial_rhythmus',
    'Herzrhythmusstörungen', GROUP_KARDIAL,
    [
      'kardial_herzrasen',
      'kardial_herzstolpern',
      'kardial_schwach',
      'kardial_brustschmerz',
      'lunge_atemnot',
      'neuro_vigilanzminderung'
    ]
  ),
  kardial_hypertonie: new RedDiagnose('kardial_hypertonie',
    'Hypertensive Krise', GROUP_KARDIAL,
    [
      'neuro_ausfaelle',
      'neuro_kopfschmerz',
      'neuro_schwindel',
      'kardial_brustschmerz',
      'kardial_schwach',
      'lunge_atemnot'
    ]
  ),
  kardial_insuff: new RedDiagnose('kardial_insuff',
    'Herzinsuffizienz', GROUP_KARDIAL,
    [
      'lunge_atemnot',
      'kardial_oedeme',
      'kardial_schwach'
    ]
  ),
  kardial_aortendissektion: new RedDiagnose('kardial_aortendissektion',
    'Aortendissektion', GROUP_KARDIAL,
    [
      'kardial_brustschmerz',
      'kardial_schwach',
      'neuro_ausfaelle'
    ]
  ),

  lunge_asthma: new RedDiagnose('lunge_asthma',
    'Asthmaanfall', GROUP_LUNGE,
    [
      'lunge_atemnot',
      'lunge_husten',
      'kardial_schwach'
    ]
  ),
  lunge_copd: new RedDiagnose('lunge_copd',
    'Exazerbierte COPD', GROUP_LUNGE,
    [
      'lunge_atemnot',
      'lunge_husten',
      'sonstige_fieber',
      'kardial_schwach',
      'neuro_vigilanzminderung'
    ]
  ),
  lunge_lungenembolie: new RedDiagnose('lunge_lungenembolie',
    'Lungenembolie', GROUP_LUNGE,
    [
      'lunge_atemnot',
      'kardial_brustschmerz',
      'kardial_schwach',
      'lunge_haemoptysen'
    ]
  ),
  lunge_pneumonie: new RedDiagnose('lunge_pneumonie',
    'Pneumonie', GROUP_LUNGE,
    [
      'lunge_atemnot',
      'lunge_husten',
      'sonstige_fieber',
      'sonstige_schuettelfrost',
      'kardial_schwach',
      'lunge_haemoptysen'
    ]
  ),

  neuro_tia: new RedDiagnose('neuro_tia',
    'TIA/Schlaganfall', GROUP_NEURO,
    [
      'neuro_ausfaelle',
      'neuro_vigilanzminderung',
      'neuro_schwindel',
      'neuro_kopfschmerz'
    ]
  ),
  neuro_krampf: new RedDiagnose('neuro_krampf',
    'Krampfanfall', GROUP_NEURO,
    [
      'neuro_rez_krampfanfall',
      'neuro_vigilanzminderung',
      'lunge_atemnot'
    ]
  ),
  neuro_hyperglyk: new RedDiagnose('neuro_hyperglyk',
    'Hyperglykämie', GROUP_NEURO,
    [
      'sonstige_durst',
      'sonstige_wasser',
      'abdomen_uebelkeit',
      'neuro_vigilanzminderung'
    ]
  ),
  neuro_hypoglyk: new RedDiagnose('neuro_hypoglyk',
    'Hypoglykämie', GROUP_NEURO,
    [
      'sonstige_schwitzen',
      'kardial_schwach',
      'neuro_vigilanzminderung',
      'neuro_1st_krampfanfall'
    ]
  ),
  neuro_migraene: new RedDiagnose('neuro_migraene',
    'Migräne', GROUP_NEURO,
    [
      'neuro_kopfschmerz',
      'neuro_ausfaelle',
      'neuro_schwindel',
      'abdomen_uebelkeit'
    ]
  ),
  neuro_alkohol: new RedDiagnose('neuro_alkohol',
    'Alkoholintoxikation', GROUP_NEURO,
    [
      'neuro_vigilanzminderung',
      'neuro_1st_krampfanfall',
      'abdomen_uebelkeit',
      'lunge_atemnot'
    ]
  ),

  abdomen_gallenkolik: new RedDiagnose('abdomen_gallenkolik',
    'Gallenkolik', GROUP_ABDOMEN,
    [
      'abdomen_bauchschmerz',
      'abdomen_ikterus',
      'sonstige_fieber'
    ]
  ),
  abdomen_akutes_abdomen: new RedDiagnose('abdomen_akutes_abdomen',
    'Akutes Abdomen', GROUP_ABDOMEN,
    [
      'abdomen_bauchschmerz',
      'abdomen_abwehrspannung',
      'abdomen_uebelkeit',
      'sonstige_fieber',
      'kardial_schwach'
    ]
  ),
  abdomen_gi_blutung: new RedDiagnose('abdomen_gi_blutung',
    'Gastrointestinale Blutung', GROUP_ABDOMEN,
    [
      'abdomen_bluterbrechen',
      'abdomen_blutstuhl',
      'kardial_schwach',
      'neuro_vigilanzminderung'
    ]
  ),
  abdomen_gastroenteritis: new RedDiagnose('abdomen_gastroenteritis',
    'Gastroenteritis', GROUP_ABDOMEN,
    [
      'abdomen_uebelkeit',
      'abdomen_durchfall',
      'abdomen_bauchschmerz',
      'sonstige_fieber',
      'kardial_schwach'
    ]
  ),

  uro_nierenkolik: new RedDiagnose('uro_nierenkolik',
    'Nierenkolik', GROUP_URO,
    [
      'uro_flankenschmerz',
      'abdomen_bauchschmerz',
      'sonstige_schmerzen',
      'uro_haematurie',
      'uro_harnverhalt',
      'sonstige_fieber',
      'sonstige_schuettelfrost'
    ]
  ),
  uro_harnverhalt: new RedDiagnose('uro_harnverhalt',
    'Harnverhalt/Harnwegsinfekt', GROUP_URO,
    [
      'uro_harnverhalt',
      'uro_flankenschmerz',
      'sonstige_schmerzen',
      'sonstige_fieber'
    ]
  ),

  verletzung_lumbago: new RedDiagnose('verletzung_lumbago',
    'Lumbago', GROUP_VERLETZUNG,
    [
      'sonstige_schmerzen',
      'verletzung_instabil',
      'verletzung_dms',
      'uro_harnverhalt',
      'uro_inkontinenz'
    ]
  ),

  sonstige_dehydr: new RedDiagnose('sonstige_dehydr',
    'Dehydratation', GROUP_MISC,
    [
      'kardial_schwach',
      'sonstige_durst',
      'uro_harnverhalt',
      'neuro_vigilanzminderung'
    ]
  ),
  sonstige_infekt: new RedDiagnose('sonstige_infekt',
    'Fieberhafter Infekt', GROUP_MISC,
    [
      'sonstige_fieberhoch',
      'sonstige_schuettelfrost',
      'sonstige_entzuendung',
      'kardial_schwach',
      'lunge_husten'
    ]
  ),
  sonstige_anaphyl: new RedDiagnose('sonstige_anaphyl',
    'Anaphylaxie', GROUP_MISC,
    [
      'verletzung_schwellung',
      'lunge_atemnot',
      'kardial_schwach'
    ]
  ),
  sonstige_panik: new RedDiagnose('sonstige_panik',
    'Panikattacke', GROUP_MISC,
    [
      'lunge_atemnot',
      'kardial_brustschmerz',
      'kardial_herzrasen',
      'neuro_schwindel'
    ]
  ),
  sonstige_epistaxis: new RedDiagnose('sonstige_epistaxis',
    'Starke Nasenblutung', GROUP_MISC,
    [
      'verletzung_blutung',
      'kardial_schwach'
    ]
  )


}
export function getAllRedDiagnoses(): Array<RedDiagnose> { return Object.values(RedDiagnoses) }

// ######################################################################################

export class RedCase {
  constructor(
    public id: string,
    public Name: string,
    public Consequences: string,
    public Group: RedFlagGroup,
    public DiagnoseIds: Array<string>,
  ) { }
}

// ######################################################################################

export const RedCases: Record<string, RedCase> = {
  kopfverletzung: new RedCase('kopfverletzung',
    'Kopfverletzung', 'Gefahr einer Hirnblutung mit bleibenden neurologischen Ausfällen oder Lebensgefahr',
    GROUP_VERLETZUNG,
    [
      'verletzung_wunde',
      'verletzung_sht'
    ]
  ),
  synkope: new RedCase('synkope',
    'Synkope', 'Gefahr erneuter Bewusstlosigkeit mit Sturz und gravierenden Verletzungen',
    GROUP_NEURO,
    [
      'kardial_acs',
      'kardial_rhythmus',
      'neuro_tia',
    ]
  ),
  brustschmerz: new RedCase('brustschmerz',
    'Brustschmerzen', 'Herzinfarkt, Gefäßverschluss oder Lungenembolie mit Gefahr plötzlicher Verschlechterung und Kreislaufstillstand',
    GROUP_KARDIAL,
    [
      'kardial_acs',
      'kardial_rhythmus',
      'lunge_lungenembolie',
      'kardial_aortendissektion'
    ]
  ),
  atemnot: new RedCase('atemnot',
    'Atemnot', 'Drohende respiratorische Erschöpfung mit Hypoxie, Bewusstseinsverlust und Kreislaufstillstand',
    GROUP_LUNGE,
    [
      'lunge_asthma',
      'lunge_copd',
      'lunge_pneumonie',
      'kardial_insuff',
      'kardial_acs'
    ]
  ),
  allergie: new RedCase('allergie',
    'Allergische Reaktion', 'rasch fortschreitende Schwellungen von Atemwegen und Kreislaufversagen',
    GROUP_MISC,
    [ 'sonstige_anaphyl' ]
  ),
  krampfanfall: new RedCase('krampfanfall',
    'Krampfanfall', 'erneute oder länger anhaltende Anfälle mit Risiko von Sturzverletzungen, Atemstörungen und bleibenden Hirnschäden',
    GROUP_NEURO,
    [
      'neuro_krampf',
      'neuro_hypoglyk',
      'neuro_alkohol'
    ]
  ),
  hypoglyk: new RedCase('hypoglyk',
    'Hypoglykämie', 'erneute schwere Unterzuckerung mit Risiko von Bewusstlosigkeit, Krampfanfällen und bleibenden neurologischen Schäden',
    GROUP_NEURO,
    [
      'neuro_hypoglyk'
    ]
  ),
  hyperglyk: new RedCase('hyperglyk',
    'Hyperglykämie', 'schwerer, unbehandelter Blutzuckeranstieg mit Risiko von Austrocknung, Elektrolytverschiebungen, Ketoazidose oder diabetischem Koma',
    GROUP_NEURO,
    [
      'neuro_hyperglyk'
    ]
  ),
  verbrennung: new RedCase('verbrennung',
    'Verbrennung (1-2°)', 'zunehmende Wundinfektion mit Fieber, Narbenbildung oder Funktionsstörungen, Gefahr einer tiefergehenden Gewebeschädigung',
    GROUP_VERLETZUNG,
    [
      'verletzung_verbrennung'
    ]
  ),
  stromunfall: new RedCase('stromunfall',
    'Stromunfall', 'verzögert einsetzende Herzrhythmusstörungen oder Organverletzungen mit Gefahr von Bewusstlosigkeit, Herzstillstand und inneren Schäden',
    GROUP_VERLETZUNG,
    [
      'kardial_rhythmus',
      'verletzung_verbrennung'
    ]
  ),
  nasenbluten: new RedCase('nasenbluten',
    'Nasenblutung', 'wiederkehrende Blutungen mit Risiko von Kreislaufproblemen oder Aspiration von Blut',
    GROUP_MISC,
    [ 'sonstige_epistaxis' ]
  ),
  hexenschuss: new RedCase('hexenschuss',
    'Akuter Rückenschmerz', 'zunehmende Nervenkompression mit Risiko von Lähmungen, Taubheitsgefühl oder Blasen-/Mastdarmfunktionsstörungen (Cauda-Syndrom)',
    GROUP_VERLETZUNG,
    [
      'verletzung_lumbago'
    ]
  ),
  bauchschmerzen: new RedCase('bauchschmerzen',
    'Bauchschmerzen', 'akute Baucherkrankungen (z.B. Entzündung, Blutung oder Durchbruch) mit Risiko von inneren Blutungen, Infektion/Sepsis oder Kreislaufversagen',
    GROUP_ABDOMEN,
    [
      'abdomen_akutes_abdomen',
      'abdomen_gi_blutung',
      'abdomen_gallenkolik',
      'abdomen_gastroenteritis',
      'uro_nierenkolik'
    ]
  )
}
export function getAllRedCases(): Array<RedCase> { return Object.values(RedCases) }
