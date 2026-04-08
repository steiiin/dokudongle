export type RedflagCategory = 'trauma' | 'atmung' | 'kreislauf' | 'neuro' | 'intox' | 'gastro' | 'infekt' | 'hno' | 'psych' | 'gyn'
export type RedflagApplication = 'Verweigerung' | 'BvO'

// ######################################################################################

type SignalId = typeof DATA_Signals[number]['id']

// ######################################################################################

export class RedflagSignal {
  constructor(
    public id: string,
    public text: string,
  ) { }
}

// ######################################################################################

export const _SignalDefs = [

  defSg(
    'omw-immobilitaet-zunehmend',
    'zunehmenden Immobilität'),

  defSg(
    'omw-beschwerden-anhaltend',
    'anhaltenden Beschwerden'),

  defSg(
    'atmung-auswurfRuss',
    'rußiger Auswurf'),

  defSg(
    'atmung-luftnot',
    'Luftnot'),

  defSg(
    'atmung-luftnot-general',
    'Atembeschwerden'),

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
    'atmung-aspiration',
    'Aspirationsverdacht (Husten/brodelnde Atmung)'),

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
    'atmung-hyperventilation-anhaltend',
    'wiederkehrenden Hyperventilationen im Verlauf'),

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
    'gastro-dehydratation',
    'Dehydratation'),

  defSg(
    'gastro-dehydratation-zunehmend',
    'zunehmender Dehydratation'),

  defSg(
    'gastro-beschwerden-anhaltend',
    'anhaltenden gastrointestinalen Beschwerden (Übelkeit/Erbrechen/Schmerzen)'),

  defSg(
    'gastro-beschwerden-neu',
    'Magen-Darm-Beschwerden (Übelkeit/Schmerzen)'),

  defSg(
    'gastro-beschwerden-zunehmend',
    'zunehmenden Magen-Darm-Beschwerden (Übelkeit/Schmerzen)'),

  defSg(
    'gastro-gib',
    'Blut in Erbrochenem/Stuhl'),

  defSg(
    'gastro-haematurie',
    'Blut im Urin'),

  defSg(
    'gastro-gib-zunehmend',
    'zunehmenden Blutbeimengungen in Erbrochenem/Stuhl'),

  defSg(
    'gastro-bauchschmerzen-rezidiv',
    'erneuten Bauchschmerzen'),

  defSg(
    'gastro-bauchschmerzen-anhaltend',
    'anhaltenden Bauchschmerzen >48h'),

  defSg(
    'gastro-bauchschmerzen-zunehmend',
    'zunehmenden Bauchschmerzen'),

  defSg(
    'gyn-blutung-neu',
    'vaginaler Blutung'),

  defSg(
    'gyn-blutung-zunehmend',
    'zunehmender vaginaler Blutung (mehrere Binden/h)'),

  defSg(
    'gyn-fruchtwasser',
    'Fruchtwasserabgang'),

  defSg(
    'gyn-blutung-anhaltend',
    'anhaltender vaginaler Blutung über Tage ohne Besserung'),

  defSg(
    'gyn-kindsbewegung-anhaltend',
    'anhaltend fehlender/deutlich verminderter Kindsbewegungen über Stunden'),

  defSg(
    'gyn-kindsbewegung-unsicher',
    'zunehmende Unsicherheit bzgl. fetaler Aktivität'),

  defSg(
    'gastro-unterBauchschmerzen-zunehmend',
    'zunehmenden Unterbauchschmerzen'),

  defSg(
    'uro-dysurie',
    'Problemen beim Wasserlassen'),

  defSg(
    'uro-anurie',
    'unmöglichem Wasserlassen'),

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
    'infekt-fieber-anhaltend',
    'anhaltendem Fieber >48h'),

  defSg(
    'infekt-infektzeichen',
    'Infektzeichen/red. AZ'),

  defSg(
    'infekt-infektzeichen-anhaltend',
    'anhaltenden Infektzeichen/red. AZ'),

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
    'kreislauf-ap-neu',
    'zunehmenden, nicht mehr reproduzierbaren Brustschmerzen oder Ausstrahlung in Arm, Rücken oder Kiefer'),

  defSg(
    'kreislauf-ap-zunehmend',
    'zunehmenden Brustenge/-schmerzen oder Ausstrahlung in Arm, Rücken oder Kiefer'),

  defSg(
    'kreislauf-herzrhythmus-neu',
    'Herzstolpern/Herzrasen'),

  defSg(
    'kreislauf-vegetative-neu',
    'Schwindel/Erbrechen/Kaltschweißigkeit/Schwäche'),

  defSg(
    'kreislauf-vegetative-rezidiv',
    'erneuter Schwindel/Erbrechen/Kaltschweißigkeit/Schwäche'),

  defSg(
    'kreislauf-tachykardie-rezidiv',
    'erneutem Herzrasen'),

  defSg(
    'kreislauf-belastungsSchwaeche-anhaltend',
    'anhaltender Schwäche'),

  defSg(
    'kreislauf-tachykardie-anhaltend',
    'anhaltenden Palpitationen über Stunden'),

  defSg(
    'kreislauf-rr-anhaltend',
    'erhöhten RR-Werte trotz Ruhe >48h'),

  defSg(
    'neuro-dms-neu',
    'einer DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-dms-zunehmend',
    'zunehmender DMS-Störung (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-empfindung-anhaltend',
    'anhaltender Empfindungsstörungen'),

  defSg(
    'neuro-ausfall-neu',
    'neurol. Ausfällen (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-ausfall-zunehmend',
    'zunehmenden neurol. Ausfällen (Taubheit/Blässe/Kälte/Schwäche)'),

  defSg(
    'neuro-sehstoerung-neu',
    'Sehstörungen'),

  defSg(
    'neuro-sehstoerung-zunehmend',
    'zunehmender Sehverschlechterung'),

  defSg(
    'neuro-sehstoerung-anhaltend',
    'anhaltenden Sehstörungen/flüchtige Visusverluste'),

  defSg(
    'neuro-glaukom',
    'Augenschmerz/Augenrötung/Übelkeit/Erbrechen'),

  defSg(
    'neuro-untereParese-neu',
    'neuen/zunehmenden Paresen/Gangunsicherheit'),

  defSg(
    'neuro-untereParese-zunehmend',
    'zunehmenden Paresen/Gehunfähigkeit'),

  defSg(
    'neuro-gangunsicherheit-anhaltend',
    'anhaltender Gangunsicherheit'),

  defSg(
    'neuro-entleerung-neu',
    'Blasen-/Mastdarmstörung'),

  defSg(
    'neuro-entleerung-zunehmend',
    'zunehmender Blasen-/Mastdarmstörung'),

  defSg(
    'neuro-sattelanaesthesie-neu',
    'Taubheit Genital-/Gesäß-/Oberschenkelregion'),

  defSg(
    'neuro-sattelanaesthesie-zunehmend',
    'zunehmender Taubheit Genital-/Gesäß-/Oberschenkelregion'),

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
    'neuro-schwindelGerichtet-zunehmend',
    'zunehmenden Schwindel trotz Schonung'),

  defSg(
    'neuro-fallneigung-anhaltend',
    'anhaltenden Beschwerden mit Fallneigung'),

  defSg(
    'neuro-krampfanfall-neu',
    'Krampfanfall'),

  defSg(
    'neuro-krampfanfall-rezidiv',
    'erneuter Krampfanfall/Serienanfälle in kurzer Zeit'),

  defSg(
    'neuro-krampfanfallMuster',
    'ungewöhnlichem Verlauf (länger/fehlende Erholung)'),

  defSg(
    'neuro-muedigkeit-anhaltend',
    'anhaltender Müdigkeit >48h'),

  defSg(
    'neuro-sensibilitaet-anhaltend',
    'anhaltender Empfindungsstörungen'),

  defSg(
    'neuro-vigilanzminderung',
    'Bewusstseinseintrübung'),

  defSg(
    'neuro-vigilanzminderungSynkope',
    'Bewusstseinsverlust/-eintrübung'),

  defSg(
    'neuro-synkope-rezidiv',
    'erneutem/zunehmender Bewusstseinsverlust/-eintrübung'),

  defSg(
    'neuro-schluckstoerung',
    'vermehrtem Verschlucken'),

  defSg(
    'neuro-meningismus',
    'Meningismus (Nackensteife/Kopfschmerz/Erbrechen/Lichtempfindlichkeit)'),

  defSg(
    'neuro-hypoglyk-rezidiv',
    'erneutem BZ-Abfall < 60mg/ml bzw. 3,3mmol/l'),

  defSg(
    'neuro-hypoglyk-anhaltend',
    'fehlender Normoglykämie im Verlauf'),

  defSg(
    'neuro-hypoglykDiscl',
    'fehlende eigenständige Nahrungsaufnahme'),

  defSg(
    'psych-unruhe-zunehmend',
    'zunehmende Unruhe'),

  defSg(
    'psych-halluzination',
    'Halluzinationen'),

  defSg(
    'psych-desorientierung-anhaltend',
    'anhaltenden Desorientierung'),

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
    'untereSchmerzAnalgesie-zunehmend',
    'zunehmenden starken Schmerzen mit Ausbreitung in beide Beine'),

  defSg(
    'schmerzAnalgesie-zunehmend',
    'zunehmenden Schmerzen trotz Analgesie'),

  defSg(
    'haut-schwellungHaematom-anhaltend',
    'anhaltender Schwellung/Hämatom'),

  defSg(
    'schmerz-thoraxschmerzLokal-anhaltend',
    'anhaltende lokale Schmerzen >24h'),

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

  defSg(
    'wunde-epistaxis-rezidiv',
    'erneutem starkem anhaltendem Nasenbuten trotz Kompression'),

  defSg(
    'wunde-epistaxis-anhaltend',
    'wiederkehrendem Nasenbluten trotz Schonung'),

] as const

