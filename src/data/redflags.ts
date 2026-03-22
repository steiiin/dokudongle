export type RedflagCategory = 'trauma' | 'atmung' | 'kreislauf' | 'neuro' | 'intox' | 'gastro' | 'infekt' | 'hno' | 'psych' | 'gyn'
export type RedflagApplication = 'Verweigerung' | 'BvO'

// ######################################################################################

type SignalId = typeof Signals[number]['id']

// ######################################################################################

export class RedflagSignal {
  constructor(
    public id: string,
    public name: string,
    public subtitle: string,
    public text: string,
  ) { }
}

// ######################################################################################

// TODO: add _SignalDefs
export const _SignalDefs = [

  defSg(
    'allgemein-ausschlag-ausbreitung-allgemein',
    'Ausschlag (Ausbreitung)',
    'Ausbreitung von Ausschlag'),

  defSg(
    'allgemein-fieber-allgemein',
    'Fieber (allgemein)',
    'Fieber'),

  defSg(
    'allgemein-infektzeichen-allgemein',
    'Infektzeichen (allgemein)',
    'Infektzeichen'),

  defSg(
    'allgemein-therapieversagen-bedarf-allgemein',
    'Therapieversagen (bedarf)',
    'fehlenden Wirkung der Bedarfsmedikation'),

  defSg(
    'atmung-atemproblem-neu-allgemein',
    'Atemproblem (neu)',
    'neuem Atemproblem (Luftnot/Stridor/Heiserkeit/Schluckbeschwerden)'),

  defSg(
    'atmung-atemproblem-zunehmend-allgemein',
    'Atemproblem (zunehmend)',
    'zunehmendem Atemproblem (Schwellung/Luftnot/Schluckbeschwerden)'),

  defSg(
    'atmung-luftnot-allgemein',
    'Luftnot (allgemein)',
    'Luftnot'),

  defSg(
    'atmung-luftnot-anhaltend-allgemein',
    'Luftnot (anhaltend)',
    'anhaltender Luftnot/Schwäche >24h'),

  defSg(
    'atmung-luftnot-zunehmend-allgemein',
    'Luftnot (zunehmend)',
    'erneuter/zunehmender Luftnot'),

  defSg(
    'atmung-sprechdyspnoe-allgemein',
    'Sprechdyspnoe (allgemein)',
    'Sprechdyspnoe'),

  defSg(
    'atmung-thoraxschmerz-atemabhaengig-anhaltend',
    'Thoraxschmerz (anhaltend / atemabhängig)',
    'anhaltenden Schmerzen bei Husten/tiefer Inspiration>48h'),

  defSg(
    'atmung-thoraxschmerz-atemabhaengig-zunehmend',
    'Thoraxschmerz (zunehmend / atemabhängig)',
    'zunehmenden atemabhängigen Thoraxschmerzen'),

  defSg(
    'bewegung-fehlstellung-allgemein',
    'Fehlstellung (allgemein)',
    'Fehlstellung'),

  defSg(
    'bewegung-funktionseinschraenkung-allgemein',
    'Funktionseinschränkung (allgemein)',
    'funktioneller Einschränkung'),

  defSg(
    'entzuendung-zeichen-zunehmend-allgemein',
    'Entzündung (zunehmend)',
    'zunehmender Entzündung (Schmerz/Rötung/Überwärmung/eitrige Sekretion)'),

  defSg(
    'gastrointestinal-beschwerden-anhaltend-allgemein',
    'Gastrointestinale Beschwerden (anhaltend)',
    'anhaltenden gastrointestinalen Beschwerden (Übelkeit/Erbrechen/Schmerzen)'),

  defSg(
    'gastrointestinal-beschwerden-neu-allgemein',
    'Gastrointestinale Beschwerden (neu)',
    'neuen gastrointestinalen Beschwerden (Übelkeit/Schmerzen)'),

  defSg(
    'haut-nekrose-allgemein',
    'Hautnekrose (allgemein)',
    'Hautnekrosen'),

  defSg(
    'haut-reaktion-anhaltend-allgemein',
    'Hautreaktion (anhaltend)',
    'anhaltender Hautreaktion/Juckreiz >24h'),

  defSg(
    'kreislauf-probleme-allgemein',
    'Kreislaufprobleme (allgemein)',
    'Kreislaufproblemen'),

  defSg(
    'kreislauf-probleme-neu-allgemein',
    'Kreislaufprobleme (neu)',
    'neuen Kreislaufproblemen (Schwindel/Herzrasen/Schwäche)'),

  defSg(
    'kreislauf-probleme-zunehmend-allgemein',
    'Kreislaufprobleme (zunehmend)',
    'zunehmenden Kreislaufproblemen (Schwindel/Schwäche)'),

  defSg(
    'neurologisch-dms-stoerung-neu-allgemein',
    'DMS-Störung (neu)',
    'neuer DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neurologisch-vigilanzminderung-allgemein',
    'Vigilanzminderung (neu)',
    'Bewusstseinseintrübung'),

  defSg(
    'peripherie-dms-stoerung-zunehmend-allgemein',
    'DMS-Störung (zunehmend)',
    'zunehmender DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'schmerz-anhaltend-allgemein',
    'Schmerzen (anhaltend)',
    'anhaltenden Schmerzen/Rötung >48h'),

  defSg(
    'schmerz-anhaltend-belastung',
    'Schmerzen (anhaltend / belastung)',
    'anhaltenden Belastungs-/Bewegungsschmerzen >48h'),

  defSg(
    'schmerz-passive-dehnung-allgemein',
    'Schmerzen (passive Dehnung)',
    'Schmerz bei passiver Dehnung'),

  defSg(
    'schmerz-zunehmend-allgemein',
    'Schmerzen (zunehmend)',
    'zunehmenden starken Schmerzen'),

  defSg(
    'schmerz-zunehmend-belastung',
    'Schmerzen (zunehmend / belastung)',
    'zunehmender Belastungs-/Bewegungsschmerzen'),

  defSg(
    'schmerz-zunehmend-ruhe',
    'Schmerzen (zunehmend / ruhe)',
    'zunehmenden Schmerzen trotz Ruhigstellung'),

  defSg(
    'schwellung-haematom-anhaltend',
    'Schwellung/Hämatom (anhaltend)',
    'anhaltender Schwellung/Hämatom'),

  defSg(
    'schwellung-zunehmend-allgemein',
    'Schwellung (zunehmend)',
    'zunehmender Schwellung/Spannung'),

  defSg(
    'wunde-heilung-verzoegert-allgemein',
    'Wundheilung (verzögert)',
    'verzögerter Wundheilung'),

  defSg(
    'wunde-nachblutung-allgemein',
    'Nachblutung (allgemein)',
    'Nachblutung/Durchbluten des Verbandes'),

] as const

