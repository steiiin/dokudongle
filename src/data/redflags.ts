/**
 * RedFlags – Szenariokatalog aus redflags_150_szenarien.md.
 *
 * Vorgesehene Ablage:
 *   data/redflags.ts
 *   types/redflags.d.ts
 *
 * Daten und Typ-Reexports; keine fachliche Auswahl-, Aggregations- oder
 * Textgeneratorlogik. Die beiden bisherigen Szenariolisten werden lediglich
 * aus einer gemeinsamen Pflegeliste abgeleitet (ohne Objektkopien).
 * IDs sind explizite, dauerhaft beizubehaltende Literale.
 *
 * Anordnung im Quelltext:
 * - Hauptszenarien alphabetisch nach name (deutsche Sortierung).
 * - Unterszenarien unmittelbar unter ihrem jeweiligen Hauptszenario, ebenfalls
 *   alphabetisch nach name. parentId bleibt die einzige Zuordnungsquelle.
 * - Bei gleichem Namen dient die unveränderte ID als zweites Sortierkriterium.
 * - Die Reihenfolge ist bereits so gespeichert; keine Sortierung zur Laufzeit.
 *
 * Umfang:
 * - Alle 150 Kandidaten sind genau einmal abgebildet: 118 Hauptszenarien und
 *   32 Unterszenarien (43 BvO, 107 Verweigerung nach Anwendung des Hauptszenarios).
 * - Nr. 36 aktualisiert den vorhandenen vasovagalen Subtyp, ohne neue ID.
 * - 15 im Markdown benannte, im Beispielset fehlende Hauptszenarien sind als
 *   strukturelle Platzhalter ergänzt. Deren universelle Inhalte bleiben leer.
 * - Insgesamt: 135 Hauptszenarien, 33 Unterszenarien und die neun bestehenden
 *   Warnzeichen. Die zwei ursprünglichen Hauptszenarien bleiben erhalten.
 *
 * Quellenübernahme:
 * - name = Szenario (ohne das redaktionelle Sternchen), requirements = Abgrenzung.
 *   Diese Texte und die Anwendung werden unverändert aus dem Markdown übernommen.
 * - Nummern in Kommentaren verweisen auf die 150er-Tabelle; sie sind keine IDs.
 * - Die explizite Unterfalltabelle bestimmt parentId, mit zwei dokumentierten
 *   Sonderfällen: Nr. 36 nutzt synkope-bvo; Nr. 142 bleibt ein Hauptszenario.
 * - Kategorien sind technische Zuordnungen anhand der Bereichsüberschriften,
 *   keine im Markdown bereits fachlich festgelegten Klassifikationen.
 *   Unterszenarien erben application und category ausschließlich vom Hauptszenario.
 * - Die zusätzlich benötigten Kategorien stehen in types/redflags.d.ts:
 *   umwelt, augen, uro, stoffwechsel, haut und paediatrie.
 *
 * Noch nicht ausgearbeitet:
 * - Keine neuen Signals und keine neuen Zuordnungen zu major/minor.
 * - Neue Datensätze haben leere majorSignalIds, minorSignalIds, diagnoses und
 *   consequences. Leer bedeutet NICHT: keine Warnzeichen, Diagnosen oder Risiken.
 * - Vorhandene Warnzeichen, Verweise, Diagnosen und Folgen bleiben erhalten.
 *   Neu zugeordnete Unterfälle erben gegebenenfalls vorhandene Elterninhalte.
 * - Fehlende universelle Voraussetzungen der ergänzten Sammelszenarien werden
 *   nicht erfunden. requirements: '' ist keine medizinische Freigabe.
 *
 * Sicherheitsrahmen der Quelle:
 * Konzeptentwurf zur ärztlichen Prüfung; keine validierte Nichttransport-Checkliste.
 * BvO erst nach vollständiger fallgerechter Untersuchung, plausibler
 * Niedrigrisikoeinschätzung, erforderlicher Verlaufskontrolle, gesicherter
 * Anschlussversorgung und Beachtung lokaler ärztlicher Vorgaben.
 * Die Kurzbeschreibung allein genügt nicht.
 * Verweigerung bezeichnet die tatsächliche Ablehnung indizierter dringlicher
 * Versorgung, nicht allein die Ablehnung eines Rettungswagentransports bei
 * medizinisch geeigneter alternativer Vorstellung. Transportindikation,
 * Transportart, Einwilligungsfähigkeit, Vertretung und Schutzmaßnahmen sind
 * getrennt zu prüfen. Voraussetzungen und mögliche Diagnosen sind keine
 * gesicherten Befunde; vor produktivem Einsatz ist eine fachliche Prüfung nötig.
 * Ein vollständiger Abgleich mit der nicht vorliegenden AGENTS.md steht aus.
 */


import type {
  RedflagCatalog,
  RedflagScenario,
  RedflagSignal,
  RedflagSubscenario,
} from '../types/redflags.js'

// Konsumenten können auch die Typen über dieses Datenmodul importieren.
export type {
  RedflagAggregationMode,
  RedflagApplication,
  RedflagCategory,
  RedflagCatalog,
  RedflagContent,
  RedflagScenario,
  RedflagScenarioSelection,
  RedflagSelectionTarget,
  RedflagSignal,
  RedflagSubscenario,
  ResolvedRedflagScenario,
  ScenarioId,
  SignalId,
  SubscenarioId,
} from '../types/redflags.js'

// ---------------------------------------------------------------------------
// Zentrale Warnzeichen: vorhandener Bestand unverändert, keine Ergänzungen.
// ---------------------------------------------------------------------------

export const DATA_Signals: readonly RedflagSignal[] = [

  {
    id: 'neuro-synkope-rezidiv',
    text: 'erneutem/zunehmender Bewusstseinsverlust/-eintrübung',
  },

  {
    id: 'kreislauf-ap-neu',
    text: 'zunehmenden, nicht mehr reproduzierbaren Brustschmerzen oder Ausstrahlung in Arm, Rücken oder Kiefer',
  },

  {
    id: 'atmung-luftnot',
    text: 'Luftnot',
  },

  {
    id: 'kreislauf-herzrhythmus-neu',
    text: 'Herzstolpern/Herzrasen',
  },

  {
    id: 'neuro-ausfall-neu',
    text: 'neurol. Ausfällen (Taubheit/Blässe/Kälte/Schwäche)',
  },

  {
    id: 'kreislauf-probleme-zunehmend',
    text: 'zunehmenden Kreislaufbeschwerden (Schwindel/Schwäche)',
  },

  {
    id: 'kreislauf-belastungsSchwaeche-anhaltend',
    text: 'anhaltender Schwäche',
  },

  {
    id: 'neuro-fallneigung-anhaltend',
    text: 'anhaltenden Beschwerden mit Fallneigung',
  },

  {
    id: 'neuro-kopfschmerz-zunehmend',
    text: 'zunehmende Kopfschmerzen',
  },

]

// ---------------------------------------------------------------------------
// Alphabetische Pflegeliste: Hauptszenario, danach seine Unterszenarien.
// Keine zusätzliche Eltern-/Kindliste: Maßgeblich ist ausschließlich parentId.
// Die exportierten DATA_Scenarios und DATA_Subscenarios stehen am Dateiende.
// ---------------------------------------------------------------------------

