export type RedflagCategory = 'trauma' | 'atmung' | 'kreislauf' | 'neuro' | 'intox' | 'gastro' | 'infekt' | 'hno' | 'psych' | 'gyn'
export type RedflagApplication = 'Verweigerung' | 'BvO'

// ######################################################################################

type SignalId = typeof Signals[number]['id']

// ######################################################################################

export class RedflagSignal {
  constructor(
    public id: string,
    public text: string,
  ) { }
}

// ######################################################################################

// TODO: add _SignalDefs
export const _SignalDefs = [

  defSg(
    'atmung-auswurfRuss',
    'rußiger Auswurf'),

  defSg(
    'atmung-luftnot',
    'Luftnot'),

  defSg(
    'atmung-luftnot-neu',
    'Atembeschwerden (Luftnot/Stridor/Heiserkeit/Schluckbeschwerden)'),

  defSg(
    'atmung-luftnot-zunehmend',
    'zunehmenden Atembeschwerden (Schwellung/Luftnot/Schluckbeschwerden)'),

  defSg(
    'atmung-luftnotSchwaeche-anhaltend',
    'anhaltender Luftnot/Schwäche >24h'),

  defSg(
    'atmung-luftnot-rezidiv-zunehmend',
    'erneuter/zunehmender Luftnot'),

  defSg(
    'atmung-schleimhautreizung-anhaltend',
    'anhaltenden Halschmerzen/Reizhusten'),

  defSg(
    'atmung-sprechdyspnoe',
    'Sprechdyspnoe'),

  defSg(
    'atmung-atemabhaengigerSchmerz-anhaltend',
    'anhaltenden Schmerzen bei Husten/tiefer Inspiration>48h'),

  defSg(
    'atmung-atemabhaengigerSchmerz-zunehmend',
    'zunehmenden atemabhängigen Thoraxschmerzen'),

  defSg(
    'bewegung-fehlstellung',
    'Fehlstellung'),

  defSg(
    'bewegung-funktionseinschraenkung',
    'funktioneller Einschränkung'),

  defSg(
    'gastro-erbrechen-neu',
    'anhaltendem Erbrechen'),

  defSg(
    'gastro-beschwerden-anhaltend',
    'anhaltenden gastrointestinalen Beschwerden (Übelkeit/Erbrechen/Schmerzen)'),

  defSg(
    'gastro-beschwerden-neu',
    'Magen-Darm-Beschwerden (Übelkeit/Schmerzen)'),

  defSg(
    'haut-ausschlag-zunehmend',
    'Ausbreitung von Ausschlag'),

  defSg(
    'haut-entzuendungzeichen-zunehmend',
    'zunehmender Entzündung (Schmerz/Rötung/Überwärmung/eitrige Sekretion)'),

  defSg(
    'haut-nekrose',
    'Hautnekrosen'),

  defSg(
    'haut-ausschlagJuckreiz-anhaltend',
    'anhaltender Hautreaktion/Juckreiz >24h'),

  defSg(
    'haut-verbrennung-zunehmend',
    'Ausdehnung der Rötung'),

  defSg(
    'haut-blasenbildung-neu',
    'Blasenbildung'),

  defSg(
    'infekt-fieber',
    'Fieber'),

  defSg(
    'infekt-infektzeichen',
    'Infektzeichen'),

  defSg(
    'kreislauf-probleme',
    'Kreislaufproblemen'),

  defSg(
    'kreislauf-probleme-neu',
    'Kreislaufbeschwerden (Schwindel/Herzrasen/Schwäche)'),

  defSg(
    'kreislauf-probleme-zunehmend',
    'zunehmenden Kreislaufbeschwerden (Schwindel/Schwäche)'),

  defSg(
    'neuro-dms-neu',
    'einer DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-dms-zunehmend',
    'zunehmender DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-ausfall-neu',
    'neurol. Ausfällen (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-kopfschmerz-neu',
    'Kopfschmerzen'),

  defSg(
    'neuro-kopfschmerz-zunehmend',
    'zunehmende Kopfschmerzen'),

  defSg(
    'neuro-schwindel',
    'Schwindel'),

  defSg(
    'neuro-kopfschmerzSchwindel-anhaltend',
    'anhaltenden Kopfschmerzen/Schwindel >12h'),

  defSg(
    'neuro-muedigkeit-anhaltend',
    'anhaltender Müdigkeit >48h'),

  defSg(
    'neuro-vigilanzminderung',
    'Bewusstseinseintrübung'),

  defSg(
    'schmerzRoetung-anhaltend',
    'anhaltenden Schmerzen/Rötung >48h'),

  defSg(
    'schmerzBelastung-anhaltend',
    'anhaltenden Belastungs-/Bewegungsschmerzen >48h'),

  defSg(
    'schmerzStark-zunehmend',
    'zunehmenden starken Schmerzen'),

  defSg(
    'schmerzBelastung-zunehmend',
    'zunehmender Belastungs-/Bewegungsschmerzen'),

  defSg(
    'schmerzRuhigstellung-zunehmend',
    'zunehmenden Schmerzen trotz Ruhigstellung'),

  defSg(
    'schmerzAnalgesie-zunehmend',
    'zunehmenden Schmerzen trotz Analgesie'),

  defSg(
    'haut-schwellungHaematom-anhaltend',
    'anhaltender Schwellung/Hämatom'),

  defSg(
    'haut-schwellungSpannung-zunehmend',
    'zunehmender Schwellung/Spannung'),

  defSg(
    'sonstige-bedarfsmedOhneWirkung',
    'fehlenden Wirkung der Bedarfsmedikation'),

  defSg(
    'wunde-heilverzoegerung',
    'verzögerter Wundheilung'),

  defSg(
    'wunde-nachblutung',
    'Nachblutung/Durchbluten des Verbandes'),

] as const