export const _SignalTextsById: Record<SignalId, string> = Object.fromEntries(
  _SignalDefs.map(s => [s.id, s.text])
) as Record<SignalId, string>

export const Signals: RedflagSignal[] = _SignalDefs.map(
  s => new RedflagSignal(s.id, s.name, s.subtitle, s.text)
)
// ######################################################################################

export class RedflagScenario {
  constructor(
    public id: string,
    public name: string,
    public requirements: string,
    public application: RedflagApplication,
    public category: RedflagCategory,
    public majorSignals: string[],
    public minorSignals: string[],
    public diagnoses: string[] = [],
    public consequences: string = '',
  ) { }
}

// ######################################################################################

export const Scenarios: Array<RedflagScenario> = [

  /////////////////////////////////////////////////////////
  // Verletzungen
  /////////////////////////////////////////////////////////

  defSc(
    'Extremitätenverletzung (leicht)', 'Keine Fehlstellung, DMS intakt',
    'BvO', 'trauma',
    [
      'schmerz-zunehmend-ruhe',
      'neurologisch-dms-stoerung-neu-allgemein',
      'schwellung-zunehmend-allgemein',
      'bewegung-fehlstellung-allgemein'
    ],
    [
      'schmerz-anhaltend-belastung',
      'schwellung-haematom-anhaltend',
      'bewegung-funktionseinschraenkung-allgemein',
    ],
    [
      'okkulter Fraktur',
      'Band-/Sehnenverletzung',
      'neurovaskulärer Komplikation/Kompartmentsyndrom',
    ],
  ),
  defSc(
    'Extremitätenverletzung (schwer)', 'Fehlstellung, DMS gestört',
    'Verweigerung', 'trauma',
    [
      'peripherie-dms-stoerung-zunehmend-allgemein',
      'schmerz-zunehmend-allgemein',
      'schmerz-zunehmend-belastung',
      'haut-nekrose-allgemein',
      'kreislauf-probleme-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'schmerz-anhaltend-belastung',
      'schwellung-haematom-anhaltend',
      'bewegung-funktionseinschraenkung-allgemein',
    ],
    [
      'Fraktur',
      'Kompartmentsyndrom',
      'Gefäßläsion',
      'Luxation',
      'Weichteilverletzung/Blutung',
    ],
    'irreversiblen Nerv- und Gefäßschäden bis hin zu Extremitätenverlust oder lebensbedrohlicher Blutung'
  ),

  defSc(
    'Offene Wunde (leicht)', 'Blutung gestillt, DMS intakt',
    'BvO', 'trauma',
    [
      'wunde-nachblutung-allgemein',
      'neurologisch-dms-stoerung-neu-allgemein',
      'entzuendung-zeichen-zunehmend-allgemein',
      'allgemein-fieber-allgemein',
    ],
    [
      'schmerz-anhaltend-allgemein',
      'wunde-heilung-verzoegert-allgemein',
    ],
  ),
  defSc(
    'Offene Wunde (schwer)', 'Naht nötig, Durchblutung, DMS gestört',
    'Verweigerung', 'trauma',
    [
      'peripherie-dms-stoerung-zunehmend-allgemein',
      'schmerz-anhaltend-belastung',
      'schwellung-zunehmend-allgemein',
      'allgemein-fieber-allgemein',
      'kreislauf-probleme-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'schmerz-anhaltend-allgemein',
      'wunde-heilung-verzoegert-allgemein',
    ],
    [
      'tiefer Weichteilverletzung',
      'Gefäßläsion',
      'Kompartmentsyndrom',
      'Wundinfektion',
      'Fraktur',
    ],
    'schwerer Infektionen oder irreversibler Gefäß-/Nervenschäden bis hin zu Extremitätsverlust'
  ),

  defSc(
    'Thoraxprellung (leicht)', 'Bagatelltrauma, kein Luftnot',
    'BvO', 'trauma',
    [
      'atmung-luftnot-allgemein',
      'atmung-sprechdyspnoe-allgemein',
      'kreislauf-probleme-neu-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'atmung-thoraxschmerz-atemabhaengig-zunehmend',
      'atmung-thoraxschmerz-atemabhaengig-anhaltend',
    ],
  ),
  defSc(
    'Thoraxtrauma (schwer)', 'Luftnot, zunehmende Schmerzen',
    'Verweigerung', 'trauma',
    [
      'atmung-luftnot-zunehmend-allgemein',
      'atmung-sprechdyspnoe-allgemein',
      'kreislauf-probleme-zunehmend-allgemein'
    ],
    [],
  ),

  defSc(
    'Verbrennung/Verbrühung (leicht)', 'Grad I, nicht an Hand/Fuß/Gesicht, kein Rauchgas',
    'BvO', 'trauma',
    [],
    [],
  ),
  defSc(
    'Verbrennung/Verbrühung (schwer)', 'Grad > I, flächig',
    'Verweigerung', 'trauma',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Rauchgasexposition (leicht)', 'kurzzeitige Exposition, keinerlei Symptome',
    'BvO', 'trauma',
    [],
    [],
  ),
  defSc(
    'Rauchgasinhalation (schwer)', 'Ruß an Nase, Luftnot',
    'Verweigerung', 'trauma',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Kopfverletzung (leicht)', 'keine SHT-Zeichen, Überwachung möglich',
    'BvO', 'trauma',
    [],
    [],
  ),
  defSc(
    'Kopfverletzung (schwer)', 'SHT-Zeichen, OAK/TAH',
    'Verweigerung', 'trauma',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // Atmung
  /////////////////////////////////////////////////////////

  defSc(
    'Asthma/COPD (leicht)', 'Therapieerfolg, Pat. wach, kein C-Problem',
    'BvO', 'atmung',
    [
      'atmung-luftnot-zunehmend-allgemein',
      'atmung-sprechdyspnoe-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'allgemein-infektzeichen-allgemein',
      'allgemein-therapieversagen-bedarf-allgemein',
    ],
  ),
  defSc(
    'Asthma/COPD (schwer)', 'fehlende Besserung, Erschöpfung',
    'Verweigerung', 'atmung',
    [
      'atmung-luftnot-zunehmend-allgemein',
      'kreislauf-probleme-zunehmend-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'atmung-luftnot-anhaltend-allgemein',
      'allgemein-therapieversagen-bedarf-allgemein',
    ],
    [
      'Exazerbation', 'Resp. Erschöpfung', 'Pneumonie', 'Pneumothorax', 'LAE'
    ],
    'zunehmender respiratorischer Erschöpfung bis hin zum Atemstillstand',
  ),

  defSc(
    'Allergische Reaktion (leicht)', 'Stadium I, nur Hautreaktion, kein A/B/C-Problem',
    'BvO', 'atmung',
    [
      'atmung-atemproblem-neu-allgemein',
      'kreislauf-probleme-neu-allgemein',
      'allgemein-ausschlag-ausbreitung-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'haut-reaktion-anhaltend-allgemein',
      'gastrointestinal-beschwerden-neu-allgemein',
    ],
  ),
  defSc(
    'Anaphylaxie (schwer)', 'Stadium > I, A/B/C-Problem, Rückfallgefahr',
    'Verweigerung', 'atmung',
    [
      'atmung-atemproblem-zunehmend-allgemein',
      'kreislauf-probleme-zunehmend-allgemein',
      'neurologisch-vigilanzminderung-allgemein',
    ],
    [
      'haut-reaktion-anhaltend-allgemein',
      'gastrointestinal-beschwerden-anhaltend-allgemein',
    ],
    [
      'Anaphylaxie', 'Schock', 'Larynxödem', 'verzögerte Systemische Reaktion',
    ],
    'erneuter/zunehmender anaphylaktischer Reaktion mit Atemwegsverlegung oder Schock bis zum Kreislaufversagen',
  ),

  /////////////////////////////////////////////////////////
  // Kreislauf
  /////////////////////////////////////////////////////////

  defSc(
    'Thoraxschmerz, nicht-traumatisch (leicht)', 'klar reproduzierbar, keine Luftnot, lokal',
    'BvO', 'kreislauf',
    [],
    [],
  ),
  defSc(
    'Thoraxschmerz, nicht-traumatisch (schwer)', 'nicht reproduzierbar, Luftnot, Ausstrahlung',
    'Verweigerung', 'kreislauf',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Palpitationen/Herzrasen (leicht)', 'kein Brustschmerz/Luftnot/Kreislaufproblem',
    'BvO', 'kreislauf',
    [],
    [],
  ),
  defSc(
    'Palpitationen/Herzrasen (schwer)', 'Brustschmerz/Luftnot, Schwindel, Fieber',
    'Verweigerung', 'kreislauf',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Blutdruckstörung (leicht)', 'kein Brustschmerz/Luftnot/Kreislaufproblem',
    'BvO', 'kreislauf',
    [],
    [],
  ),
  defSc(
    'Hypertensive Krise (schwer)', 'Zeichen Organschaden',
    'Verweigerung', 'kreislauf',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // Neuro
  /////////////////////////////////////////////////////////

  defSc(
    'Akute Verwirrtheit/Delir', '',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Rückenschmerz, nicht-traumatisch (leicht)', 'ohne Parese, keine Entleerungsstörung',
    'BvO', 'neuro',
    [],
    [],
  ),
  defSc(
    'Rückenschmerz, nicht-traumatisch (schwer)', 'beidseitige neurol. Ausfälle, Entleerungsstörung',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Schwindel (leicht)', 'Lageabhängig, keine neurol. Ausfälle',
    'BvO', 'neuro',
    [],
    [],
  ),
  defSc(
    'Schwindel (schwer)', 'neurol. Ausfälle',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Synkope', 'unklare Genese/erstmalig',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Hypoglykämie (leicht)', 'nach Therapie orientiert, Selbstkontrolle möglich',
    'BvO', 'neuro',
    [],
    [],
  ),
  defSc(
    'Hypoglykämie (schwer)', 'fehlende Besserung, keine sichere Selbstkontrolle',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Krampfanfall (bekanntes Muster)', 'bek. Epilepsie, bek. Muster, vollständige Erholung',
    'BvO', 'neuro',
    [],
    [],
  ),
  defSc(
    'Krampfanfall (neues Muster)', 'prolongiert, fehlende Erholung, Serienanfall',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),
  defSc(
    'Krampfanfall (unklar/erstmalig)', 'Status, erstmaliges Auftreten',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Schlaganfall/TIA', '',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Akute Sehstörung', '',
    'Verweigerung', 'neuro',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // Intox
  /////////////////////////////////////////////////////////

  defSc(
    'Alkoholintoxikation (leicht)', 'Anruf durch Dritte, keine Eigengefährdung',
    'BvO', 'intox',
    [],
    [],
  ),
  defSc(
    'Alkoholintoxikation (schwer)', 'Vigilanzminderung, Eigen-/Fremdgefährdung',
    'Verweigerung', 'intox',
    [],
    [],
    [],
    '',
  ),
  defSc(
    'Intoxikation (unklar)', 'Vigilanzminderung, A/B/C-Problem',
    'Verweigerung', 'intox',
    [],
    [],
    [],
    '',
  ),


  /////////////////////////////////////////////////////////
  // Gastro
  /////////////////////////////////////////////////////////

  defSc(
    'Gastroenteritis (leicht)', 'keine/leichte Schmerzen, keine GIB, keine Dehydratation',
    'BvO', 'gastro',
    [],
    [],
  ),
  defSc(
    'Gastroenteritis (schwer)', 'Blutbeimengung, Schwindel/Kollaps, Dehydratation',
    'Verweigerung', 'gastro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Bauchschmerzen (leicht)', 'leichte Schmerzen, keine GIB, keine Abwehrspannung',
    'BvO', 'gastro',
    [],
    [],
  ),
  defSc(
    'Bauchschmerzen (schwer)', 'Blutbeimengung, Schwindel/Kollaps, akute/starke Schmerzen',
    'Verweigerung', 'gastro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Gastrointestinale Blutung', '',
    'Verweigerung', 'gastro',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // Infekt
  /////////////////////////////////////////////////////////

  defSc(
    'Fieberhafter Infekt (leicht)', 'kreislaufstabil, keine Luftnot, orientiert',
    'BvO', 'infekt',
    [],
    [],
  ),
  defSc(
    'Fieber/Infekt/Sepsis', 'Luftnot, Verwirrtheit, Dehydratation',
    'Verweigerung', 'infekt',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // HNO
  /////////////////////////////////////////////////////////

  defSc(
    'Nasenbluten (leicht)', 'Blutung gestillt, kreislaufstabil',
    'BvO', 'hno',
    [],
    [],
  ),
  defSc(
    'Nasenbluten (schwer)', 'anhaltend/starke Blutung, Kreislaufproblem, Traumaassoziiert',
    'Verweigerung', 'hno',
    [],
    [],
    [],
    '',
  ),

  /////////////////////////////////////////////////////////
  // Psych
  /////////////////////////////////////////////////////////

  defSc(
    'Panikattacke/Hyperventilation (leicht)', 'Besserung nach Beruhigung/Atemanleitung',
    'BvO', 'psych',
    [],
    [],
  ),

  /////////////////////////////////////////////////////////
  // Gynäkologie
  /////////////////////////////////////////////////////////

  defSc(
    'Vaginale Blutung (leicht)', 'keine Kreislaufprobleme, keine/leichte Schmerzen',
    'BvO', 'gyn',
    [],
    [],
  ),
  defSc(
    'Vaginale Blutung (schwer)', 'Kreislaufprobleme, starke Schmerzen',
    'Verweigerung', 'gyn',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Schwangerschaftsblutung', '',
    'Verweigerung', 'gyn',
    [],
    [],
    [],
    '',
  ),
  defSc(
    'Fehlende Kindsbewegungen', '',
    'Verweigerung', 'gyn',
    [],
    [],
    [],
    '',
  ),
  defSc(
    'Präeklampsie-Warnzeichen', 'Bluthochdruck, Sehstörung, Erbrechen, Ödeme',
    'Verweigerung', 'gyn',
    [],
    [],
    [],
    '',
  ),


] as const

// ######################################################################################

function genKey(
  cat: string,
  name: string
) {
  return cat + name.replace(/[\/(]/g, '_').replace(/[ \-)]/gi, '')
}

function defSc(
  name: string,
  requirements: string,
  application: RedflagApplication,
  category: RedflagCategory,
  majorSignalIds: SignalId[],
  minorSignalIds: SignalId[],
  diagnoses: string[] = [],
  consequences: string = '',
) {
  const key = genKey(category, name)
  return new RedflagScenario(
    key, name,
    requirements,
    application,
    category,
    majorSignalIds.map(id => _SignalTextsById[id]),
    minorSignalIds.map(id => _SignalTextsById[id]),
    diagnoses,
    consequences,
  )
}

function defSg<const Id extends string>(
  id: Id,
  name: string,
  text: string
) {
  return {
    id,
    name,
    subtitle: text,
    text,
  } as const
}