export const _SignalTextsById: Record<SignalId, string> = Object.fromEntries(
  _SignalDefs.map(s => [s.id, s.text])
) as Record<SignalId, string>

export const DATA_Signals: RedflagSignal[] = _SignalDefs.map(
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

export const DATA_Scenarios: Array<RedflagScenario> = [

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
      'Tachykardie', 'Extrasystole', 'Elektrolytstörung', 'Exogene Ursache'
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
      'Tachykardie', 'ACS', 'Myokarditis', 'LAE', 'Sepsis',
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
      'kardiale/orthost./neurol./vasovagale Ursache',
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
    [
      'neuro-vigilanzminderungSynkope',
      'neuro-ausfall-neu',
      'neuro-krampfanfall-neu',
      'psych-unruhe-zunehmend',
      'psych-halluzination',
      'infekt-fieber',
    ],
    [
      'psych-desorientierung-anhaltend',
    ],
    [
      'Delir', 'Schlaganfall', 'Hirndruck',
      'metab. Entgleisung', 'Intoxikationen',
    ],
    'Verschlechterung einer unentdeckter lebensbedrohl. Ursache wie Schlaganfall oder Sepsis mit bleibenden Schäden oder Tod',
  ),

  defSc(
    'Rückenschmerz, nicht-traumatisch (leicht)', 'ohne Parese, keine Entleerungsstörung',
    'BvO', 'neuro',
    [
      'neuro-untereParese-neu',
      'neuro-entleerung-neu',
      'neuro-sattelanaesthesie-neu',
      'schmerzStark-zunehmend',
      'infekt-infektzeichen',
    ],
    [
      'schmerzAnalgesie-zunehmend',
    ],
    [
      'Lumbalgie/Verspannung', 'ISG-Blockierung',
      'Bandscheibenprotrusion/-prolaps',
      'Spinalkanal',
    ],
  ),
  defSc(
    'Rückenschmerz, nicht-traumatisch (schwer)', 'beidseitige neurol. Ausfälle, Entleerungsstörung',
    'Verweigerung', 'neuro',
    [
      'neuro-untereParese-zunehmend',
      'neuro-entleerung-zunehmend',
      'neuro-sattelanaesthesie-zunehmend',
      'untereSchmerzAnalgesie-zunehmend',
      'infekt-infektzeichen',
    ],
    [
      'omw-immobilitaet-zunehmend',
      'neuro-empfindung-anhaltend',
    ],
    [
      'Bandscheibenvorfall', 'Kauda-equina',
      'anderer Nervenwurzel-/Rückenmarkskompression',
    ],
    'dauerhafte Lähmungen, sowie irreversibler Verlust der Blasen-/Darmkontrolle',
  ),

  defSc(
    'Schwindel (leicht)', 'Lageabhängig, keine neurol. Ausfälle',
    'BvO', 'neuro',
    [
      'neuro-ausfall-neu',
      'neuro-untereParese-neu',
      'neuro-sehstoerung-neu',
      'neuro-kopfschmerz-neu',
      'neuro-vigilanzminderung',
    ],
    [
      'neuro-schwindelGerichtet-zunehmend',
      'neuro-fallneigung-anhaltend',
    ],
    [
      'Lagerungs- oder vestibul. Schwindel',
      'Kreislaufdysregulation',
      'TIA',
    ],
  ),
  defSc(
    'Schwindel (schwer)', 'neurol. Ausfälle',
    'Verweigerung', 'neuro',
    [
      'neuro-ausfall-zunehmend',
      'neuro-vigilanzminderung',
      'neuro-untereParese-zunehmend',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'neuro-schwindelGerichtet-zunehmend',
      'neuro-fallneigung-anhaltend',
    ],
    [
      'TIA/Schlaganfall', 'Hirnblutung',
      'Vestibul. Schwindel',
    ],
    'einer raschen Verschlechterung mit bleibenden neurol. Schäden bis hin zum Tod',
  ),

  defSc(
    'Synkope', 'unklare Genese/erstmalig',
    'Verweigerung', 'neuro',
    [
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'kreislauf-probleme-zunehmend',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'neuro-fallneigung-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Arrhythmie', 'vasovagal./orthost. Ursache',
      'Klappenfehler',
      'TIA', 'Krampfanfall', 'metab. Erkrankung',
    ],
    'erneuten Synkopen mit Stürzen+Verletzungen oder unerkannter pot. lebensbedrohl. Ursachen mit bleibenden Schäden oder Herztod',
  ),

  defSc(
    'Hypoglykämie (leicht)', 'nach Therapie orientiert, Selbstkontrolle möglich',
    'BvO', 'neuro',
    [
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'kreislauf-vegetative-rezidiv',
      'neuro-hypoglyk-rezidiv',
      'neuro-hypoglykDiscl',
      'gastro-erbrechen-neu',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Hypoglykämie', 'Diabetes',
    ],
  ),
  defSc(
    'Hypoglykämie (schwer)', 'fehlende Besserung, keine sichere Selbstkontrolle',
    'Verweigerung', 'neuro',
    [
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'kreislauf-vegetative-rezidiv',
      'neuro-hypoglyk-anhaltend',
      'neuro-hypoglykDiscl',
      'gastro-erbrechen-neu',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Hypoglykämie', 'Diabetes'
    ],
    'schweren Unterzuckerung mit Krampfanfall, Bewusstlosigkeit, bleibendem Hirnschaden bis hin zum Tod',
  ),

  defSc(
    'Hyperglykämie (leicht)', 'ohne Bewusstseinseinschränkungen, Zufallsbefund',
    'BvO', 'neuro',
    [
      'neuro-vigilanzminderung',
      'gastro-beschwerden-neu',
      'atmung-luftnot-general',
      'neuro-sehstoerung-neu',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Hyperglykämie',
      'diabetisches Koma',
    ],
  ),
  defSc(
    'Hyperglykämie (schwer)', 'Vigilanzminderung',
    'Verweigerung', 'neuro',
    [
      'neuro-vigilanzminderungSynkope',
      'gastro-beschwerden-zunehmend',
      'neuro-ausfall-neu',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Hyperglykämie',
      'diabetisches Koma',
    ],
    'weiteren Entgleisung bis hin zum Koma und Tod',
  ),

  defSc(
    'Krampfanfall (bekanntes Muster)', 'bek. Epilepsie, bek. Muster, vollständige Erholung',
    'BvO', 'neuro',
    [
      'neuro-krampfanfall-rezidiv',
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'atmung-luftnot-neu',
      'neuro-krampfanfallMuster',
    ],
    [
      'psych-desorientierung-anhaltend',
    ],
    [
      'Epilepsie', 'Durchbruchsanfall', 'Infekt/Schlafmangel/Stress/Elekrolyte'
    ],
  ),
  defSc(
    'Krampfanfall (neues Muster/erstmalig)', 'prolongiert, fehlende Erholung, Serienanfall',
    'Verweigerung', 'neuro',
    [
      'neuro-krampfanfall-rezidiv',
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'atmung-luftnot-neu',
    ],
    [
      'psych-desorientierung-anhaltend',
    ],
    [
      'Epilepsie', 'Durchbruchsanfall',
      'Schlaganfall', 'ZNS-Erkrankung',
    ],
    'prolongierten Krampfanfällen bis zum Status epilepticus mit bleibenden Schäder oder Tod',
  ),

  defSc(
    'Schlaganfall/TIA', '',
    'Verweigerung', 'neuro',
    [
      'neuro-ausfall-zunehmend',
      'neuro-vigilanzminderungSynkope',
      'neuro-schluckstoerung',
      'neuro-sehstoerung-neu',
      'neuro-kopfschmerz-zunehmend',
    ],
    [
      'neuro-fallneigung-anhaltend',
    ],
    [
      'Schlaganfall', 'TIA', 'Hirnblutung',
    ],
    'rascher neurol. Verschlechterung mit bleibenden Schäden oder Tod',
  ),

  defSc(
    'Akute Sehstörung', '',
    'Verweigerung', 'neuro',
    [
      'neuro-sehstoerung-zunehmend',
      'neuro-ausfall-neu',
      'neuro-kopfschmerz-zunehmend',
      'neuro-glaukom',
    ],
    [
      'neuro-sehstoerung-anhaltend',
    ],
    [
      'Gefäßverschluss',
      'Schlaganfall',
      'Glaukom',
      'Netzhautablösung',
    ],
    'bleibendem Sehverlust oder bleibenden neurol. Schäden',
  ),

  /////////////////////////////////////////////////////////
  // Intox
  /////////////////////////////////////////////////////////

  defSc(
    'Alkoholintoxikation (leicht)', 'Anruf durch Dritte, keine Eigengefährdung',
    'BvO', 'intox',
    [
      'neuro-synkope-rezidiv',
      'gastro-erbrechen-neu',
      'neuro-krampfanfall-neu',
      'atmung-luftnot-neu',
    ],
    [
      'omw-beschwerden-anhaltend',
    ],
    [
      'C2-Intox', 'Misch-Intox',
      'SHT/unbeob. Sturz',
      'Exsikkose', 'Elektrolytstörung',
    ],
  ),
  defSc(
    'Intoxikation (unklar)', 'Spätfolgen nicht ausschließbar',
    'Verweigerung', 'intox',
    [
      'neuro-vigilanzminderungSynkope',
      'atmung-luftnot-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-untereParese-neu',
    ],
    [],
    [
      'Medikamente', 'Misch-Intox',
    ],
    'verzögert einsetzender lebensbedrohlicher Komplikationen mit bleibenden Schäden bis hin zum Atem-/Kreislaufstillstand',
  ),

  /////////////////////////////////////////////////////////
  // Gastro
  /////////////////////////////////////////////////////////

  defSc(
    'Gastroenteritis (leicht)', 'keine/leichte Schmerzen, keine GIB, keine Dehydratation',
    'BvO', 'gastro',
    [
      'gastro-erbrechen-neu',
      'gastro-dehydratation',
      'gastro-beschwerden-zunehmend',
      'gastro-gib',
      'kreislauf-probleme-zunehmend',
    ],
    [
      'gastro-beschwerden-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Gastroenteritis',
      'Lebensmittelvergiftung',
      'Dehydratation',
    ],
  ),
  defSc(
    'Gastroenteritis (schwer)', 'Blutbeimengung, Schwindel/Kollaps, Dehydratation',
    'Verweigerung', 'gastro',
    [
      'kreislauf-probleme-zunehmend',
      'schmerzStark-zunehmend',
      'gastro-beschwerden-zunehmend',
      'gastro-dehydratation-zunehmend',
      'gastro-gib',
    ],
    [
      'gastro-beschwerden-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Gastroenteritis',
      'Lebensmittelvergiftung',
      'Dehydratation',
      'Gastroblutung',
      'akutes Abdomen',
    ],
    'Flüssigkeits-/Blutverlust mit Organversagen und Tod',
  ),

  defSc(
    'Bauchschmerzen (leicht)', 'leichte Schmerzen, keine GIB, keine Abwehrspannung',
    'BvO', 'gastro',
    [
      'gastro-beschwerden-zunehmend',
      'gastro-gib',
      'gastro-erbrechen-neu',
      'kreislauf-probleme-zunehmend',
    ],
    [
      'infekt-infektzeichen-anhaltend',
      'gastro-bauchschmerzen-anhaltend',
    ],
    [
      'Gastroenteritis', 'Obstipation', 'Reizdarm',
      'Appendizitis', 'Harnwegsinfekt',
    ],
  ),
  defSc(
    'Bauchschmerzen (schwer)', 'Blutbeimengung, Schwindel/Kollaps, akute/starke Schmerzen',
    'Verweigerung', 'gastro',
    [
      'gastro-beschwerden-zunehmend',
      'gastro-gib',
      'gastro-erbrechen-neu',
      'kreislauf-probleme-zunehmend',
    ],
    [
      'infekt-infektzeichen-anhaltend',
      'gastro-bauchschmerzen-anhaltend',
    ],
    [
      'GIB', 'akutes Abdomen', 'Ileus',
      'Pankreatits', 'Aneurysma', 'Mesenterialinfarkt'
    ],
    'Bauchfellentzündung, Perforation und inneren Blutungen bis zum Kreislaufversagen',
  ),

  defSc(
    'Nierenkolik (leicht)', 'Kolikschmerz, spontan beendet',
    'BvO', 'gastro',
    [
      'gastro-bauchschmerzen-rezidiv',
      'infekt-infektzeichen',
      'kreislauf-probleme-neu',
      'neuro-vigilanzminderung',
      'uro-dysurie',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Nierenkolik', 'Harnleiterkolik',
      'Harnstau', 'LWS-bedingter Schmerz',
      'Appendizitis',
    ],
  ),
  defSc(
    'Nierenkolik (schwer)', '',
    'Verweigerung', 'gastro',
    [
      'schmerzStark-zunehmend',
      'infekt-infektzeichen-anhaltend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Nierenkolik', 'Harnleiterkolik',
      'Harnstau', 'Urosepsis',
      'Nierenversagen', 'Appendizitis',
    ],
    'Harnstau über Urosepsis bis zum Nierenversagen und Tod',
  ),

  defSc(
    'Katheterkomplikation (leicht)', 'Wasserlassen möglich',
    'BvO', 'gastro',
    [
      'gastro-unterBauchschmerzen-zunehmend',
      'infekt-fieber',
      'uro-anurie',
      'gastro-haematurie',
    ],
    [
      'infekt-infektzeichen',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Harnwegsinfekt', 'Harnstau',
    ],
  ),
  defSc(
    'Katheterkomplikation (schwer)', 'Wasserlassen nicht möglich',
    'Verweigerung', 'gastro',
    [
      'gastro-unterBauchschmerzen-zunehmend',
      'infekt-fieber',
      'uro-anurie',
      'gastro-haematurie',
    ],
    [
      'infekt-infektzeichen',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Harnwegsinfekt', 'Harnstau',
      'Nierenversagen',
    ],
    'Harnstau bis zur Urosepsis, Blasenruptur, Nierenversagen und Tod'
  ),

  defSc(
    'Harnverhalt (leicht)', 'Wasserlassen möglich',
    'BvO', 'gastro',
    [
      'uro-anurie',
      'gastro-unterBauchschmerzen-zunehmend',
      'neuro-vigilanzminderung',
      'infekt-infektzeichen',
      'gastro-haematurie',
    ],
    [
      'uro-dysurie-anhaltend',
    ],
    [
      'Restharnbildung', 'Prostatahyperplasie',
      'Obstruktion', 'Harnwegsinfekt',
    ],
  ),
  defSc(
    'Harnverhalt (schwer)', 'Wasserlassen nicht möglich',
    'Verweigerung', 'gastro',
    [
      'uro-anurie',
      'gastro-unterBauchschmerzen-zunehmend',
      'neuro-vigilanzminderung',
      'infekt-infektzeichen',
      'gastro-haematurie',
    ],
    [
      'uro-dysurie-anhaltend',
    ],
    [
      'Prostatahyperplasie',
      'Obstruktion', 'Harnwegsinfekt',
    ],
    'Harnstau bis zur Urosepsis, Blasenruptur, Nierenversagen und Tod',
  ),

  defSc(
    'Harnwegsinfekt', 'Wasserlassen möglich, leichte Schmerzen',
    'BvO', 'gastro',
    [],
    [],
    [],
  ),
  defSc(
    'Urosepsis', 'Systemische Infektion, Schmerzen',
    'Verweigerung', 'gastro',
    [],
    [],
    [],
    '',
  ),

  defSc(
    'Gastrointestinale Blutung', '',
    'Verweigerung', 'gastro',
    [
      'kreislauf-probleme-zunehmend',
      'gastro-gib-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'GIB', 'Gastroenteritis'
    ],
    'fortschreitenden Blutverlust bis hin zum Organversagen und Tod',
  ),

  /////////////////////////////////////////////////////////
  // Infekt
  /////////////////////////////////////////////////////////

  defSc(
    'Fieberhafter Infekt (leicht)', 'kreislaufstabil, keine Luftnot, orientiert',
    'BvO', 'infekt',
    [
      'atmung-luftnot-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderungSynkope',
      'neuro-meningismus',
    ],
    [
      'infekt-fieber-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Infekt', 'Pneumonie', 'Sepsis',
    ],
  ),
  defSc(
    'Fieber/Infekt/Sepsis', 'Luftnot, Verwirrtheit, Dehydratation',
    'Verweigerung', 'infekt',
    [
      'atmung-luftnot-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderungSynkope',
      'neuro-meningismus',
      'gastro-dehydratation',
    ],
    [
      'infekt-fieber-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Sepsis', 'Pneumonie', 'Exsikkose',
    ],
    'systemischer Infektion bis zum Multiorganversagen und Tod',
  ),

  defSc(
    'Kindlicher Infekt (leicht)', '',
    'BvO', 'infekt',
    [],
    [],
    [],
  ),
  defSc(
    'Kindlicher Infekt (schwer)', '',
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
    [
      'wunde-epistaxis-rezidiv',
      'atmung-aspiration',
      'kreislauf-probleme-neu',
    ],
    [
      'wunde-epistaxis-anhaltend',
    ],
    [
      'Epistaxis', 'Infekt', 'Hypertonie',
      'Gerinnungsstörung',
    ],
  ),
  defSc(
    'Nasenbluten (schwer)', 'anhaltend/starke Blutung, Kreislaufproblem, Traumaassoziiert',
    'Verweigerung', 'hno',
    [
      'wunde-epistaxis-rezidiv',
      'kreislauf-probleme-zunehmend',
      'atmung-aspiration',
      'neuro-vigilanzminderung',
    ],
    [
      'wunde-epistaxis-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Epistaxis', 'Infekt', 'Hypertonie',
      'Gerinnungsstörung',
    ],
    'relevantem Blutverlust bis hin zum hämorrhagischen Schock und Tod',
  ),

  /////////////////////////////////////////////////////////
  // Psych
  /////////////////////////////////////////////////////////

  defSc(
    'Panikattacke/Hyperventilation (leicht)', 'Besserung nach Beruhigung/Atemanleitung',
    'BvO', 'psych',
    [
      'atmung-luftnot-zunehmend',
      'kreislauf-vegetative-neu',
      'neuro-ausfall-neu',
      'atmung-atemabhaengigerSchmerz-zunehmend',
    ],
    [
      'atmung-hyperventilation-anhaltend',
    ],
    [
      'Panikattacke', 'Belastungsreaktion',
      'kardiale/respirat./metabol. Ursachen',
    ],
  ),

  /////////////////////////////////////////////////////////
  // Gynäkologie
  /////////////////////////////////////////////////////////

  defSc(
    'Vaginale Blutung (leicht)', 'keine Kreislaufprobleme, keine/leichte Schmerzen',
    'BvO', 'gyn',
    [
      'gyn-blutung-zunehmend',
      'gastro-unterBauchschmerzen-zunehmend',
      'kreislauf-probleme-neu',
      'infekt-fieber',
    ],
    [
      'gyn-blutung-anhaltend',
    ],
    [],
  ),
  defSc(
    'Vaginale Blutung (schwer)', 'Kreislaufprobleme, starke Schmerzen',
    'Verweigerung', 'gyn',
    [
      'gyn-blutung-zunehmend',
      'gastro-unterBauchschmerzen-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
    ],
    [
      'gyn-blutung-anhaltend',
    ],
    [],
    'fortschreitender Blutverlust bis hin zum Kreislaufversagen, Schock und Tod',
  ),

  defSc(
    'Schwangerschaftsblutung', '',
    'Verweigerung', 'gyn',
    [
      'gyn-blutung-zunehmend',
      'gastro-unterBauchschmerzen-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderung',
      'gyn-fruchtwasser',
    ],
    [
      'gyn-blutung-anhaltend',
    ],
    [
      'Abort', 'Plazentakomplikationen',
    ],
    'schweren Schwangerschaftskomplikationen mit lebensbedrohlichen Blutungen bis hin zum Tod',
  ),
  defSc(
    'Fehlende Kindsbewegungen', '',
    'Verweigerung', 'gyn',
    [
      'gyn-kindsbewegung-anhaltend',
      'gyn-blutung-neu',
      'gastro-unterBauchschmerzen-zunehmend',
      'infekt-infektzeichen',
      'kreislauf-probleme-zunehmend',
    ],
    [
      'gyn-kindsbewegung-unsicher'
    ],
    [
      'fetale Notlage', 'Plazentaablösung',
      'Infektion', 'Abort',
    ],
    'einer unentdeckten Komplikation und dem Tod des Kindes bis hin zu lebensbedrohl. Komplikationen für den Patienten selbst',
  ),
  defSc(
    'Präeklampsie-Warnzeichen', 'Bluthochdruck, Sehstörung, Erbrechen, Ödeme',
    'Verweigerung', 'gyn',
    [
      'neuro-kopfschmerz-zunehmend',
      'neuro-ausfall-neu',
      'atmung-luftnot-neu',
      'gastro-bauchschmerzen-zunehmend',
      'kreislauf-probleme-zunehmend',
      'neuro-vigilanzminderungSynkope',
    ],
    [
      'gastro-erbrechen-neu',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    [
      'Präeklampsie', 'HELLP', 'Hypertonie', 'Lungenödem',
    ],
    'eines Krampfanfalls oder lebensbedrohl. Gefährdung für Mutter und Kind',
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