export const _SignalTextsById: Record<SignalId, string> = Object.fromEntries(
  _SignalDefs.map(s => [s.id, s.text])
) as Record<SignalId, string>

export const Signals: RedflagSignal[] = _SignalDefs.map(
  s => new RedflagSignal(s.id, s.text)
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
      'schmerzRuhigstellung-zunehmend',
      'neuro-dms-neu',
      'haut-schwellungSpannung-zunehmend',
      'bewegung-fehlstellung'
    ],
    [
      'schmerzBelastung-anhaltend',
      'haut-schwellungHaematom-anhaltend',
      'bewegung-funktionseinschraenkung',
    ],
    [
      'okkulter Fraktur', 'Band-/Sehnenverletzung',
      'Weichteilverletzung/Blutung', 'Kompartmentsyndrom',
    ],
  ),
  defSc(
    'Extremitätenverletzung (schwer)', 'Fehlstellung, DMS gestört',
    'Verweigerung', 'trauma',
    [
      'neuro-dms-zunehmend',
      'schmerzStark-zunehmend',
      'schmerzBelastung-zunehmend',
      'haut-nekrose',
      'kreislauf-probleme',
      'neuro-vigilanzminderung',
    ],
    [
      'schmerzBelastung-anhaltend',
      'haut-schwellungHaematom-anhaltend',
      'bewegung-funktionseinschraenkung',
    ],
    [
      'Fraktur', 'Luxation',
      'Weichteilverletzung/Blutung', 'Kompartmentsyndrom',
    ],
    'irreversiblen Nerv- und Gefäßschäden bis hin zu Extremitätenverlust oder lebensbedrohlicher Blutung'
  ),

  defSc(
    'Offene Wunde (leicht)', 'Blutung gestillt, DMS intakt',
    'BvO', 'trauma',
    [
      'wunde-nachblutung',
      'neuro-dms-neu',
      'haut-entzuendungzeichen-zunehmend',
      'infekt-fieber',
    ],
    [
      'schmerzRoetung-anhaltend',
      'wunde-heilverzoegerung',
    ],
    [
      'Wundinfektion',
    ],
  ),
  defSc(
    'Offene Wunde (schwer)', 'Naht nötig, Durchblutung, DMS gestört',
    'Verweigerung', 'trauma',
    [
      'neuro-dms-zunehmend',
      'schmerzBelastung-anhaltend',
      'haut-schwellungSpannung-zunehmend',
      'infekt-fieber',
      'kreislauf-probleme',
      'neuro-vigilanzminderung',
    ],
    [
      'schmerzRoetung-anhaltend',
      'wunde-heilverzoegerung',
    ],
    [
      'Fraktur',
      'tiefer Weichteilverletzung', 'Kompartmentsyndrom',
      'Wundinfektion',
    ],
    'schwerer Infektionen oder irreversibler Gefäß-/Nervenschäden bis hin zu Extremitätsverlust'
  ),

  defSc(
    'Thoraxprellung (leicht)', 'Bagatelltrauma, kein Luftnot',
    'BvO', 'trauma',
    [
      'atmung-luftnot',
      'atmung-sprechdyspnoe',
      'kreislauf-probleme-neu',
      'neuro-vigilanzminderung',
    ],
    [
      'atmung-atemabhaengigerSchmerz-zunehmend',
      'atmung-atemabhaengigerSchmerz-anhaltend',
    ],
    [
      'Rippenverletzung',
    ],
  ),
  defSc(
    'Thoraxtrauma (schwer)', 'Luftnot, zunehmende Schmerzen',
    'Verweigerung', 'trauma',
    [
      'atmung-luftnot-rezidiv-zunehmend',
      'atmung-sprechdyspnoe',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'schmerzRuhigstellung-zunehmend',
      'atmung-luftnotSchwaeche-anhaltend',
    ],
    [
      'Pneumothorax', 'Lungenkonstusion', 'Rippenfraktur'
    ],
    'einer unerkannten Verletzung mit möglicher rascher respiratorischer Dekompensation',
  ),

  defSc(
    'Verbrennung/Verbrühung (leicht)', 'Grad I, nicht an Hand/Fuß/Gesicht, kein Rauchgas',
    'BvO', 'trauma',
    [
      'schmerzAnalgesie-zunehmend',
      'haut-verbrennung-zunehmend',
      'haut-blasenbildung-neu',
      'kreislauf-probleme-neu',
    ],
    [
      'schmerzRoetung-anhaltend',
      'infekt-infektzeichen',
      'wunde-heilverzoegerung',
    ],
    [
      'Verbrennung', 'Wundinfektion',
    ],
  ),
  defSc(
    'Verbrennung/Verbrühung (schwer)', 'Grad > I, flächig',
    'Verweigerung', 'trauma',
    [
      'kreislauf-probleme-zunehmend',
      'atmung-luftnot-zunehmend',
      'haut-schwellungSpannung-zunehmend',
      'neuro-dms-neu',
    ],
    [
      'schmerzAnalgesie-zunehmend',
      'infekt-infektzeichen',
      'bewegung-funktionseinschraenkung',
    ],
    [
      'Verbrennung', 'Dehydratation', 'Inhalationstrauma', 'Wundinfektion'
    ],
    'irreparablen Weichteilverletzungen oder Entwicklung eines Schocks mit vitaler Gefährdung innerhalb weniger Stunden',
  ),

  defSc(
    'Rauchgasexposition (leicht)', 'kurzzeitige Exposition, keinerlei Symptome',
    'BvO', 'trauma',
    [
      'atmung-luftnot-neu',
      'neuro-vigilanzminderung',
      'neuro-kopfschmerz-neu',
      'neuro-schwindel',
      'atmung-auswurfRuss',
    ],
    [
      'atmung-schleimhautreizung-anhaltend',
    ],
    [
      'CO-Vergiftung', 'Atemwegsschädigung',
    ],
  ),
  defSc(
    'Rauchgasinhalation (schwer)', 'Ruß an Nase, Luftnot',
    'Verweigerung', 'trauma',
    [
      'atmung-luftnot-zunehmend',
      'neuro-vigilanzminderung',
      'neuro-kopfschmerz-zunehmend',
      'neuro-schwindel',
      'gastro-erbrechen-neu',
    ],
    [
      'atmung-schleimhautreizung-anhaltend',
    ],
    [
      'CO-Vergiftung', 'Atemwegsschädigung',
      'verzögertem Schleimhautödem', 'Cyanidvergiftung',
    ],
    'rascher Atemwegsschwellung bis zur Erstickung oder vergiftungsbedingter Hypoxie bis hin zum Tod',
  ),

  defSc(
    'Kopfverletzung (leicht)', 'keine SHT-Zeichen, Überwachung möglich',
    'BvO', 'trauma',
    [
      'neuro-vigilanzminderung',
      'gastro-erbrechen-neu',
      'neuro-ausfall-neu',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'neuro-kopfschmerzSchwindel-anhaltend',
      'neuro-muedigkeit-anhaltend',
    ],
    [
      'SHT', 'Hirnblutung',
      'HWS-Distorsion',
    ],
  ),
  defSc(
    'Kopfverletzung (schwer)', 'SHT-Zeichen, OAK/TAH',
    'Verweigerung', 'trauma',
    [
      'neuro-vigilanzminderung',
      'gastro-erbrechen-neu',
      'neuro-ausfall-neu',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'neuro-kopfschmerzSchwindel-anhaltend',
      'neuro-muedigkeit-anhaltend',
    ],
    [
      'SHT', 'Hirnblutung',
      'HWS-Distorsion',
    ],
    'unerkannte intrakranielle Blutung mit bleibenden Schäden bis hin zum Tod',
  ),

  /////////////////////////////////////////////////////////
  // Atmung
  /////////////////////////////////////////////////////////

  defSc(
    'Asthma/COPD (leicht)', 'Therapieerfolg, Pat. wach, kein C-Problem',
    'BvO', 'atmung',
    [
      'atmung-luftnot-rezidiv-zunehmend',
      'atmung-sprechdyspnoe',
      'neuro-vigilanzminderung',
    ],
    [
      'infekt-infektzeichen',
      'sonstige-bedarfsmedOhneWirkung',
    ],
    [
      'Exazerbation', 'Pneumonie', 'Pneumothorax', 'LAE'
    ]
  ),
  defSc(
    'Asthma/COPD (schwer)', 'fehlende Besserung, Erschöpfung',
    'Verweigerung', 'atmung',
    [
      'atmung-luftnot-rezidiv-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'atmung-luftnotSchwaeche-anhaltend',
      'sonstige-bedarfsmedOhneWirkung',
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
      'atmung-luftnot-neu',
      'kreislauf-probleme-neu',
      'haut-ausschlag-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'haut-ausschlagJuckreiz-anhaltend',
      'gastro-beschwerden-neu',
    ],
    [
      'Anaphylaxie', 'Larynxödem', 'verzögerte systemische Reaktion',
    ]
  ),
  defSc(
    'Anaphylaxie (schwer)', 'Stadium > I, A/B/C-Problem, Rückfallgefahr',
    'Verweigerung', 'atmung',
    [
      'atmung-luftnot-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'haut-ausschlagJuckreiz-anhaltend',
      'gastro-beschwerden-anhaltend',
    ],
    [
      'Anaphylaxie', 'Schock', 'Larynxödem', 'verzögerte systemische Reaktion',
    ],
    'erneuter/zunehmender anaphylaktischer Reaktion mit Atemwegsverlegung oder Schock bis zum Kreislaufversagen',
  ),

  /////////////////////////////////////////////////////////
  // Kreislauf
  /////////////////////////////////////////////////////////

  defSc(
    'Thoraxschmerz, nicht-traumatisch (leicht)', 'klar reproduzierbar, keine Luftnot, lokal',
    'BvO', 'kreislauf',
    [
      'atmung-luftnot',
      'kreislauf-ap-neu',
      'kreislauf-vegetative-neu',
      'kreislauf-herzrhythmus-neu',
    ],
    [
      'schmerz-thoraxschmerzLokal-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Interkostalneuralgie', 'Muskelzerrung',
      'ACS',
      'Pleuritis', 'Pneumonie', 'Reflux',
    ],
  ),
  defSc(
    'Thoraxschmerz, nicht-traumatisch (schwer)', 'nicht reproduzierbar, Luftnot, Ausstrahlung',
    'Verweigerung', 'kreislauf',
    [
      'kreislauf-ap-zunehmend',
      'atmung-luftnot-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'AP', 'ACS', 'LAE', 'Aortendissektion',
    ],
    'einer weiteren Verschlechterung, bleibenden Schäden bis hin zum Kreislaufstillstand',
  ),

  defSc(
    'Palpitationen/Herzrasen (leicht)', 'kein Brustschmerz/Luftnot/Kreislaufproblem',
    'BvO', 'kreislauf',
    [
      'atmung-luftnot',
      'kreislauf-ap-neu',
      'kreislauf-probleme-neu',
      'neuro-vigilanzminderungSynkope',
      'kreislauf-tachykardie-rezidiv',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
      'kreislauf-tachykardie-anhaltend',
    ],
    [
      'Tachykardien', 'Extrasystolen', 'Elektrolytstörungen', 'Exogene Ursachen'
    ],
  ),
  defSc(
    'Palpitationen/Herzrasen (schwer)', 'Brustschmerz/Luftnot, Schwindel, Fieber',
    'Verweigerung', 'kreislauf',
    [
      'atmung-luftnot-zunehmend',
      'kreislauf-ap-zunehmend',
      'neuro-vigilanzminderung',
      'kreislauf-probleme-zunehmend',
    ],
    [
      'kreislauf-tachykardie-anhaltend',
    ],
    [
      'Tachykardien', 'ACS', 'Myokarditis', 'LAE', 'Sepsis',
    ],
    'lebensbedrohl. Rhythmusstörungen bis hin zum Kreislaufstillstand',
  ),

  defSc(
    'Blutdruckstörung (leicht)', 'kein Brustschmerz/Luftnot/Kreislaufproblem',
    'BvO', 'kreislauf',
    [
      'kreislauf-ap-neu',
      'atmung-luftnot',
      'kreislauf-probleme-neu',
      'neuro-ausfall-neu',
    ],
    [
      'kreislauf-tachykardie-anhaltend',
      'kreislauf-rr-anhaltend',
    ],
    [
      'Blutdruckentgleisung',
      'kardiale/orthost./neurol./vasovagale Ursachen',
    ],
  ),
  defSc(
    'Hypertensive Krise (schwer)', 'Zeichen Organschaden',
    'Verweigerung', 'kreislauf',
    [
      'kreislauf-ap-zunehmend',
      'atmung-luftnot-zunehmend',
      'neuro-vigilanzminderung',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'kreislauf-rr-anhaltend',
      'kreislauf-tachykardie-anhaltend',
    ],
    [
      'hypertensiven Notfall',
      'ACS', 'Lungenödem', 'ICB', 'Aortendissektion',
    ],
    'hohem Risiko für Schlaganfall, Herzversagen oder tödlichen Komplikationen innerhalb kurzer Zeit',
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
  text: string
) {
  return {
    id,
    text,
  } as const
}