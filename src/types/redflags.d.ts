/**
 * RedFlags – Typen für den Szenario- und Warnzeichenkatalog.
 *
 * Grundlage: die bereitgestellte redflags.ts und die im Projekt besprochene
 * Haupt-/Unterszenario-Struktur. Die AGENTS.md war bei der Erstellung nicht
 * verfügbar; die vollständige Übereinstimmung mit ihr ist noch zu prüfen.
 *
 * Nur Typen, keine Klassenimplementierungen und keine globalen Deklarationen.
 * Fachliche Inhalte und ausführbare Auswahl-/Textlogik gehören nicht hierher.
 */

// ---------------------------------------------------------------------------
// Bestehende Einteilungen
// ---------------------------------------------------------------------------

export type RedflagCategory =
  | 'trauma'
  | 'atmung'
  | 'kreislauf'
  | 'neuro'
  | 'intox'
  | 'gastro'
  | 'infekt'
  | 'hno'
  | 'psych'
  | 'gyn'
  | 'umwelt'
  | 'augen'
  | 'uro'
  | 'stoffwechsel'
  | 'haut'
  | 'paediatrie'

/** Anwendungsfälle aus dem bisherigen Datenmodell; keine Schweregradskala. */
export type RedflagApplication = 'Verweigerung' | 'BvO'

/**
 * Stabile, explizit vergebene IDs; nicht aus veränderlichen Namen ableiten.
 *
 * Bewusst unabhängig von den anfangs leeren Datenarrays. Die Aliase sind
 * Strings, keine nominal verschiedenen Typen und keine Liste gültiger IDs.
 * Existenz, Eindeutigkeit und Zuordnung müssen später validiert werden.
 */
export type SignalId = string
export type ScenarioId = string
export type SubscenarioId = string

// ---------------------------------------------------------------------------
// Wiederverwendbare Warnzeichen und Aufklärungsinhalte
// ---------------------------------------------------------------------------

/**
 * Ein zentral gepflegtes Warnzeichen.
 * Seine Zuordnung zu major/minor erfolgt im jeweiligen Szenario.
 */
export interface RedflagSignal {
  readonly id: SignalId
  readonly text: string
}

/**
 * Aufklärungsinhalte eines Haupt- oder Unterszenarios.
 *
 * Hauptszenario: ausschließlich universelle, immer beizubehaltende Inhalte.
 * Unterszenario: ausschließlich zusätzliche, subtypspezifische Inhalte.
 * Alle Listen sind explizit anzugeben; eine leere Liste ist zulässig.
 */
export interface RedflagContent {
  /** Verweise auf zentrale Warnzeichen, noch keine aufgelösten Texte. */
  readonly majorSignalIds: readonly SignalId[]

  /** Verweise auf zentrale Warnzeichen, noch keine aufgelösten Texte. */
  readonly minorSignalIds: readonly SignalId[]

  /** Aufklärungsrelevante mögliche Diagnosen, nicht gesicherte Diagnosen. */
  readonly diagnoses: readonly string[]

  /**
   * Einzelne Folgen/Risiken als kombinierbare Textbausteine.
   * Anders als bisher eine Liste statt eines zusammenhängenden Strings.
   */
  readonly consequences: readonly string[]
}

// ---------------------------------------------------------------------------
// Haupt- und Unterszenarien
// ---------------------------------------------------------------------------

/**
 * Hauptszenario mit universellen Daten.
 *
 * Zugehörige Unterszenarien werden ausschließlich über deren parentId
 * gefunden. Hier keine zweite, redundant gepflegte Liste von Unter-IDs.
 * Aggregierte Inhalte werden berechnet, nicht im Hauptszenario gespeichert.
 */
export interface RedflagScenario extends RedflagContent {
  readonly id: ScenarioId
  readonly name: string

  /** Beschreibender Voraussetzungstext; kein automatischer Eignungsnachweis. */
  readonly requirements: string

  readonly application: RedflagApplication
  readonly category: RedflagCategory
}

/**
 * Direkt auswählbarer Subtyp genau eines Hauptszenarios.
 *
 * application und category werden ausschließlich vom Hauptszenario bezogen.
 * Bei direkter Auswahl ist das Hauptszenario über parentId mit auszuwählen.
 * Weitere Hierarchieebenen sind in diesem Modell nicht vorgesehen.
 */