const SCENARIO_ENTRIES: readonly (RedflagScenario | RedflagSubscenario)[] = [

  // -------------------------------------------------------------------------
  // Hauptszenario: Abdominaltrauma mit Verdacht auf innere Verletzung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 8.
  {
    id: 'abdominaltrauma-innere-verletzung-verweigerung',
    name: 'Abdominaltrauma mit Verdacht auf innere Verletzung',
    requirements: 'Relevanter Mechanismus, Bauchschmerz, Druckschmerz oder Gurtmarke; initiale Kreislaufstabilität ist keine Entwarnung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akut heißes, geschwollenes Gelenk [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 111.
  {
    id: 'heisses-geschwollenes-gelenk-verweigerung',
    name: 'Akut heißes, geschwollenes Gelenk',
    requirements: 'Akute schmerzhafte Bewegungseinschränkung und Überwärmung; septische Arthritis ausschließen, nicht vorschnell als Gicht behandeln.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Belastungsreaktion ohne akute Gefährdung [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 123.
  {
    id: 'belastungsreaktion-ohne-akute-gefaehrdung-bvo',
    name: 'Akute Belastungsreaktion ohne akute Gefährdung',
    requirements: 'Nach belastendem Ereignis beruhigt und orientiert; keine Suizidalität, Psychose oder relevante Selbstvernachlässigung; Unterstützung gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Erregung/Fremdgefährdung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 129.
  {
    id: 'erregung-fremdgefaehrdung-verweigerung',
    name: 'Akute Erregung/Fremdgefährdung',
    requirements: 'Nicht sicher beherrschbare Erregung oder konkrete Gewaltgefahr; organische/toxische Ursachen und rechtliche Voraussetzungen gesondert prüfen.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Extremitätenischämie [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 42.
  {
    id: 'extremitaetenischaemie-verweigerung',
    name: 'Akute Extremitätenischämie',
    requirements: 'Plötzlich schmerzhafte, blasse/kalte Extremität mit Puls-, Sensibilitäts- oder Motorikstörung; keine traumatische Ursache notwendig.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Oligurie/Anurie ohne gesicherten Harnverhalt [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 96.
  {
    id: 'oligurie-anurie-ohne-gesicherten-harnverhalt-verweigerung',
    name: 'Akute Oligurie/Anurie ohne gesicherten Harnverhalt',
    requirements: 'Akut deutlich verminderte/fehlende Urinausscheidung gegenüber dem Ausgangszustand; mögliche Nierenschädigung, nicht bloß Blasenentleerungsstörung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Psychose mit Gefährdung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 127.
  {
    id: 'psychose-mit-gefaehrdung-verweigerung',
    name: 'Akute Psychose mit Gefährdung',
    requirements: 'Wahn/Halluzinationen mit erheblicher Eigen-/Fremdgefährdung oder aufgehobener Selbstversorgung; somatische Ursachen mitprüfen.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Sehstörung [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 64, 65; universelle Daten fehlen noch.
  {
    id: 'akute-sehstoerung-verweigerung',
    name: 'Akute Sehstörung',
    requirements: '',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Akute Sehstörung“: Akute Doppelbilder
  // Quelle: redflags_150_szenarien.md, Nr. 65.
  {
    id: 'akute-doppelbilder-verweigerung',
    parentId: 'akute-sehstoerung-verweigerung',
    name: 'Akute Doppelbilder',
    requirements: 'Neue Doppelbilder, auch ohne weitere erkennbare Ausfälle; okuläre oder neurologische Ursache dringlich abzuklären.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Akute Sehstörung“: Lichtblitze/Rußregen/Gesichtsfeldschatten
  // Quelle: redflags_150_szenarien.md, Nr. 64.
  {
    id: 'lichtblitze-russregen-gesichtsfeldschatten-verweigerung',
    parentId: 'akute-sehstoerung-verweigerung',
    name: 'Lichtblitze/Rußregen/Gesichtsfeldschatten',
    requirements: 'Neu aufgetretene Symptome, insbesondere Vorhangphänomen; dringlicher Ausschluss von Netzhautriss oder -ablösung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Stomakomplikation mit Ischämie-/Ileuszeichen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 89.
  {
    id: 'stomakomplikation-ischaemie-ileuszeichen-verweigerung',
    name: 'Akute Stomakomplikation mit Ischämie-/Ileuszeichen',
    requirements: 'Dunkles/blasses Stoma, starke Schmerzen, nicht rückläufiger Prolaps oder Förderstopp mit Erbrechen/Distension.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Suizidalität/Suizidversuch [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 126.
  {
    id: 'suizidalitaet-suizidversuch-verweigerung',
    name: 'Akute Suizidalität/Suizidversuch',
    requirements: 'Aktuelle Absicht, Vorbereitung oder kürzlicher Versuch; psychiatrische Notfallbeurteilung und gesonderte Prüfung der Einwilligungsfähigkeit.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Verwirrtheit/Delir [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 55; universelle Daten fehlen noch.
  {
    id: 'akute-verwirrtheit-delir-verweigerung',
    name: 'Akute Verwirrtheit/Delir',
    requirements: '',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Akute Verwirrtheit/Delir“: Akute Gedächtnisstörung/Amnesie
  // Quelle: redflags_150_szenarien.md, Nr. 55.
  {
    id: 'gedaechtnisstoerung-amnesie-verweigerung',
    parentId: 'akute-verwirrtheit-delir-verweigerung',
    name: 'Akute Gedächtnisstörung/Amnesie',
    requirements: 'Neue Unfähigkeit, Informationen zu behalten, oder ungeklärte Erinnerungslücke; nicht vorschnell als harmlose transiente Amnesie einstufen.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akuter Hodenschmerz/Torsionsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 92.
  {
    id: 'hodenschmerz-torsionsverdacht-verweigerung',
    name: 'Akuter Hodenschmerz/Torsionsverdacht',
    requirements: 'Plötzlicher einseitiger Hodenschmerz oder akute Schwellung; Hodentorsion zeitkritisch auszuschließen.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akuter Vernichtungskopfschmerz [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 52.
  {
    id: 'vernichtungskopfschmerz-verweigerung',
    name: 'Akuter Vernichtungskopfschmerz',
    requirements: 'Schlagartiger maximaler oder innerhalb weniger Minuten maximaler Kopfschmerz; Blutung/Gefäßereignis abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akutes Lungenödem (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 31.
  {
    id: 'lungenoedem-verdacht-verweigerung',
    name: 'Akutes Lungenödem (Verdacht)',
    requirements: 'Akute Dyspnoe, Orthopnoe, feuchte Atemgeräusche oder schaumiger Auswurf; mögliche kardiale Dekompensation.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Alkoholentzug mit Warnzeichen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 122.
  {
    id: 'alkoholentzug-warnzeichen-verweigerung',
    name: 'Alkoholentzug mit Warnzeichen',
    requirements: 'Tremor und vegetative Überaktivität mit Halluzinationen, Verwirrtheit, Krampfanfall oder bekannter schwerer Entzugsvorgeschichte.',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Allergische Konjunktivitis (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 58.
  {
    id: 'allergische-konjunktivitis-bekannt-bvo',
    name: 'Allergische Konjunktivitis (bekanntes Muster)',
    requirements: 'Beidseitiger Juckreiz und Tränenfluss; Visus unverändert, keine Schmerzen, Lichtscheu oder Kontaktlinsen-Risikokonstellation.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Allergische Reaktion (leicht) [BvO]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 103; universelle Daten fehlen noch.
  {
    id: 'allergische-reaktion-leicht-bvo',
    name: 'Allergische Reaktion (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Allergische Reaktion (leicht)“: Insektenstich mit ausschließlich lokaler Reaktion
  // Quelle: redflags_150_szenarien.md, Nr. 103.
  {
    id: 'insektenstich-lokal-bvo',
    parentId: 'allergische-reaktion-leicht-bvo',
    name: 'Insektenstich mit ausschließlich lokaler Reaktion',
    requirements: 'Begrenzte Reaktion an der Stichstelle; kein Stich im Mund/Rachen, keine Allgemeinreaktion oder rasche Ausbreitung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Anfallsartige Schmerzen/Invaginationsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 145.
  {
    id: 'invaginationsverdacht-verweigerung',
    name: 'Anfallsartige Schmerzen/Invaginationsverdacht',
    requirements: 'Wiederkehrende Schmerz-/Schreiphasen, Blässe, Erbrechen oder auffällige Müdigkeit; blutiger Stuhl muss nicht vorliegen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Angioödem an Zunge/Rachen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 33.
  {
    id: 'angiooedem-zunge-rachen-verweigerung',
    name: 'Angioödem an Zunge/Rachen',
    requirements: 'Zungen-, Mundboden- oder Rachenschwellung, gegebenenfalls ohne Hautausschlag; drohende Atemwegsverlegung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Arthroseschmerz (bekanntes, leichtes Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 2.
  {
    id: 'arthroseschmerz-leicht-bvo',
    name: 'Arthroseschmerz (bekanntes, leichtes Muster)',
    requirements: 'Bekannte Arthrose, übliche Beschwerden, belastbar; kein Trauma, heißes Gelenk, Fieber oder neuer Funktionsverlust.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Aspiration von Erbrochenem/Nahrung mit Atembeschwerden [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 29.
  {
    id: 'aspiration-erbrochenes-nahrung-atembeschwerden-verweigerung',
    name: 'Aspiration von Erbrochenem/Nahrung mit Atembeschwerden',
    requirements: 'Nach Aspirationsereignis anhaltender Husten, Rasseln, Hypoxie oder Luftnot; nicht bloß kurzzeitiges Räuspern.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Atemnot unklarer Ursache [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 27.
  {
    id: 'atemnot-unklare-ursache-verweigerung',
    name: 'Atemnot unklarer Ursache',
    requirements: 'Neue oder anhaltende Atemnot ohne hinreichend geklärte harmlose Ursache; keine BvO allein wegen normaler Sauerstoffsättigung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Augenverätzung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 61.
  {
    id: 'augenveraetzung-verweigerung',
    name: 'Augenverätzung',
    requirements: 'Säure-/Laugenkontakt oder unbekannte Chemikalie im Auge; sofortige Versorgung und dringliche augenärztliche Kontrolle.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ausfall der Heimbeatmung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 35.
  {
    id: 'heimbeatmung-ausfall-verweigerung',
    name: 'Ausfall der Heimbeatmung',
    requirements: 'Beatmungsabhängiger Patient ohne zuverlässig funktionierenden Ersatz; erneuter Ausfall oder Ateminsuffizienz zu befürchten.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Avulsion eines bleibenden Zahns [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 74.
  {
    id: 'avulsion-bleibender-zahn-verweigerung',
    name: 'Avulsion eines bleibenden Zahns',
    requirements: 'Bleibender Zahn ausgeschlagen; zeitkritische zahnärztliche Versorgung wird abgelehnt, unabhängig von der geeigneten Transportart.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Balanitis (lokal begrenzt) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 90.
  {
    id: 'balanitis-lokal-bvo',
    name: 'Balanitis (lokal begrenzt)',
    requirements: 'Leichte lokale Rötung/Beschwerden; freie Miktion, kein Fieber, keine Paraphimose oder rasche Ausbreitung; Arztkontakt geplant.',
    application: 'BvO',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bauchschmerzen (leicht) [BvO]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 76, 77, 78; universelle Daten fehlen noch.
  {
    id: 'bauchschmerzen-leicht-bvo',
    name: 'Bauchschmerzen (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (leicht)“: Obstipation ohne Ileuszeichen
  // Quelle: redflags_150_szenarien.md, Nr. 77.
  {
    id: 'obstipation-ohne-ileuszeichen-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Obstipation ohne Ileuszeichen',
    requirements: 'Bekanntes Problem, milde Beschwerden, Windabgang; kein Erbrechen, gebläht-schmerzhaftes Abdomen, Fieber oder Blut.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (leicht)“: Refluxbeschwerden (bekanntes Muster)
  // Quelle: redflags_150_szenarien.md, Nr. 76.
  {
    id: 'refluxbeschwerden-bekannt-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Refluxbeschwerden (bekanntes Muster)',
    requirements: 'Gesicherter Reflux, typische leichte Beschwerden; keine Blutung, Dysphagie oder plausible kardiale Ursache; nicht allein durch Antazidawirkung begründet.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (leicht)“: Reizdarmbeschwerden (bekannter leichter Schub)
  // Quelle: redflags_150_szenarien.md, Nr. 78.
  {
    id: 'reizdarmbeschwerden-leicht-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Reizdarmbeschwerden (bekannter leichter Schub)',
    requirements: 'Gesicherte Diagnose, unverändertes Muster; keine Blutung, nächtlich neue Beschwerden, Fieber oder Gewichtsverlust.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bauchschmerzen (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 82, 83, 84, 85, 86; universelle Daten fehlen noch.
  {
    id: 'bauchschmerzen-schwer-verweigerung',
    name: 'Bauchschmerzen (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (schwer)“: Akute Pankreatitis (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 83.
  {
    id: 'pankreatitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Akute Pankreatitis (Verdacht)',
    requirements: 'Anhaltender starker Oberbauchschmerz, gegebenenfalls Rückenausstrahlung und Erbrechen; Diagnose präklinisch nicht gesichert.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (schwer)“: Appendizitis (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 84.
  {
    id: 'appendizitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Appendizitis (Verdacht)',
    requirements: 'Progredienter, häufig rechtsseitiger Unterbauchschmerz mit passender Anamnese; fehlendes Fieber schließt sie nicht aus.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (schwer)“: Cholezystitis/Cholangitis (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 82.
  {
    id: 'cholezystitis-cholangitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Cholezystitis/Cholangitis (Verdacht)',
    requirements: 'Anhaltender rechter Oberbauchschmerz, insbesondere mit Fieber oder Ikterus; keine bloß abgeklungene bekannte Kolik.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (schwer)“: Ileus/Darmverschluss (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 85.
  {
    id: 'ileus-darmverschluss-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Ileus/Darmverschluss (Verdacht)',
    requirements: 'Erbrechen, Distension, kolikartige oder anhaltende Schmerzen und ausbleibender Wind-/Stuhlabgang.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Bauchschmerzen (schwer)“: Inkarzerierte Hernie (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 86.
  {
    id: 'inkarzerierte-hernie-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Inkarzerierte Hernie (Verdacht)',
    requirements: 'Neu schmerzhafte, nicht rückläufige Bruchvorwölbung, gegebenenfalls Erbrechen; mögliche Darmischämie.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Beckentrauma mit Frakturverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 9.
  {
    id: 'beckentrauma-frakturverdacht-verweigerung',
    name: 'Beckentrauma mit Frakturverdacht',
    requirements: 'Beckenschmerz nach Trauma, eingeschränkte Belastbarkeit oder relevanter Unfallmechanismus; Risiko verdeckter Blutung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bedrohliche Elektrolytstörung (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 100.
  {
    id: 'elektrolytstoerung-bedrohlich-verdacht-verweigerung',
    name: 'Bedrohliche Elektrolytstörung (Verdacht)',
    requirements: 'Passender aktueller Laborbefund, EKG-Veränderung oder klinischer Verdacht, etwa bei Dialyseversäumnis mit Schwäche/Arrhythmie.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Blitzunfall [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 22.
  {
    id: 'blitzunfall-verweigerung',
    name: 'Blitzunfall',
    requirements: 'Direkter oder indirekter Blitzkontakt; mögliche kardiale, neurologische, akustische und traumatische Schäden.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bolusobstruktion der Speiseröhre [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 87.
  {
    id: 'bolusobstruktion-speiseroehre-verweigerung',
    name: 'Bolusobstruktion der Speiseröhre',
    requirements: 'Speisebolus steckt fest, Schlucken beziehungsweise Speichelschlucken nicht möglich; keine gewöhnliche Refluxsymptomatik.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bronchiolitis mit Warnzeichen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 143.
  {
    id: 'bronchiolitis-warnzeichen-verweigerung',
    name: 'Bronchiolitis mit Warnzeichen',
    requirements: 'Atempausen, erhöhte Atemarbeit, Hypoxie oder relevante Trinkschwäche; besonders bei sehr jungen/frühgeborenen Säuglingen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Chemische Hautverätzung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 25.
  {
    id: 'chemische-hautveraetzung-verweigerung',
    name: 'Chemische Hautverätzung',
    requirements: 'Relevanter Säure-/Laugenkontakt oder besonders gefährlicher Stoff; nach Dekontamination weiterhin fachärztlicher Beurteilungsbedarf.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Chronische Beinödeme (unverändert) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 37.
  {
    id: 'chronische-beinoedeme-unveraendert-bvo',
    name: 'Chronische Beinödeme (unverändert)',
    requirements: 'Bekannte beidseitige Ödeme auf Ausgangsniveau; keine Dyspnoe, neue Asymmetrie, Rötung, Schmerzen oder akute Gewichtszunahme.',
    application: 'BvO',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Clusterkopfschmerz (bekannte, beendete Attacke) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 50.
  {
    id: 'clusterkopfschmerz-attacke-beendet-bvo',
    name: 'Clusterkopfschmerz (bekannte, beendete Attacke)',
    requirements: 'Gesicherte Diagnose und individueller Therapieplan; typische Attacke beendet, keine neuen Befunde.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Depressive Beschwerden ohne akuten Gefährdungsbefund [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 125.
  {
    id: 'depressive-beschwerden-ohne-akute-gefaehrdung-bvo',
    name: 'Depressive Beschwerden ohne akuten Gefährdungsbefund',
    requirements: 'Nach sorgfältiger Exploration keine akute Suizidalität/Psychose; Selbstversorgung, Unterstützung und verbindliche Anschlussversorgung gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dialyseshuntblutung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 46.
  {
    id: 'dialyseshuntblutung-verweigerung',
    name: 'Dialyseshuntblutung',
    requirements: 'Anhaltende oder wiederkehrende Blutung aus Fistel/Graft; Risiko erheblichen Blutverlustes.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dislozierte Gastrostomie-/PEG-Sonde [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 88.
  {
    id: 'gastrostomie-peg-sonde-disloziert-verweigerung',
    name: 'Dislozierte Gastrostomie-/PEG-Sonde',
    requirements: 'Sonde herausgerutscht oder Lage unklar; zeitkritische Beurteilung des Zugangs, besonders bei frischer Anlage.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dysmenorrhoe (bekanntes, übliches Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 130.
  {
    id: 'dysmenorrhoe-bekannt-bvo',
    name: 'Dysmenorrhoe (bekanntes, übliches Muster)',
    requirements: 'Vertraute zyklusbezogene Schmerzen, beherrschbar; Schwangerschaft ausreichend ausgeschlossen, keine ungewöhnliche Blutung, neuen einseitigen Schmerzen oder Infektzeichen.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Epiglottitis (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 72.
  {
    id: 'epiglottitis-verdacht-verweigerung',
    name: 'Epiglottitis (Verdacht)',
    requirements: 'Starke Schluckbeschwerden, Speichelfluss, auffällige Stimme, Stridor oder Atemnot; keine gewöhnliche Halsentzündung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Erfrierung mit Gewebeschädigungsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 20.
  {
    id: 'erfrierung-gewebeschaedigungsverdacht-verweigerung',
    name: 'Erfrierung mit Gewebeschädigungsverdacht',
    requirements: 'Anhaltende Gefühllosigkeit, harte/blasse Haut oder Blasen nach Kälteeinwirkung; Tiefe der Schädigung unklar.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ertrinkungsunfall mit Atembeeinträchtigung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 24.
  {
    id: 'ertrinkungsunfall-atembeeintraechtigung-verweigerung',
    name: 'Ertrinkungsunfall mit Atembeeinträchtigung',
    requirements: 'Nach Untertauchen Husten, Atemnot, Hypoxie oder vorausgegangene Atemstörung; zwischenzeitliche Besserung genügt nicht zur Entwarnung.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Erysipel/Zellulitis mit systemischen Zeichen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 109.
  {
    id: 'erysipel-zellulitis-systemisch-verweigerung',
    name: 'Erysipel/Zellulitis mit systemischen Zeichen',
    requirements: 'Ausbreitende Rötung mit Fieber, Schüttelfrost, deutlicher Schwäche oder Kreislaufauffälligkeit.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Extrauteringravidität (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 133.
  {
    id: 'extrauteringraviditaet-verdacht-verweigerung',
    name: 'Extrauteringravidität (Verdacht)',
    requirements: 'Mögliche Schwangerschaft mit Unterbauchschmerz, insbesondere einseitig, Schulterschmerz, Kollaps oder Blutung; Blutung kann fehlen.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Extremitätenverletzung (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 13, 15; universelle Daten fehlen noch.
  {
    id: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Extremitätenverletzung (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Extremitätenverletzung (schwer)“: Akutes Kompartmentsyndrom (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 13.
  {
    id: 'kompartmentsyndrom-verdacht-verweigerung',
    parentId: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Akutes Kompartmentsyndrom (Verdacht)',
    requirements: 'Unverhältnismäßiger zunehmender Schmerz, gespannte Schwellung, Dehnungsschmerz oder Sensibilitätsstörung; erhaltene Pulse schließen es nicht aus.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Extremitätenverletzung (schwer)“: Amputationsverletzung
  // Quelle: redflags_150_szenarien.md, Nr. 15.
  {
    id: 'amputationsverletzung-verweigerung',
    parentId: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Amputationsverletzung',
    requirements: 'Vollständige oder teilweise Abtrennung eines Körperteils; Blutungsversorgung und zeitkritische operative Beurteilung erforderlich.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieber beim Säugling unter drei Monaten [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 142.
  // Die Unterfalltabelle nennt „Kindlicher Infekt (leicht)“, die Szenariotabelle
  // aber ausdrücklich Verweigerung. Dieser Elternknoten fehlt im Beispielset;
  // seine Anwendung und universellen Voraussetzungen sind nicht mitgeliefert.
  // Bis zur Klärung eigenständig, statt eine ungesicherte Elternzuordnung
  // oder eine abweichende Anwendung zu erfinden.
  {
    id: 'fieber-saeugling-unter-drei-monaten-verweigerung',
    name: 'Fieber beim Säugling unter drei Monaten',
    requirements: 'Gemessene Temperatur ab 38 °C; auch bei zunächst gutem Eindruck dringend kinderärztlich abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieber/Infekt/Sepsis [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 112; universelle Daten fehlen noch.
  {
    id: 'fieber-infekt-sepsis-verweigerung',
    name: 'Fieber/Infekt/Sepsis',
    requirements: '',
    application: 'Verweigerung',
    category: 'infekt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Fieber/Infekt/Sepsis“: Fieber bei Neutropenie/ausgeprägter Immunsuppression
  // Quelle: redflags_150_szenarien.md, Nr. 112.
  {
    id: 'fieber-neutropenie-immunsuppression-verweigerung',
    parentId: 'fieber-infekt-sepsis-verweigerung',
    name: 'Fieber bei Neutropenie/ausgeprägter Immunsuppression',
    requirements: 'Fieber oder klinische Verschlechterung unter entsprechender Therapie/Risikokonstellation; diskrete Befunde können schwere Infektion verbergen.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieberhafter Infekt (leicht) [BvO]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 26, 66; universelle Daten fehlen noch.
  {
    id: 'fieberhafter-infekt-leicht-bvo',
    name: 'Fieberhafter Infekt (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'infekt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Fieberhafter Infekt (leicht)“: Akute Bronchitis ohne Atemnot
  // Quelle: redflags_150_szenarien.md, Nr. 26.
  {
    id: 'bronchitis-ohne-atemnot-bvo',
    parentId: 'fieberhafter-infekt-leicht-bvo',
    name: 'Akute Bronchitis ohne Atemnot',
    requirements: 'Leichter Husten, normale Oxygenierung und Atemarbeit; kein Pneumonieverdacht, keine Hämoptyse oder relevante Risikokonstellation.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Fieberhafter Infekt (leicht)“: Halsschmerzen ohne Schluck-/Atemstörung
  // Quelle: redflags_150_szenarien.md, Nr. 66.
  {
    id: 'halsschmerzen-ohne-schluck-atemstoerung-bvo',
    parentId: 'fieberhafter-infekt-leicht-bvo',
    name: 'Halsschmerzen ohne Schluck-/Atemstörung',
    requirements: 'Trinken möglich; keine kloßige Stimme, Kieferklemme, Speichelfluss, Halsweichteilschwellung oder schwere Allgemeinsymptome.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fremdkörperaspiration (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 28.
  {
    id: 'fremdkoerperaspiration-verdacht-verweigerung',
    name: 'Fremdkörperaspiration (Verdacht)',
    requirements: 'Verschluckereignis mit möglichem verbliebenem Atemwegsfremdkörper; auch bei vorübergehend unauffälliger Untersuchung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Galliges Erbrechen beim Kind [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 146.
  {
    id: 'galliges-erbrechen-kind-verweigerung',
    name: 'Galliges Erbrechen beim Kind',
    requirements: 'Grünes Erbrechen, insbesondere beim Neugeborenen/Säugling; Darmobstruktion bis zum Ausschluss annehmen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Geringfügige Haushaltsstoffexposition (toxikologisch abgeklärt) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 114.
  {
    id: 'haushaltsstoffexposition-abgeklaert-bvo',
    name: 'Geringfügige Haushaltsstoffexposition (toxikologisch abgeklärt)',
    requirements: 'Unbeabsichtigte Exposition, Produkt/Menge/Weg geklärt, nach erforderlichen Maßnahmen symptomfrei; Giftinformationszentrum bestätigt häusliche Beobachtung.',
    application: 'BvO',
    category: 'intox',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Halskompression/Strangulation [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 11.
  {
    id: 'halskompression-strangulation-verweigerung',
    name: 'Halskompression/Strangulation',
    requirements: 'Relevante Halskompression, insbesondere mit Heiserkeit, Schluckbeschwerden, Luftnot oder Bewusstseinsverlust; mögliche verzögerte Atemwegs- und Gefäßkomplikationen.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hämoptysen (relevant oder wiederholt) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 30.
  {
    id: 'haemoptysen-relevant-wiederholt-verweigerung',
    name: 'Hämoptysen (relevant oder wiederholt)',
    requirements: 'Bluthusten über einzelne Blutspuren hinaus, wiederholte Episoden oder zusätzliche Atemnot/Kreislaufbeschwerden.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hämorrhoidalbeschwerden ohne relevante Blutung [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 79.
  {
    id: 'haemorrhoidalbeschwerden-ohne-relevante-blutung-bvo',
    name: 'Hämorrhoidalbeschwerden ohne relevante Blutung',
    requirements: 'Bekannte leichte lokale Beschwerden; keine ungeklärte rektale Blutung, starken Schmerzen, Fieber oder Kreislaufprobleme.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Herpes zoster ohne Risikobeteiligung [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 106.
  {
    id: 'herpes-zoster-ohne-risikobeteiligung-bvo',
    name: 'Herpes zoster ohne Risikobeteiligung',
    requirements: 'Umschriebener typischer Ausschlag, guter Allgemeinzustand; kein Augen-/Ohrenbefall, keine Immunsuppression; zeitnaher Arztkontakt gesichert.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzeerkrankung mit neurologischen Auffälligkeiten [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 18.
  {
    id: 'hitzeerkrankung-neurologische-auffaelligkeiten-verweigerung',
    name: 'Hitzeerkrankung mit neurologischen Auffälligkeiten',
    requirements: 'Hitzeexposition mit Verwirrtheit, Ataxie, Krampfanfall oder Bewusstseinsstörung; Hitzschlagverdacht.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzeerschöpfung (vollständig gebessert) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 17.
  {
    id: 'hitzeerschoepfung-gebessert-bvo',
    name: 'Hitzeerschöpfung (vollständig gebessert)',
    requirements: 'Nach Kühlung und Trinken anhaltend erholt, Temperatur und Vitalwerte unauffällig; zu keinem Zeitpunkt neurologische Auffälligkeiten.',
    application: 'BvO',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzekrämpfe (vollständig rückläufig) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 16.
  {
    id: 'hitzekraempfe-ruecklaeufig-bvo',
    name: 'Hitzekrämpfe (vollständig rückläufig)',
    requirements: 'Nach Belastungsende und angemessener Flüssigkeitsaufnahme beschwerdefrei; keine Überwärmung, Schwäche, Verwirrtheit oder dunkler Urin.',
    application: 'BvO',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hyperglykämie (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 102; universelle Daten fehlen noch.
  {
    id: 'hyperglykaemie-schwer-verweigerung',
    name: 'Hyperglykämie (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Hyperglykämie (schwer)“: Diabetische Ketoazidose (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 102.
  {
    id: 'diabetische-ketoazidose-verdacht-verweigerung',
    parentId: 'hyperglykaemie-schwer-verweigerung',
    name: 'Diabetische Ketoazidose (Verdacht)',
    requirements: 'Diabetes mit Übelkeit, Bauchschmerz, Dehydratation oder tiefer Atmung; auch bei wachem Patienten und nicht stark erhöhtem Blutzucker.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: ICD-Schockabgabe mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 45.
  {
    id: 'icd-schockabgabe-risikomerkmale-verweigerung',
    name: 'ICD-Schockabgabe mit Risikomerkmalen',
    requirements: 'Mehrere Schocks, anhaltende Beschwerden, Synkope oder Rhythmusstörung; dringliche kardiale und Gerätebeurteilung erforderlich.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Intoxikation (unklar) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 115, 116, 117, 118, 119, 121; universelle Daten fehlen noch.
  {
    id: 'intoxikation-unklar-verweigerung',
    name: 'Intoxikation (unklar)',
    requirements: '',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Giftpilzaufnahme (möglich)
  // Quelle: redflags_150_szenarien.md, Nr. 121.
  {
    id: 'giftpilzaufnahme-moeglich-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Giftpilzaufnahme (möglich)',
    requirements: 'Nicht sicher bestimmte Pilze oder verdächtiger Verlauf; Giftinformationszentrum einschalten, mögliche lange Symptomlatenz berücksichtigen.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Opioidintoxikation nach Antagonisierung
  // Quelle: redflags_150_szenarien.md, Nr. 115.
  {
    id: 'opioidintoxikation-nach-antagonisierung-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Opioidintoxikation nach Antagonisierung',
    requirements: 'Aktuell gebessert, aber erneute Atemdepression oder Mischintoxikation möglich; erforderliche Überwachung wird abgelehnt.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Paracetamolüberdosierung (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 118.
  {
    id: 'paracetamolueberdosierung-verdacht-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Paracetamolüberdosierung (Verdacht)',
    requirements: 'Potenziell toxische Menge, wiederholte Überdosierung oder unklare Menge; anfängliche Beschwerdefreiheit schließt Organschädigung nicht aus.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Sedativa-/Mischintoxikation
  // Quelle: redflags_150_szenarien.md, Nr. 116.
  {
    id: 'sedativa-mischintoxikation-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Sedativa-/Mischintoxikation',
    requirements: 'Benzodiazepine, Schlafmittel oder Kombination mit Alkohol/anderen Substanzen; Atemdepression und verzögerte Verschlechterung möglich.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Stimulanzienintoxikation
  // Quelle: redflags_150_szenarien.md, Nr. 117.
  {
    id: 'stimulanzienintoxikation-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Stimulanzienintoxikation',
    requirements: 'Stimulanzienkonsum mit Thoraxschmerz, ausgeprägter Tachykardie, Überwärmung, Agitation oder neurologischen Symptomen.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Intoxikation (unklar)“: Verschlucken einer ätzenden Substanz
  // Quelle: redflags_150_szenarien.md, Nr. 119.
  {
    id: 'aetzende-substanz-verschluckt-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Verschlucken einer ätzenden Substanz',
    requirements: 'Säure/Lauge oder entsprechend verdächtiges Produkt; fehlende sichtbare Mundverletzung ist keine sichere Entwarnung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kind mit akuter Belastungsverweigerung eines Beins [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 150.
  {
    id: 'kind-belastungsverweigerung-bein-verweigerung',
    name: 'Kind mit akuter Belastungsverweigerung eines Beins',
    requirements: 'Plötzliches Nichtauftreten, insbesondere mit Schmerzen, Fieber oder Bewegungseinschränkung; okkulte Verletzung oder Gelenkinfektion abklären.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kleiner oberflächlicher Hautabszess ohne Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 108.
  {
    id: 'hautabszess-klein-oberflaechlich-bvo',
    name: 'Kleiner oberflächlicher Hautabszess ohne Warnzeichen',
    requirements: 'Klein und lokal begrenzt, kein Fieber/Progress; nicht an Gesicht, Hand oder Genital-/Perianalregion; ärztliche Behandlung am selben Tag organisiert.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kohlenmonoxidexposition ohne Brandereignis [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 120.
  {
    id: 'kohlenmonoxidexposition-ohne-brand-verweigerung',
    name: 'Kohlenmonoxidexposition ohne Brandereignis',
    requirements: 'Plausible CO-Exposition ohne ausreichende toxikologische Entwarnung; normale konventionelle Pulsoxymetrie schließt eine Vergiftung nicht aus.',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kontaktdermatitis (lokal begrenzt) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 104.
  {
    id: 'kontaktdermatitis-lokal-bvo',
    name: 'Kontaktdermatitis (lokal begrenzt)',
    requirements: 'Plausibler Hautkontakt, lokale Rötung/Juckreiz; keine Schleimhautbeteiligung, Blasenablösung oder Allgemeinsymptome.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Krampfanfall (neues Muster/erstmalig) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 144; universelle Daten fehlen noch.
  {
    id: 'krampfanfall-neues-muster-erstmalig-verweigerung',
    name: 'Krampfanfall (neues Muster/erstmalig)',
    requirements: '',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Krampfanfall (neues Muster/erstmalig)“: Fieberkrampf (erstmalig oder atypisch)
  // Quelle: redflags_150_szenarien.md, Nr. 144.
  {
    id: 'fieberkrampf-erstmalig-atypisch-verweigerung',
    parentId: 'krampfanfall-neues-muster-erstmalig-verweigerung',
    name: 'Fieberkrampf (erstmalig oder atypisch)',
    requirements: 'Erster Fieberkrampf, fokaler/prolongierter Anfall, Wiederholung oder unvollständige Erholung; kinderärztliche Akutbeurteilung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Leichter Flüssigkeitsmangel (vollständig ausgeglichen) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 98.
  {
    id: 'fluessigkeitsmangel-ausgeglichen-bvo',
    name: 'Leichter Flüssigkeitsmangel (vollständig ausgeglichen)',
    requirements: 'Plausibel geringe Trinkmenge, nach oralem Trinken beschwerdefrei; normale Ausscheidung/Vitalwerte, keine fortdauernden Verluste oder besondere Risiken.',
    application: 'BvO',
    category: 'stoffwechsel',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Liquorshunt-Komplikation (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 57.
  {
    id: 'liquorshunt-komplikation-verdacht-verweigerung',
    name: 'Liquorshunt-Komplikation (Verdacht)',
    requirements: 'Hydrozephalus-Shunt mit neuen Kopfschmerzen, Erbrechen, Fieber oder Verhaltens-/Vigilanzänderung.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Lungenembolie (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 40.
  {
    id: 'lungenembolie-verdacht-verweigerung',
    name: 'Lungenembolie (Verdacht)',
    requirements: 'Neue Dyspnoe, pleuritischer Schmerz, Synkope oder Hämoptyse mit passender Risikokonstellation.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Makrohämaturie mit Koageln/Abflussstörung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 91.
  {
    id: 'makrohaematurie-koagel-abflussstoerung-verweigerung',
    name: 'Makrohämaturie mit Koageln/Abflussstörung',
    requirements: 'Sichtbares Blut mit Gerinnseln, erschwerter Miktion, Retention oder anhaltend erheblicher Blutung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Manische Episode mit Gefährdung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 128.
  {
    id: 'manische-episode-mit-gefaehrdung-verweigerung',
    name: 'Manische Episode mit Gefährdung',
    requirements: 'Enthemmung, erheblich vermindertes Schlafbedürfnis, Realitätsverlust oder riskantes Verhalten; dringliche psychiatrische Beurteilung.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Medikamenteneinnahmefehler (toxikologisch niedriges Risiko) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 113.
  {
    id: 'medikamenteneinnahmefehler-niedrigrisiko-bvo',
    name: 'Medikamenteneinnahmefehler (toxikologisch niedriges Risiko)',
    requirements: 'Wirkstoff, Dosis und Zeitpunkt sicher bekannt; Giftinformationszentrum bestätigt häusliche Beobachtung; keine absichtliche Selbstschädigung.',
    application: 'BvO',
    category: 'intox',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Meningitis-/Enzephalitisverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 54.
  {
    id: 'meningitis-enzephalitis-verdacht-verweigerung',
    name: 'Meningitis-/Enzephalitisverdacht',
    requirements: 'Kopfschmerz mit Fieber, Meningismus, Bewusstseinsänderung, Krampfanfall oder verdächtigen Hautblutungen.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Migräne (bekanntes, unverändertes Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 49.
  {
    id: 'migraene-bekannt-unveraendert-bvo',
    name: 'Migräne (bekanntes, unverändertes Muster)',
    requirements: 'Ärztlich bekannte Migräne, vertrauter Verlauf, deutliche Besserung; keine neue/atypische Aura oder sonstigen Warnzeichen.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nabelschnurvorfall (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 137.
  {
    id: 'nabelschnurvorfall-verdacht-verweigerung',
    name: 'Nabelschnurvorfall (Verdacht)',
    requirements: 'Nach Blasensprung sicht-/tastbare Nabelschnur oder entsprechender begründeter Verdacht; unmittelbarer geburtshilflicher Notfall.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nachblutung nach Tonsillenoperation [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 70.
  {
    id: 'nachblutung-tonsillenoperation-verweigerung',
    name: 'Nachblutung nach Tonsillenoperation',
    requirements: 'Frisches Blut aus Mund/Rachen nach Tonsillenoperation; auch eine aktuell sistierte Blutung ist abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nachblutung nach Zahnextraktion (vollständig gestillt) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 69.
  {
    id: 'nachblutung-zahnextraktion-gestillt-bvo',
    name: 'Nachblutung nach Zahnextraktion (vollständig gestillt)',
    requirements: 'Anhaltende Blutstillung nach lokaler Maßnahme; keine relevante Blutmenge, Kreislaufstörung oder besondere Gerinnungsrisiken; Kontrollplan vorhanden.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nebennierenkrise (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 101.
  {
    id: 'nebennierenkrise-verdacht-verweigerung',
    name: 'Nebennierenkrise (Verdacht)',
    requirements: 'Nebenniereninsuffizienz oder relevante Steroidvorgeschichte mit Hypotonie, Erbrechen, schwerer Schwäche oder Bewusstseinsänderung.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nekrotisierende Weichteilinfektion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 110.
  {
    id: 'nekrotisierende-weichteilinfektion-verdacht-verweigerung',
    name: 'Nekrotisierende Weichteilinfektion (Verdacht)',
    requirements: 'Unverhältnismäßiger Schmerz, rasche Progression, livide Haut/Blasen oder schweres Krankheitsgefühl.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Neuer Kopfschmerz mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 53.
  {
    id: 'kopfschmerz-neu-risikomerkmale-verweigerung',
    name: 'Neuer Kopfschmerz mit Risikomerkmalen',
    requirements: 'Neuer oder deutlich veränderter Kopfschmerz mit neurologischen Zeichen, Fieber, Immunsuppression, Tumoranamnese oder anderen Warnzeichen.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Neurodermitisschub (bekannt und leicht) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 105.
  {
    id: 'neurodermitisschub-leicht-bvo',
    name: 'Neurodermitisschub (bekannt und leicht)',
    requirements: 'Vertrautes Hautbild, beherrschbarer Juckreiz; kein Fieber, schmerzhafte Bläschen, großflächige Verschlechterung oder Superinfektionsverdacht.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Oberflächliche Augenreizung (vollständig abgeklungen) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 60.
  {
    id: 'augenreizung-vollstaendig-abgeklungen-bvo',
    name: 'Oberflächliche Augenreizung (vollständig abgeklungen)',
    requirements: 'Nach Spülung beschwerdefrei und Visus normal; kein Chemikalienkontakt, Hochgeschwindigkeitsfremdkörper, Trauma oder Kontaktlinsenproblem.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Odontogene Mundboden-/Gesichtsschwellung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 75.
  {
    id: 'odontogene-mundboden-gesichtsschwellung-verweigerung',
    name: 'Odontogene Mundboden-/Gesichtsschwellung',
    requirements: 'Zahnbezogene zunehmende Schwellung, besonders mit Schluckstörung, Kieferklemme, Fieber oder Atemwegsbeteiligung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Offene Wunde (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 5, 6; universelle Daten fehlen noch.
  {
    id: 'offene-wunde-schwer-verweigerung',
    name: 'Offene Wunde (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Offene Wunde (schwer)“: Bissverletzung mit tiefer Gewebebeteiligung
  // Quelle: redflags_150_szenarien.md, Nr. 5.
  {
    id: 'bissverletzung-tief-verweigerung',
    parentId: 'offene-wunde-schwer-verweigerung',
    name: 'Bissverletzung mit tiefer Gewebebeteiligung',
    requirements: 'Tiefe Verletzung, insbesondere an Hand oder Gelenk; mögliche Sehnen-, Nerven-, Gefäß- oder Gelenkbeteiligung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Offene Wunde (schwer)“: Hochdruckinjektionsverletzung
  // Quelle: redflags_150_szenarien.md, Nr. 6.
  {
    id: 'hochdruckinjektionsverletzung-verweigerung',
    parentId: 'offene-wunde-schwer-verweigerung',
    name: 'Hochdruckinjektionsverletzung',
    requirements: 'Farbe, Fett oder andere Stoffe unter Druck ins Gewebe eingebracht; auch bei kleiner Eintrittswunde dringlicher chirurgischer Verdacht.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ohrenschmerzen ohne Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 67.
  {
    id: 'ohrenschmerzen-ohne-warnzeichen-bvo',
    name: 'Ohrenschmerzen ohne Warnzeichen',
    requirements: 'Leichte Schmerzen; keine Mastoidrötung/-schwellung, Fazialisparese, plötzliche Hörminderung, starke Schwindelsymptomatik oder schwere Allgemeinsymptome.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ovarialtorsion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 134.
  {
    id: 'ovarialtorsion-verdacht-verweigerung',
    name: 'Ovarialtorsion (Verdacht)',
    requirements: 'Akuter einseitiger Unterbauchschmerz, häufig mit Übelkeit/Erbrechen; zeitkritische gynäkologische Abklärung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Palpitationen/Herzrasen (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 44; universelle Daten fehlen noch.
  {
    id: 'palpitationen-herzrasen-schwer-verweigerung',
    name: 'Palpitationen/Herzrasen (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Palpitationen/Herzrasen (schwer)“: Neu aufgetretenes Vorhofflimmern mit Beschwerden
  // Quelle: redflags_150_szenarien.md, Nr. 44.
  {
    id: 'vorhofflimmern-neu-mit-beschwerden-verweigerung',
    parentId: 'palpitationen-herzrasen-schwer-verweigerung',
    name: 'Neu aufgetretenes Vorhofflimmern mit Beschwerden',
    requirements: 'Neu dokumentierte absolute Arrhythmie mit anhaltenden Beschwerden; Frequenz, Beginn und Begleiterkrankungen müssen beurteilt werden.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Paraphimose [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 93.
  {
    id: 'paraphimose-verweigerung',
    name: 'Paraphimose',
    requirements: 'Zurückgezogene Vorhaut lässt sich nicht zurückführen, Eichel/Vorhaut schwillt an; Ischämierisiko.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Penetrierende Augenverletzung (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 62.
  {
    id: 'penetrierende-augenverletzung-verdacht-verweigerung',
    name: 'Penetrierende Augenverletzung (Verdacht)',
    requirements: 'Spitzer Gegenstand oder Hochgeschwindigkeitsfremdkörper; auch bei unscheinbarer äußerer Verletzung.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Penetrierende Rumpfverletzung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 7.
  {
    id: 'penetrierende-rumpfverletzung-verweigerung',
    name: 'Penetrierende Rumpfverletzung',
    requirements: 'Stich-, Schuss- oder Pfählungsverletzung; äußere Wundgröße erlaubt keine verlässliche Beurteilung innerer Schäden.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Peritonealdialyse-assoziierte Peritonitis (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 97.
  {
    id: 'peritonealdialyse-peritonitis-verdacht-verweigerung',
    name: 'Peritonealdialyse-assoziierte Peritonitis (Verdacht)',
    requirements: 'Trübes Dialysat und/oder neuer Bauchschmerz, gegebenenfalls Fieber; sofortiger Kontakt zum Dialysezentrum und Akutabklärung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Peritonsillar-/tiefer Halsabszess (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 71.
  {
    id: 'peritonsillar-tiefer-halsabszess-verdacht-verweigerung',
    name: 'Peritonsillar-/tiefer Halsabszess (Verdacht)',
    requirements: 'Einseitige starke Schmerzen, Kieferklemme, kloßige Stimme oder Schluckbehinderung; mögliche Atemwegsgefährdung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Plötzliche Hörminderung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 73.
  {
    id: 'ploetzliche-hoerminderung-verweigerung',
    name: 'Plötzliche Hörminderung',
    requirements: 'Akuter ungeklärter Hörverlust ohne offensichtliche äußere Ursache; dringliche HNO-Beurteilung, bei neurologischen Zeichen Schlaganfallpfad.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Postoperative Nachblutung (anhaltend/relevant) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 14.
  {
    id: 'postoperative-nachblutung-verweigerung',
    name: 'Postoperative Nachblutung (anhaltend/relevant)',
    requirements: 'Frische Operation mit wiederkehrender oder anhaltender Blutung, zunehmendem Hämatom oder Kreislaufbeschwerden.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Priapismus (Ischämieverdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 94.
  {
    id: 'priapismus-ischaemieverdacht-verweigerung',
    name: 'Priapismus (Ischämieverdacht)',
    requirements: 'Schmerzhafte anhaltende Erektion, insbesondere seit etwa vier Stunden; bei Risikokonstellation bereits früher dringlich.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pseudokrupp (leicht, ohne Ruhestridor) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 140.
  {
    id: 'pseudokrupp-leicht-ohne-ruhestridor-bvo',
    name: 'Pseudokrupp (leicht, ohne Ruhestridor)',
    requirements: 'Typischer bellender Husten; keine Einziehungen, Hypoxie oder Trinkstörung, kein Adrenalinbedarf; zuverlässige Beobachtung und ärztlicher Behandlungsplan.',
    application: 'BvO',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pseudokrupp mit Ruhestridor [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 141.
  {
    id: 'pseudokrupp-mit-ruhestridor-verweigerung',
    name: 'Pseudokrupp mit Ruhestridor',
    requirements: 'Stridor in Ruhe, relevante Einziehungen, Erschöpfung oder notwendige Adrenalininhalation mit anschließendem Überwachungsbedarf.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pyelonephritis mit kompliziertem Verlauf (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 95.
  {
    id: 'pyelonephritis-kompliziert-verdacht-verweigerung',
    name: 'Pyelonephritis mit kompliziertem Verlauf (Verdacht)',
    requirements: 'Flankenschmerz und Fieber mit Erbrechen, fehlender Trinkfähigkeit, Obstruktionsverdacht oder deutlichen Allgemeinsymptomen.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Quetschtrauma mit Crush-Risiko [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 12.
  {
    id: 'quetschtrauma-crush-risiko-verweigerung',
    name: 'Quetschtrauma mit Crush-Risiko',
    requirements: 'Längere Einklemmung oder erhebliche Muskelquetschung; Gefahr von Rhabdomyolyse, Elektrolytstörung und Nierenschädigung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Rasch progrediente Muskelschwäche [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 56.
  {
    id: 'muskelschwaeche-rasch-progredient-verweigerung',
    name: 'Rasch progrediente Muskelschwäche',
    requirements: 'Zunehmende, insbesondere symmetrische Schwäche, gegebenenfalls Schluck- oder Atemstörung; neuromuskuläre Krise möglich.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Reisekrankheit (vollständig abgeklungen) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 81.
  {
    id: 'reisekrankheit-abgeklungen-bvo',
    name: 'Reisekrankheit (vollständig abgeklungen)',
    requirements: 'Klarer Bewegungsreiz, nach dessen Ende beschwerdefrei; keine neurologischen Auffälligkeiten, Bauchschmerzen oder Dehydratation.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schlaflosigkeit ohne akute psychiatrische Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 124.
  {
    id: 'schlaflosigkeit-ohne-akute-warnzeichen-bvo',
    name: 'Schlaflosigkeit ohne akute psychiatrische Warnzeichen',
    requirements: 'Keine Manie, Psychose, Suizidalität, Intoxikation oder Entzug; Versorgung und zeitnaher Arztkontakt gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schmerzhaft gerötetes Auge [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 63.
  {
    id: 'schmerzhaft-geroetetes-auge-verweigerung',
    name: 'Schmerzhaft gerötetes Auge',
    requirements: 'Augenschmerz mit Rötung, Lichtscheu oder Visusminderung; Glaukom, Keratitis oder Uveitis möglich.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schrittmacherstörung mit Beschwerden [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 47.
  {
    id: 'schrittmacherstoerung-mit-beschwerden-verweigerung',
    name: 'Schrittmacherstörung mit Beschwerden',
    requirements: 'Präsynkope, Synkope oder Bradykardie bei möglicher Gerätefehlfunktion; keine bloße unbestätigte Gerätewarnung.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schwangerschaftsübelkeit ohne Dehydratation [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 131.
  {
    id: 'schwangerschaftsuebelkeit-ohne-dehydratation-bvo',
    name: 'Schwangerschaftsübelkeit ohne Dehydratation',
    requirements: 'Leichte Beschwerden, ausreichendes Trinken/Essen; kein Gewichtsverlust, Bauchschmerz, Blutung oder anhaltendes Erbrechen.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schwere Exsikkose/fehlende Trinkfähigkeit [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 99.
  {
    id: 'schwere-exsikkose-fehlende-trinkfaehigkeit-verweigerung',
    name: 'Schwere Exsikkose/fehlende Trinkfähigkeit',
    requirements: 'Ausgeprägte Austrocknung, Kreislaufauffälligkeit, Oligurie oder Unfähigkeit zur ausreichenden Flüssigkeitsaufnahme.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Spannungskopfschmerz (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 48.
  {
    id: 'spannungskopfschmerz-bekannt-bvo',
    name: 'Spannungskopfschmerz (bekanntes Muster)',
    requirements: 'Üblicher leichter bis mäßiger Kopfschmerz; keine neue Qualität, neurologischen Symptome, Infektzeichen oder Risikokonstellation.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Spontanpneumothorax (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 32.
  {
    id: 'spontanpneumothorax-verdacht-verweigerung',
    name: 'Spontanpneumothorax (Verdacht)',
    requirements: 'Plötzlicher einseitiger Thoraxschmerz und/oder Atemnot ohne Trauma; klinisch nicht sicher auszuschließen.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stillassoziierte Brustbeschwerden/Mastitis (lokal leicht) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 132.
  {
    id: 'stillassoziierte-brustbeschwerden-mastitis-leicht-bvo',
    name: 'Stillassoziierte Brustbeschwerden/Mastitis (lokal leicht)',
    requirements: 'Begrenzte Beschwerden bei gutem Allgemeinzustand; kein Fieber, Abszessverdacht oder rasche Progression; zeitnahe fachliche Kontrolle.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stomaversorgungsproblem ohne Funktionsstörung [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 80.
  {
    id: 'stomaversorgungsproblem-ohne-funktionsstoerung-bvo',
    name: 'Stomaversorgungsproblem ohne Funktionsstörung',
    requirements: 'Undichte/gelöste Versorgung behoben; Stoma vital, gewohnte Förderung, kein Bauchschmerz oder relevantes Flüssigkeitsdefizit.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stromunfall mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 21.
  {
    id: 'stromunfall-risikomerkmale-verweigerung',
    name: 'Stromunfall mit Risikomerkmalen',
    requirements: 'Hochspannung, Bewusstseinsverlust, Rhythmusstörung, Thoraxbeschwerden, relevante Verbrennung oder Schwangerschaft.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Sturz ohne erkennbare Verletzung [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 1.
  {
    id: 'sturz-ohne-verletzung-bvo',
    name: 'Sturz ohne erkennbare Verletzung',
    requirements: 'Eindeutig mechanisches Stolpern, kein Kopfaufprall, keine Synkope, keine Schmerzen; Mobilität wieder auf Ausgangsniveau.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Subkonjunktivale Blutung (atraumatisch) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 59.
  {
    id: 'subkonjunktivale-blutung-atraumatisch-bvo',
    name: 'Subkonjunktivale Blutung (atraumatisch)',
    requirements: 'Scharf begrenzte schmerzlose Einblutung; normales Sehen, kein Trauma, keine weiteren Blutungszeichen oder hypertensiven Notfallzeichen.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Symptomatische Bradykardie [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 43.
  {
    id: 'symptomatische-bradykardie-verweigerung',
    name: 'Symptomatische Bradykardie',
    requirements: 'Langsamer Puls mit Schwäche, Präsynkope, Synkope, Thoraxschmerz oder Hypotonie.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Synkope [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'synkope-verweigerung',
    name: 'Synkope',
    requirements: 'unklare Genese/erstmalig',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro-synkope-rezidiv',
      'neuro-ausfall-neu',
      'kreislauf-probleme-zunehmend',
      'neuro-kopfschmerz-zunehmend',
    ],
    minorSignalIds: [
      'neuro-fallneigung-anhaltend',
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    diagnoses: [
      'Arrhythmie',
      'vasovagal./orthost. Ursache',
      'Klappenfehler',
      'TIA',
      'Krampfanfall',
      'metab. Erkrankung',
    ],
    consequences: [
      'erneuten Synkopen mit Stürzen+Verletzungen oder unerkannter pot. lebensbedrohl. Ursachen mit bleibenden Schäden oder Herztod',
    ],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Synkope (leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'synkope-bvo',
    name: 'Synkope (leicht)',
    requirements: 'kurzzeitiger Bewusstseinsverlust, vollständig erholt',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [
      'neuro-synkope-rezidiv',
      'kreislauf-ap-neu',
      'atmung-luftnot',
      'kreislauf-herzrhythmus-neu',
      'neuro-ausfall-neu',
      'kreislauf-probleme-zunehmend',
    ],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Synkope (leicht)“: Orthostatische Synkope
  // Vorhandenes orthostatisches Beispiel unverändert.
  {
    id: 'synkope-bvo-orthostatisch',
    parentId: 'synkope-bvo',
    name: 'Orthostatische Synkope',
    requirements: 'orthostatische Ursache',
    majorSignalIds: [],
    minorSignalIds: [
      'kreislauf-belastungsSchwaeche-anhaltend',
      'neuro-fallneigung-anhaltend',
    ],
    diagnoses: [
      'orthostatische Synkope',
    ],
    consequences: [],
  },

  // Unterszenario zu „Synkope (leicht)“: Vasovagale Synkope (bekanntes Niedrigrisikomuster)
  // Quelle: redflags_150_szenarien.md, Nr. 36.
  // Ersetzt Name und Beschreibung des vorhandenen vasovagalen Beispiels.
  // ID und bisherige Inhalte bleiben erhalten; kein doppelter Unterfall.
  // Die Quelle nennt allgemein „Synkope“. Wegen Anwendung BvO ist der
  // passende Elternknoten synkope-bvo, nicht synkope-verweigerung.
  {
    id: 'synkope-bvo-vasovagal',
    parentId: 'synkope-bvo',
    name: 'Vasovagale Synkope (bekanntes Niedrigrisikomuster)',
    requirements: 'Typischer Auslöser und Prodromi, rasche vollständige Erholung; unauffällige Untersuchung einschließlich EKG, keine kardialen Risikomerkmale.',
    majorSignalIds: [],
    minorSignalIds: [
      'kreislauf-belastungsSchwaeche-anhaltend',
    ],
    diagnoses: [
      'vasovagale Ursache',
    ],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Tauchunfall mit Dekompressionsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 23.
  {
    id: 'tauchunfall-dekompressionsverdacht-verweigerung',
    name: 'Tauchunfall mit Dekompressionsverdacht',
    requirements: 'Neurologische Beschwerden, Atemnot oder ungewöhnliche Schmerzen nach Tauchgang; auch bei verzögertem Beginn.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Thoraxschmerz, nicht-traumatisch (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 38, 39; universelle Daten fehlen noch.
  {
    id: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Thoraxschmerz, nicht-traumatisch (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Thoraxschmerz, nicht-traumatisch (schwer)“: Akutes Aortensyndrom (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 39.
  {
    id: 'aortensyndrom-verdacht-verweigerung',
    parentId: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Akutes Aortensyndrom (Verdacht)',
    requirements: 'Abrupter starker Thorax-/Rückenschmerz, Perfusionsunterschiede oder neurologische Symptome; zeitkritische Gefäßdiagnostik erforderlich.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Thoraxschmerz, nicht-traumatisch (schwer)“: Akutes Koronarsyndrom (Verdacht)
  // Quelle: redflags_150_szenarien.md, Nr. 38.
  {
    id: 'koronares-syndrom-verdacht-verweigerung',
    parentId: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Akutes Koronarsyndrom (Verdacht)',
    requirements: 'Ischämietypische Beschwerden oder verdächtige EKG-Veränderungen; auch ohne klassischen Brustschmerz oder bei zwischenzeitlicher Besserung.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Tiefe Venenthrombose (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 41.
  {
    id: 'tiefe-venenthrombose-verdacht-verweigerung',
    name: 'Tiefe Venenthrombose (Verdacht)',
    requirements: 'Neue einseitige schmerzhafte Beinschwellung; erforderliche dringliche Diagnostik wird abgelehnt, nicht lediglich eine bestimmte Transportart.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trachealkanülenkomplikation [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 34.
  {
    id: 'trachealkanuelenkomplikation-verweigerung',
    name: 'Trachealkanülenkomplikation',
    requirements: 'Dislokation, Verlegung oder relevante Blutung; sichere Atmung beziehungsweise Kanülenfunktion nicht zuverlässig wiederhergestellt.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trigeminusneuralgie (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 51.
  {
    id: 'trigeminusneuralgie-bekannt-bvo',
    name: 'Trigeminusneuralgie (bekanntes Muster)',
    requirements: 'Bekannte kurze Schmerzattacken, beherrschbar; keine neue Sensibilitätsstörung, Augenbeteiligung, Infektzeichen oder Nahrungsunfähigkeit.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trinkschwäche beim jungen Säugling [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 149.
  {
    id: 'trinkschwaeche-junger-saeugling-verweigerung',
    name: 'Trinkschwäche beim jungen Säugling',
    requirements: 'Neu deutlich verminderte Aufnahme, weniger nasse Windeln, auffällige Müdigkeit oder Temperaturabweichung; nicht pauschal als Infektbagatelle einstufen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Überlastungsbedingter Muskelschmerz (leicht) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 3.
  {
    id: 'muskelschmerz-ueberlastung-leicht-bvo',
    name: 'Überlastungsbedingter Muskelschmerz (leicht)',
    requirements: 'Plausible ungewohnte Belastung, lokaler leichter Schmerz; keine ausgeprägte Schwellung, Schwäche, dunkler Urin oder Allgemeinsymptome.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ungeklärtes Apnoe-/Zyanoseereignis beim Säugling [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 147.
  {
    id: 'apnoe-zyanoseereignis-saeugling-verweigerung',
    name: 'Ungeklärtes Apnoe-/Zyanoseereignis beim Säugling',
    requirements: 'Berichtete Atempause, Blauverfärbung, deutliche Tonus- oder Bewusstseinsänderung; auch nach vollständiger Erholung akut beurteilen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Unterkühlung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 19.
  {
    id: 'unterkuehlung-verweigerung',
    name: 'Unterkühlung',
    requirements: 'Körperkerntemperatur unter 35 °C oder begründeter Verdacht; besonders mit Erschöpfung, Verwirrtheit oder Kreislaufauffälligkeiten.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Vaginale Blutung (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  // Elternknoten für Markdown-Nr. 138; universelle Daten fehlen noch.
  {
    id: 'vaginale-blutung-schwer-verweigerung',
    name: 'Vaginale Blutung (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // Unterszenario zu „Vaginale Blutung (schwer)“: Postpartale Blutung
  // Quelle: redflags_150_szenarien.md, Nr. 138.
  {
    id: 'postpartale-blutung-verweigerung',
    parentId: 'vaginale-blutung-schwer-verweigerung',
    name: 'Postpartale Blutung',
    requirements: 'Starke oder erneut zunehmende Blutung nach Geburt, insbesondere mit Schwäche/Kreislaufzeichen; nicht als gewöhnliche Wochenbettblutung einstufen.',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verbandbedingte Druckbeschwerden (vollständig behoben) [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 4.
  {
    id: 'verbanddruck-vollstaendig-behoben-bvo',
    name: 'Verbandbedingte Druckbeschwerden (vollständig behoben)',
    requirements: 'Nach fachgerechter Verbandkorrektur beschwerdefrei, DMS wiederholt normal; kein Gipsproblem, keine ungeklärte Verletzung oder Kompartmentzeichen.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verdacht auf vorzeitigen Blasensprung [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 136.
  {
    id: 'vorzeitiger-blasensprung-verdacht-verweigerung',
    name: 'Verdacht auf vorzeitigen Blasensprung',
    requirements: 'Wässriger vaginaler Flüssigkeitsabgang vor Geburtsbeginn; besonders dringlich bei Frühgeburtlichkeit, Fieber oder auffälligem Fruchtwasser.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verschluckter Hochrisikofremdkörper [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 148.
  {
    id: 'hochrisikofremdkoerper-verschluckt-verweigerung',
    name: 'Verschluckter Hochrisikofremdkörper',
    requirements: 'Knopfzelle, mehrere Magnete, Magnet plus Metall oder spitzer Gegenstand; auch ohne Beschwerden zeitkritisch abzuklären.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Vorzeitige Wehen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 135.
  {
    id: 'vorzeitige-wehen-verweigerung',
    name: 'Vorzeitige Wehen',
    requirements: 'Regelmäßige schmerzhafte Kontraktionen vor 37 vollendeten Schwangerschaftswochen; geburtshilfliche Akutabklärung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Wirbelsäulentrauma mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 10.
  {
    id: 'wirbelsaeulentrauma-risikomerkmale-verweigerung',
    name: 'Wirbelsäulentrauma mit Risikomerkmalen',
    requirements: 'Mittellinienschmerz, neurologische Symptome oder gefährlicher Mechanismus; keine sichere klinische Entwarnung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Wochenbettinfektion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 139.
  {
    id: 'wochenbettinfektion-verdacht-verweigerung',
    name: 'Wochenbettinfektion (Verdacht)',
    requirements: 'Fieber mit Unterbauchschmerz, übel riechendem Wochenfluss oder deutlicher Allgemeinzustandsverschlechterung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Zahnschmerzen ohne Ausbreitungszeichen [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 68.
  {
    id: 'zahnschmerzen-ohne-ausbreitungszeichen-bvo',
    name: 'Zahnschmerzen ohne Ausbreitungszeichen',
    requirements: 'Lokaler beherrschbarer Schmerz; keine Schwellung, Schluckstörung, Kieferklemme oder Allgemeinsymptome; Zahnarztkontakt gesichert.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Zeckenstich nach Entfernung, ohne Allgemeinsymptome [BvO]
  // -------------------------------------------------------------------------

  // Quelle: redflags_150_szenarien.md, Nr. 107.
  {
    id: 'zeckenstich-entfernt-ohne-allgemeinsymptome-bvo',
    name: 'Zeckenstich nach Entfernung, ohne Allgemeinsymptome',
    requirements: 'Zecke entfernt, allenfalls kleine lokale Reaktion; kein Fieber oder neurologisches Symptom; Verlaufskontrolle besprochen.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [],
    minorSignalIds: [],
    diagnoses: [],
    consequences: [],
  },

]

// ---------------------------------------------------------------------------
// Unveränderte öffentliche Schnittstelle: flache Listen ohne Datenduplikation.
// filter erhält die Reihenfolge und die Referenzen auf die Originalobjekte.
// ---------------------------------------------------------------------------

export const DATA_Scenarios: readonly RedflagScenario[] = SCENARIO_ENTRIES.filter(
  (entry): entry is RedflagScenario => !('parentId' in entry),
)

export const DATA_Subscenarios: readonly RedflagSubscenario[] = SCENARIO_ENTRIES.filter(
  (entry): entry is RedflagSubscenario => 'parentId' in entry,
)

/** Ein gemeinsamer Einstiegspunkt, ohne die Listen zu duplizieren. */
export const DATA_Redflags: RedflagCatalog = {
  signals: DATA_Signals,
  scenarios: DATA_Scenarios,
  subscenarios: DATA_Subscenarios,
}

/**
 * Auswahlvertrag (Implementierung bleibt Aufgabe der Anwendung):
 * - subscenarioMode: 'all' -> universelle Inhalte + alle zugehörigen Unterfälle.
 * - subscenarioMode: 'selected' -> universelle Inhalte + nur die angegebenen
 *   Unterfälle; leere Unter-IDs enthalten ausschließlich das Hauptszenario.
 * - Ohne Modus bleiben leere Unter-IDs eine Auswahl aller Unterfälle;
 *   eine/mehrere Unter-IDs enthalten nur diese Unterfälle.
 * - Direkte Unterfallauswahl wählt das Hauptszenario über parentId mit aus.
 * - Voraussetzungstexte verschiedener Unterfälle können Alternativen sein;
 *   sie sind keine gleichzeitig erhobenen Befunde und keine BvO-Checkliste.
 * - Die neuen leeren Listen liefern noch keine vollständige Risikoaufklärung.
 */