export interface RedflagSubscenario extends RedflagContent {
  readonly id: SubscenarioId
  readonly parentId: ScenarioId
  readonly name: string

  /** Zusätzliche Voraussetzungen; ersetzt nicht die des Hauptszenarios. */
  readonly requirements: string
}

/** Vollständiger Datenkatalog, ohne patientenbezogenen Auswahlzustand. */
export interface RedflagCatalog {
  readonly signals: readonly RedflagSignal[]
  readonly scenarios: readonly RedflagScenario[]
  readonly subscenarios: readonly RedflagSubscenario[]
}

// ---------------------------------------------------------------------------
// Auswahlvertrag für die spätere Anwendungslogik
// ---------------------------------------------------------------------------

/**
 * Ziel einer direkten Auswahl, etwa aus Suche oder Szenarioliste.
 *
 * Bei type='subscenario' muss die Anwendung den zugehörigen parentId
 * nachschlagen und eine passende RedflagScenarioSelection herstellen.
 */
export type RedflagSelectionTarget =
  | { readonly type: 'scenario'; readonly id: ScenarioId }
  | { readonly type: 'subscenario'; readonly id: SubscenarioId }

/**
 * Auswahlzustand für genau ein Hauptszenario.
 *
 * subscenarioMode = 'all':
 *   Universelle Inhalte + Inhalte ALLER zugehörigen Unterszenarien.
 *
 * subscenarioMode = 'selected':
 *   Universelle Inhalte + Inhalte NUR der ausgewählten Unterszenarien;
 *   subscenarioIds = [] enthält ausschließlich das Hauptszenario.
 *
 * Ohne Modus gilt für bestehende Datensätze: leere IDs bedeuten alle
 * Unterszenarien, nichtleere IDs nur die ausgewählten Unterszenarien.
 *
 * Jede Unter-ID muss existieren und zu scenarioId gehören. Ein fehlerhafter
 * Verweis darf nicht stillschweigend ignoriert oder als leere Auswahl
 * behandelt werden. Die Typdefinition allein führt diese Prüfung nicht aus.
 */
export interface RedflagScenarioSelection {
  readonly scenarioId: ScenarioId
  readonly subscenarioIds: readonly SubscenarioId[]
  readonly subscenarioMode?: 'all' | 'selected'
}

export type RedflagAggregationMode =
  | 'all-subscenarios'
  | 'selected-subscenarios'

/**
 * Ergebnisvertrag für einen späteren Resolver; keine persistierten Rohdaten.
 * In diesen Dateien ist noch kein Resolver implementiert.
 *
 * Vorgesehene technische Zusammenführungsregeln:
 * - Universelle Inhalte bleiben immer enthalten.
 * - Hauptszenario zuerst, dann einbezogene Subtypen in Katalogreihenfolge.
 * - Warnzeichen anhand ihrer ID deduplizieren.
 * - Bei derselben ID in major und minor hat major Vorrang.
 * - Diagnosen, Folgen und Voraussetzungen bei exakt gleichem Text
 *   deduplizieren; keine medizinisch-semantische Gleichsetzung vornehmen.
 * - Leere Voraussetzungstexte nicht in das Ergebnis übernehmen.
 *
 * Die Vorrang- und Deduplizierungsregeln sind technische Festlegungen dieses
 * Entwurfs, keine aus der nicht vorliegenden AGENTS.md verifizierten Regeln.
 */
export interface ResolvedRedflagScenario {
  readonly scenario: RedflagScenario
  readonly selection: RedflagScenarioSelection
  readonly aggregationMode: RedflagAggregationMode

  /** Tatsächlich einbezogene Subtypen nach Anwendung des Auswahlmodus. */
  readonly includedSubscenarioIds: readonly SubscenarioId[]

  /**
   * Voraussetzungstexte zur Anzeige, nicht als gleichzeitig erfüllte Befunde.
   * Insbesondere bei all-subscenarios können Subtypen Alternativen sein.
   * Die Liste darf nicht als konjunktive Eignungsprüfung interpretiert werden.
   */
  readonly requirements: readonly string[]

  /** Aufgelöste Warnzeichen; deren text kann der Textgenerator verwenden. */
  readonly majorSignals: readonly RedflagSignal[]
  readonly minorSignals: readonly RedflagSignal[]

  readonly diagnoses: readonly string[]
  readonly consequences: readonly string[]
}
