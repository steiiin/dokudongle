
import type {
  RedflagCatalog,
  RedflagScenario,
  RedflagSignal,
  RedflagSubscenario,
} from '../types/redflags.js'

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
// Zentrale Warnzeichen
// ---------------------------------------------------------------------------

export const DATA_Signals: readonly RedflagSignal[] = [
  {
    id:   'abdomen__afterjuckreiz',
    text: 'anhaltendem Juckreiz am After'
  },
  {
    id:   'abdomen__anhaltende_verstopfung',
    text: 'anhaltender Verstopfung'
  },
  {
    id:   'abdomen__anhaltender_durchfall',
    text: 'anhaltendem Durchfall'
  },
  {
    id:   'abdomen__anhaltendes_erbrechen',
    text: 'anhaltendem Erbrechen'
  },
  {
    id:   'abdomen__blut_im_stuhl',
    text: 'Blut im Stuhl'
  },
  {
    id:   'abdomen__blutiges_erbrechen',
    text: 'blutigem/kaffeesatzartigem Erbrechen'
  },
  {
    id:   'abdomen__durchfall',
    text: 'Durchfall'
  },
  {
    id:   'abdomen__geringe_wiederkehrende_blutspuren',
    text: 'geringen wiederkehrenden Blutspuren am Stuhl'
  },
  {
    id:   'abdomen__gruenes_erbrechen',
    text: 'grünem Erbrechen'
  },
  {
    id:   'abdomen__hart_geblaeht',
    text: 'hartem/aufgeblähtem Bauch'
  },
  {
    id:   'abdomen__leichte_wiederkehrende_schmerzen',
    text: 'wiederkehrenden leichten Bauchschmerzen'
  },
  {
    id:   'abdomen__naechtliche_beschwerden',
    text: 'nächtlichen Bauchbeschwerden'
  },
  {
    id:   'abdomen__schmerzhafte_bruchvorwoelbung',
    text: 'schmerzhafter/fester Bruchvorwölbung'
  },
  {
    id:   'abdomen__starke_afterschmerzen',
    text: 'starken Schmerzen am After'
  },
  {
    id:   'abdomen__starke_rektalblutung',
    text: 'starker/nicht stillbarer Blutung aus dem After'
  },
  {
    id:   'abdomen__teerstuhl',
    text: 'schwarzem/teerartigem Stuhl'
  },
  {
    id:   'abdomen__wiederkehrendes_sodbrennen',
    text: 'wiederkehrendem Sodbrennen'
  },
  {
    id:   'abdomen__windverhalt_mit_blaehung',
    text: 'fehlendem Windabgang mit zunehmender Bauchblähung'
  },
  {
    id:   'abdomen__zunehmende_schmerzen',
    text: 'zunehmenden Bauchschmerzen'
  },
  {
    id:   'augen__anhaltende_roetung',
    text: 'anhaltender Augenrötung'
  },
  {
    id:   'augen__eitriges_sekret',
    text: 'verklebten Augenlidern/eitrigem Augensekret'
  },
  {
    id:   'augen__fremdkoerpergefuehl',
    text: 'anhaltendem Fremdkörpergefühl im Auge'
  },
  {
    id:   'augen__juckreiz_traenenfluss',
    text: 'anhaltendem Augenjucken/Tränenfluss'
  },
  {
    id:   'augen__lichtscheu',
    text: 'ausgeprägter Lichtscheu'
  },
  {
    id:   'augen__neue_ptosis',
    text: 'einseitig hängendem Augenlid'
  },
  {
    id:   'augen__neue_pupillendifferenz',
    text: 'deutlicher Pupillendifferenz'
  },
  {
    id:   'augen__starke_augenschmerzen',
    text: 'starken Augenschmerzen'
  },
  {
    id:   'augen__wiederkehrende_einblutung',
    text: 'wiederkehrenden Einblutungen ins Augenweiß'
  },
  {
    id:   'becken__zunehmende_schmerzen',
    text: 'zunehmenden Beckenschmerzen'
  },
  {
    id:   'blutung__nase_zahnfleisch',
    text: 'Blutungen aus Nase/Zahnfleisch'
  },
  {
    id:   'blutung__wiederkehrende_haut_schleimhautblutungen',
    text: 'wiederkehrenden Haut-/Schleimhautblutungen'
  },
  {
    id:   'extremitaet__belastungsunfaehigkeit',
    text: 'fehlender Belastbarkeit'
  },
  {
    id:   'extremitaet__bewegungsstoerung',
    text: 'Bewegungsstörungen'
  },
  {
    id:   'extremitaet__blaesse_blaufarbung',
    text: 'auffälliger Blässe/Blaufärbung'
  },
  {
    id:   'extremitaet__einseitige_schwellung_schmerz',
    text: 'einseitiger schmerzhafter Beinschwellung'
  },
  {
    id:   'extremitaet__gespannte_schwellung',
    text: 'praller/gespannter Schwellung'
  },
  {
    id:   'extremitaet__kalte_extremitaet',
    text: 'auffällig kalter Hand/kaltem Fuß'
  },
  {
    id:   'extremitaet__langsame_beidseitige_beinoedeme',
    text: 'langsam zunehmenden beidseitigen Beinschwellungen'
  },
  {
    id:   'extremitaet__pulsverlust',
    text: 'fehlendem Puls an der Extremität'
  },
  {
    id:   'extremitaet__sensibilitaetsstoerung',
    text: 'Gefühlsstörungen'
  },
  {
    id:   'extremitaet__starke_dehnungsschmerzen',
    text: 'starken Schmerzen beim Strecken von Fingern/Zehen'
  },
  {
    id:   'extremitaet__zunehmende_schmerzen',
    text: 'zunehmenden Schmerzen'
  },
  {
    id:   'gelenk__anhaltende_leichte_schmerzen',
    text: 'anhaltenden leichten Gelenkschmerzen'
  },
  {
    id:   'gelenk__anhaltende_schmerzen',
    text: 'anhaltenden Gelenkschmerzen'
  },
  {
    id:   'gelenk__bewegungsverlust',
    text: 'eingeschränkter Beweglichkeit'
  },
  {
    id:   'gelenk__roetung_ueberwaermung',
    text: 'gerötetem/überwärmtem Gelenk'
  },
  {
    id:   'gelenk__wiederkehrende_steifigkeit',
    text: 'wiederkehrender Gelenksteifigkeit'
  },
  {
    id:   'gelenk__zunehmende_schmerzen',
    text: 'zunehmenden Gelenkschmerzen'
  },
  {
    id:   'gelenk__zunehmende_schwellung',
    text: 'zunehmender Gelenkschwellung'
  },
  {
    id:   'gyn__anhaltende_brustverhaertung',
    text: 'anhaltender Verhärtung der Brust'
  },
  {
    id:   'gyn__anhaltende_stillbeschwerden',
    text: 'anhaltenden Schmerzen beim Stillen'
  },
  {
    id:   'gyn__auffaelliges_fruchtwasser',
    text: 'grünem/braunem/übel riechendem Fruchtwasser'
  },
  {
    id:   'gyn__fruchtwasserabgang',
    text: 'wässrigem Flüssigkeitsabgang aus der Scheide'
  },
  {
    id:   'gyn__grosse_blutklumpen_wochenfluss',
    text: 'großen Blutklumpen im Wochenfluss'
  },
  {
    id:   'gyn__pressdrang',
    text: 'Pressdrang'
  },
  {
    id:   'gyn__regelmaessige_schmerzhafte_wehen',
    text: 'regelmäßigen schmerzhaften Wehen'
  },
  {
    id:   'gyn__schulterspitzenschmerz',
    text: 'Schmerzen an der Schulterspitze'
  },
  {
    id:   'gyn__sichtbare_nabelschnur',
    text: 'sichtbarer/tastbarer Nabelschnur an der Scheide'
  },
  {
    id:   'gyn__starke_anhaltende_unterbauchschmerzen',
    text: 'anhaltenden starken Unterbauchschmerzen'
  },
  {
    id:   'gyn__starke_brustdruesenschmerzen',
    text: 'starken Schmerzen in der Brustdrüse'
  },
  {
    id:   'gyn__starke_einseitige_unterbauchschmerzen',
    text: 'starken einseitigen Unterbauchschmerzen'
  },
  {
    id:   'gyn__starke_vaginale_blutung',
    text: 'starker/zunehmender vaginaler Blutung'
  },
  {
    id:   'gyn__uebel_riechender_wochenfluss',
    text: 'übel riechendem Wochenfluss'
  },
  {
    id:   'gyn__vaginale_blutung',
    text: 'vaginaler Blutung'
  },
  {
    id:   'gyn__verminderte_kindsbewegungen',
    text: 'verminderten/ausbleibenden Kindsbewegungen'
  },
  {
    id:   'gyn__wiederkehrende_regelschmerzen',
    text: 'wiederkehrenden Regelschmerzen'
  },
  {
    id:   'gyn__zwischenblutungen',
    text: 'wiederkehrenden Zwischenblutungen'
  },
  {
    id:   'haut__anhaltende_brennende_schmerzen',
    text: 'anhaltenden brennenden Hautschmerzen'
  },
  {
    id:   'haut__anhaltende_taubheit',
    text: 'anhaltender Taubheit der Haut'
  },
  {
    id:   'haut__anhaltender_juckreiz',
    text: 'anhaltendem Juckreiz'
  },
  {
    id:   'haut__blaeschen_auge_nase_ohr',
    text: 'Bläschen an Auge/Nasenspitze/Ohr'
  },
  {
    id:   'haut__blasenbildung',
    text: 'Hautblasen'
  },
  {
    id:   'haut__dunkle_verfaerbung',
    text: 'dunkler/schwarzer Hautverfärbung'
  },
  {
    id:   'haut__eitriges_sekret',
    text: 'eitrigem Sekret'
  },
  {
    id:   'haut__grossflaechige_blaeschenausbreitung',
    text: 'großflächiger Ausbreitung von Hautbläschen'
  },
  {
    id:   'haut__marmorierung',
    text: 'fleckiger/marmorierter Hautverfärbung'
  },
  {
    id:   'haut__naessende_offene_stellen',
    text: 'nässenden/offenen Hautstellen'
  },
  {
    id:   'haut__nicht_wegdrueckbare_flecken',
    text: 'nicht wegdrückbaren roten/violetten Hautflecken'
  },
  {
    id:   'haut__rasch_ausbreitende_roetung',
    text: 'rasch ausbreitender Rötung'
  },
  {
    id:   'haut__schleimhautwunden',
    text: 'wunden Stellen an Mund/Augen/Genitalien'
  },
  {
    id:   'haut__schmerzhafte_blaeschen',
    text: 'schmerzhaften Hautbläschen'
  },
  {
    id:   'haut__sich_vergroessernde_roetung_nach_stich',
    text: 'sich vergrößernder Rötung um die Stichstelle'
  },
  {
    id:   'haut__starke_schmerzen',
    text: 'starken Hautschmerzen'
  },
  {
    id:   'haut__wiederkehrender_ausschlag',
    text: 'wiederkehrendem Hautausschlag'
  },
  {
    id:   'haut__zunehmende_lokale_roetung',
    text: 'zunehmender örtlicher Rötung'
  },
  {
    id:   'haut__zunehmende_lokale_schwellung',
    text: 'zunehmender örtlicher Schwellung'
  },
  {
    id:   'hno__anhaltende_halsschmerzen',
    text: 'anhaltenden Halsschmerzen'
  },
  {
    id:   'hno__anhaltende_leichte_ohrenschmerzen',
    text: 'anhaltenden leichten Ohrenschmerzen'
  },
  {
    id:   'hno__anhaltende_mundschmerzen',
    text: 'anhaltenden Zahn-/Wundschmerzen im Mund'
  },
  {
    id:   'hno__anhaltende_schluckbeschwerden',
    text: 'anhaltenden Schluckbeschwerden'
  },
  {
    id:   'hno__anhaltendes_ohrgeraeusch',
    text: 'anhaltenden Ohrgeräuschen'
  },
  {
    id:   'hno__auffaellig_haeufiges_schlucken',
    text: 'auffällig häufigem Schlucken'
  },
  {
    id:   'hno__blut_mund_rachen',
    text: 'frischem Blut aus Mund/Rachen'
  },
  {
    id:   'hno__eingeschraenkte_mundoeffnung',
    text: 'erschwerter Mundöffnung'
  },
  {
    id:   'hno__geringe_blutspuren_speichel',
    text: 'wiederkehrenden geringen Blutspuren im Speichel'
  },
  {
    id:   'hno__heiserkeit',
    text: 'Heiserkeit'
  },
  {
    id:   'hno__kieferklemme',
    text: 'stark eingeschränkter Mundöffnung'
  },
  {
    id:   'hno__kloessige_stimme',
    text: 'kloßiger/veränderter Stimme'
  },
  {
    id:   'hno__ohrsekret',
    text: 'Flüssigkeits-/Eiteraustritt aus dem Ohr'
  },
  {
    id:   'hno__ploetzliche_hoerminderung',
    text: 'Hörminderung/Hörverlust'
  },
  {
    id:   'hno__schwellung_hinter_ohr',
    text: 'schmerzhafter Rötung/Schwellung hinter dem Ohr'
  },
  {
    id:   'hno__speichel_nicht_schluckbar',
    text: 'Unfähigkeit zum Schlucken von Speichel'
  },
  {
    id:   'hno__wiederholtes_verschlucken',
    text: 'wiederholtem Verschlucken beim Trinken/Essen'
  },
  {
    id:   'hno__zunehmende_gesichtsschwellung',
    text: 'zunehmender Gesichts-/Halsschwellung'
  },
  {
    id:   'hno__zunge_rachenschwellung',
    text: 'Zungen-/Rachenschwellung'
  },
  {
    id:   'infekt__anhaltendes_fieber',
    text: 'anhaltendem/wiederkehrendem Fieber'
  },
  {
    id:   'infekt__fieber_schuettelfrost',
    text: 'Fieber/Schüttelfrost'
  },
  {
    id:   'infekt__grippeaehnliche_beschwerden',
    text: 'grippeähnlichen Beschwerden mit Kopf-/Gliederschmerzen'
  },
  {
    id:   'intox__starkes_zittern_schwitzen',
    text: 'starkem Zittern/Schwitzen'
  },
  {
    id:   'intox__uebelkeit_erbrechen',
    text: 'Übelkeit/Erbrechen'
  },
  {
    id:   'kreislauf__anhaltendes_herzrasen',
    text: 'anhaltendem Herzrasen/Herzstolpern'
  },
  {
    id:   'kreislauf__erneute_icd_schocks',
    text: 'erneuten ICD-Schocks'
  },
  {
    id:   'kreislauf__langsamer_herzschlag_mit_beschwerden',
    text: 'langsamem Herzschlag mit Schwäche/Schwindel'
  },
  {
    id:   'kreislauf__neue_probleme',
    text: 'Kreislaufproblemen (starker Schwindel/auffällige Blässe/kalter Schweiß)'
  },
  {
    id:   'muskeln__anhaltende_leichte_schmerzen',
    text: 'anhaltenden leichten Muskelschmerzen'
  },
  {
    id:   'muskeln__starke_schmerzen_schwellung',
    text: 'starken Muskelschmerzen/-schwellungen'
  },
  {
    id:   'neuro__anhaltende_leichte_kopfschmerzen',
    text: 'anhaltenden leichten Kopfschmerzen'
  },
  {
    id:   'neuro__anhaltende_neugedaechtnisstoerung',
    text: 'anhaltender Unfähigkeit zum Merken neuer Informationen'
  },
  {
    id:   'neuro__blasen_darmkontrollverlust',
    text: 'Verlust der Blasen-/Darmkontrolle'
  },
  {
    id:   'neuro__blitzartiger_maximalkopfschmerz',
    text: 'schlagartig maximalen Kopfschmerzen'
  },
  {
    id:   'neuro__erneute_gedaechtnisluecken',
    text: 'erneuten Erinnerungslücken'
  },
  {
    id:   'neuro__fehlende_erholung_nach_anfall',
    text: 'fehlender Rückkehr zu normaler Ansprechbarkeit nach einem Krampfanfall'
  },
  {
    id:   'neuro__gesichtslaehmung',
    text: 'einseitiger Gesichtslähmung'
  },
  {
    id:   'neuro__gesichtstaubheit',
    text: 'Taubheit im Gesicht'
  },
  {
    id:   'neuro__leichte_konzentrationsprobleme',
    text: 'anhaltenden Konzentrationsproblemen'
  },
  {
    id:   'neuro__leichter_lageschwindel',
    text: 'kurzzeitigem Schwindel beim Aufstehen'
  },
  {
    id:   'neuro__leichter_wiederkehrender_schwindel',
    text: 'wiederkehrendem leichtem Schwindel'
  },
  {
    id:   'neuro__muskelkraempfe',
    text: 'Muskelkrämpfen'
  },
  {
    id:   'neuro__neue_bewusstlosigkeit',
    text: 'Bewusstlosigkeit'
  },
  {
    id:   'neuro__neue_einseitige_schwaeche',
    text: 'einseitiger Schwäche/Lähmung'
  },
  {
    id:   'neuro__neue_gangunsicherheit',
    text: 'ausgeprägter Gangunsicherheit'
  },
  {
    id:   'neuro__neue_krampfanfaelle',
    text: 'einem Krampfanfall'
  },
  {
    id:   'neuro__neue_nackensteifigkeit',
    text: 'Nackensteifigkeit'
  },
  {
    id:   'neuro__neue_sprachstoerung',
    text: 'Sprachstörungen'
  },
  {
    id:   'neuro__neue_verwirrtheit',
    text: 'Verwirrtheit'
  },
  {
    id:   'neuro__ploetzliche_starke_kopfschmerzen',
    text: 'starken Kopfschmerzen'
  },
  {
    id:   'neuro__taubheit_schritt',
    text: 'Taubheit im Schritt/Gesäßbereich'
  },
  {
    id:   'neuro__wiederkehrende_gesichtsschmerzen',
    text: 'wiederkehrenden Gesichtsschmerzattacken'
  },
  {
    id:   'neuro__wiederkehrende_typische_kopfschmerzen',
    text: 'wiederkehrenden Kopfschmerzen im bekannten Muster'
  },
  {
    id:   'neuro__zunehmende_muskelschwaeche',
    text: 'zunehmender Muskelschwäche'
  },
  {
    id:   'neuro__zunehmende_schlaefrigkeit',
    text: 'zunehmender Schläfrigkeit/erschwerter Weckbarkeit'
  },
  {
    id:   'paediatrie__anfallsartiges_schreien_blaesse',
    text: 'anfallsartigem Schreien mit Blässe'
  },
  {
    id:   'paediatrie__angestrengte_atmung',
    text: 'angestrengter Atmung mit Einziehungen/Stöhnen'
  },
  {
    id:   'paediatrie__schlaff_teilnahmslos',
    text: 'auffälliger Schlaffheit/Teilnahmslosigkeit'
  },
  {
    id:   'paediatrie__trinkschwaeche',
    text: 'deutlich vermindertem Trinken'
  },
  {
    id:   'paediatrie__wenige_nasse_windeln',
    text: 'deutlich weniger nassen Windeln'
  },
  {
    id:   'paediatrie__wiederkehrender_bellender_husten',
    text: 'wiederkehrendem bellendem Husten'
  },
  {
    id:   'peg__fluessigkeitsaustritt',
    text: 'Austritt von Nahrung/Mageninhalt an der Sondenöffnung'
  },
  {
    id:   'psych__anhaltende_alltagsbeeintraechtigung',
    text: 'anhaltenden Schwierigkeiten bei Bewältigung des Alltags'
  },
  {
    id:   'psych__anhaltende_niedergeschlagenheit',
    text: 'anhaltender Niedergeschlagenheit/Interesselosigkeit'
  },
  {
    id:   'psych__anhaltende_schlafstoerungen',
    text: 'anhaltenden Schlafstörungen'
  },
  {
    id:   'psych__belastende_wiedererinnerungen',
    text: 'wiederkehrenden belastenden Erinnerungen/Albträumen'
  },
  {
    id:   'psych__fremdgefaehrdungsimpulse',
    text: 'Fremdgefährdungsimpulsen'
  },
  {
    id:   'psych__gefaehrliches_enthemmtes_verhalten',
    text: 'unkontrollierbarem riskantem Verhalten'
  },
  {
    id:   'psych__halluzinationen',
    text: 'Stimmenhören/Halluzinationen'
  },
  {
    id:   'psych__konkrete_suizidabsicht',
    text: 'konkreten Absichten zur Selbsttötung'
  },
  {
    id:   'psych__schlaflosigkeit_mit_ueberaktivitaet',
    text: 'ausbleibendem Schlaf mit ausgeprägter Überaktivität'
  },
  {
    id:   'psych__schwere_erregung',
    text: 'extremen Erregungszuständen mit Kontrollverlust'
  },
  {
    id:   'psych__suizidgedanken',
    text: 'Gedanken an Suizid/Selbstverletzung'
  },
  {
    id:   'psych__wiederkehrende_angstzustaende',
    text: 'wiederkehrenden Angstzuständen'
  },
  {
    id:   'psych__zunehmende_selbstvernachlaessigung',
    text: 'Selbstvernachlässigung'
  },
  {
    id:   'pulmo__anhaltender_husten',
    text: 'anhaltendem Husten'
  },
  {
    id:   'pulmo__atempausen',
    text: 'Atempausen'
  },
  {
    id:   'pulmo__blutspuren_im_auswurf',
    text: 'einzelnen Blutspuren im Auswurf'
  },
  {
    id:   'pulmo__langsame_flache_atmung',
    text: 'auffällig langsamer/flacher Atmung'
  },
  {
    id:   'pulmo__neue_luftnot',
    text: 'Atemnot'
  },
  {
    id:   'pulmo__relevante_haemoptyse',
    text: 'stärkerem/wiederholtem Bluthusten'
  },
  {
    id:   'pulmo__schaumiger_auswurf',
    text: 'schaumigem/rosafarbenem Auswurf'
  },
  {
    id:   'pulmo__stridor',
    text: 'pfeifendem/ziehendem Geräusch beim Einatmen'
  },
  {
    id:   'pulmo__stridor_in_ruhe',
    text: 'pfeifendem/ziehendem Einatemgeräusch in Ruhe'
  },
  {
    id:   'pulmo__zyanose',
    text: 'bläulichen Lippen'
  },
  {
    id:   'ruecken__starke_schmerzen',
    text: 'starken Nacken-/Rückenschmerzen'
  },
  {
    id:   'sehstoerung__neue_doppelbilder',
    text: 'Doppelbildern'
  },
  {
    id:   'sehstoerung__neue_lichtblitze',
    text: 'Lichtblitzen'
  },
  {
    id:   'sehstoerung__neuer_gesichtsfeldschatten',
    text: 'dunklem Schatten/Vorhang im Gesichtsfeld'
  },
  {
    id:   'sehstoerung__neuer_russregen',
    text: 'zahlreichen schwarzen Punkten vorm Auge'
  },
  {
    id:   'sehstoerung__ploetzlicher_sehverlust',
    text: 'Sehverlust'
  },
  {
    id:   'sehstoerung__rasche_sehverschlechterung',
    text: 'rascher Sehverschlechterung'
  },
  {
    id:   'shunt__anhaltende_erneute_blutung',
    text: 'anhaltender/erneuter Blutung am Dialyseshunt'
  },
  {
    id:   'shunt__roetung_schmerzen_verlauf',
    text: 'Rötung/Schmerzen entlang des Shuntschlauchs'
  },
  {
    id:   'stoffwechsel__anhaltende_muedigkeit',
    text: 'anhaltender Müdigkeit'
  },
  {
    id:   'stoffwechsel__durst_mundtrockenheit',
    text: 'anhaltendem Durst/trockenem Mund'
  },
  {
    id:   'stoffwechsel__fehlende_trinkfaehigkeit',
    text: 'fehlender Trinkfähigkeit'
  },
  {
    id:   'stoffwechsel__fruchtiger_atem',
    text: 'fruchtig/azetonartig riechendem Atem'
  },
  {
    id:   'stoffwechsel__gelbfaerbung',
    text: 'Gelbfärbung von Haut/Augen'
  },
  {
    id:   'stoffwechsel__starker_durst_polyurie',
    text: 'starkem Durst mit häufigem Wasserlassen'
  },
  {
    id:   'stoffwechsel__tiefe_schnelle_atmung',
    text: 'auffällig tiefer/schneller Atmung'
  },
  {
    id:   'stoffwechsel__ungewollter_gewichtsverlust',
    text: 'ungewolltem Gewichtsverlust'
  },
  {
    id:   'stoffwechsel__wiederkehrende_uebelkeit',
    text: 'wiederkehrender Übelkeit'
  },
  {
    id:   'stoma__dunkle_blasse_verfaerbung',
    text: 'dunkler/auffällig blasser Verfärbung des Stomas'
  },
  {
    id:   'stoma__foerderstopp',
    text: 'plötzlich ausbleibender Ausscheidung'
  },
  {
    id:   'stoma__hautreizung',
    text: 'zunehmenden Hautreizungen im Stomabereich'
  },
  {
    id:   'stoma__nicht_ruecklaeufiger_prolaps',
    text: 'nicht rückläufigem Hervortreten'
  },
  {
    id:   'stoma__starke_blutung',
    text: 'starker Blutung aus dem Stoma'
  },
  {
    id:   'stoma__vermehrte_duennfluessige_ausscheidung',
    text: 'anhaltend vermehrter dünnflüssiger Ausscheidung'
  },
  {
    id:   'stoma__verminderte_ausscheidung',
    text: 'anhaltend verminderter Ausscheidung'
  },
  {
    id:   'temperatur__auffaellig_kalte_haut',
    text: 'auffällig kalter Haut'
  },
  {
    id:   'temperatur__nachlassendes_kaeltezittern',
    text: 'nachlassendem Zittern trotz anhaltender Kälte'
  },
  {
    id:   'thorax__schmerzen_druck',
    text: 'Brustschmerzen/Druckgefühl'
  },
  {
    id:   'trachea__frische_blutung',
    text: 'frischer Blutung aus/an der Trachealkanüle'
  },
  {
    id:   'trachea__verminderter_luftstrom',
    text: 'vermindertem/fehlendem Luftstrom an der Kanüle'
  },
  {
    id:   'trauma__anhaltende_leichte_schmerzen',
    text: 'anhaltenden leichten Schmerzen'
  },
  {
    id:   'umwelt__sehr_heisse_haut',
    text: 'sehr heißer Haut'
  },
  {
    id:   'uro__anhaltende_oligurie_anurie',
    text: 'anhaltend stark vermindertem/ausbleibendem Wasserlassen'
  },
  {
    id:   'uro__anhaltende_schmerzhafte_erektion',
    text: 'anhaltender schmerzhafter Erektion'
  },
  {
    id:   'uro__dunkelbrauner_urin',
    text: 'dunkelbraunem Urin'
  },
  {
    id:   'uro__eichelreizung',
    text: 'Rötung/Juckreiz an Eichel/Vorhaut'
  },
  {
    id:   'uro__eichelsekret',
    text: 'Sekret an Eichel/Vorhaut'
  },
  {
    id:   'uro__eicheltaubheit',
    text: 'Taubheit der Eichel'
  },
  {
    id:   'uro__eichelverfaerbung',
    text: 'dunkler/bläulicher Verfärbung der Eichel'
  },
  {
    id:   'uro__eingeklemmte_vorhaut',
    text: 'schmerzhaft hinter der Eichel festsitzender Vorhaut'
  },
  {
    id:   'uro__flankenschmerzen',
    text: 'starken Schmerzen in der Nierengegend/Flanke'
  },
  {
    id:   'uro__gerinnsel_im_urin',
    text: 'Blutgerinnseln im Urin'
  },
  {
    id:   'uro__neue_haematurie',
    text: 'Blut im Urin'
  },
  {
    id:   'uro__rasch_zunehmende_oedeme',
    text: 'rasch zunehmenden Bein-/Gesichtsschwellungen'
  },
  {
    id:   'uro__rasche_penisschwellung',
    text: 'rasch zunehmender Penisschwellung'
  },
  {
    id:   'uro__starke_flankenschmerzen',
    text: 'starken Schmerzen in der Nierengegend/Flanke'
  },
  {
    id:   'uro__starke_penisschmerzen',
    text: 'starken Schmerzen an Eichel/Vorhaut'
  },
  {
    id:   'uro__truebes_dialysat',
    text: 'trüber Flüssigkeit im Dialysebeutel'
  },
  {
    id:   'uro__verfaerbung_hodensack',
    text: 'dunkler/bläulicher Verfärbung'
  },
  {
    id:   'uro__zunehmende_hodenschmerzen',
    text: 'erneuten/zunehmenden Hodenschmerzen'
  },
  {
    id:   'uro__zunehmende_hodenschwellung',
    text: 'rasch zunehmender Schwellung'
  },
  {
    id:   'verband__wiederkehrendes_druckgefuehl',
    text: 'wiederkehrendem Druckgefühl unterm Verband'
  },
  {
    id:   'wunde__rasch_zunehmender_bluterguss',
    text: 'rasch zunehmendem Bluterguss'
  },
  {
    id:   'wunde__starke_anhaltende_blutung',
    text: 'starker/nicht stillbarer Blutung'
  },
  {
    id:   'wunde__zunehmende_schmerzen',
    text: 'zunehmenden Wundschmerzen'
  }
]

// ---------------------------------------------------------------------------
// Alphabetische Pflegeliste: Hauptszenario, danach seine Unterszenarien.
// Die exportierten DATA_Scenarios und DATA_Subscenarios stehen am Dateiende.
// ---------------------------------------------------------------------------

const SCENARIO_ENTRIES: readonly (RedflagScenario | RedflagSubscenario)[] = [

  // -------------------------------------------------------------------------
  // Hauptszenario: Abdominaltrauma mit Verdacht auf innere Verletzung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'abdominaltrauma-verweigerung',
    name: 'Abdominaltrauma (Vd. innere Verletzung)',
    requirements: 'Relevanter Mechanismus, Bauchschmerz, Druckschmerz oder Gurtmarke; initiale Kreislaufstabilität ist keine Entwarnung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__blut_im_stuhl',
      'uro__neue_haematurie', 'abdomen__anhaltendes_erbrechen', 'pulmo__neue_luftnot',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Innere Organverletzung', 'Darmverletzung', 'Innere Blutung'],
    consequences: ['unentdeckten Organ-/Darmverletzungen, inneren Blutungen, Bauchfellentzündung, Kreislaufversagen, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Gelenksentzündung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'gelenksentzuendung-verweigerung',
    name: 'Akute Gelenksentzündung',
    requirements: 'Akute schmerzhafte Bewegungseinschränkung und Überwärmung; septische Arthritis ausschließen, nicht vorschnell als Gicht behandeln.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [
      'gelenk__zunehmende_schmerzen', 'gelenk__zunehmende_schwellung', 'gelenk__bewegungsverlust',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
      'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Septische Arthritis', 'Gichtanfall', 'Sepsis'],
    consequences: ['einer unerkannten Gelenkinfektion, dauerhaften Gelenkschäden, Funktionsverlust, Sepsis, Organversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Belastungsreaktion [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'belastungsreaktion-bvo',
    name: 'Belastungsreaktion',
    name_alt: 'Panikattacke',
    requirements: 'Nach belastendem Ereignis beruhigt und orientiert; keine Suizidalität, Psychose oder relevante Selbstvernachlässigung; Unterstützung gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [
      'psych__suizidgedanken', 'psych__fremdgefaehrdungsimpulse', 'psych__halluzinationen',
      'neuro__neue_verwirrtheit', 'psych__schwere_erregung', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'psych__wiederkehrende_angstzustaende',
      'psych__belastende_wiedererinnerungen', 'psych__anhaltende_alltagsbeeintraechtigung',
    ],
    minorSpecialist: 'Psychiater',
    diagnoses: ['Akute Belastungsreaktion', 'Anpassungsstörung'],
    consequences: ['fortbestehenden Belastungsbeschwerden, zunehmenden Alltagsbeeinträchtigungen oder einer übersehenen psychischen Krise mit Selbstgefährdung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Erregung/Fremdgefährdung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'erregung-fremdgefaehrdung-verweigerung',
    name: 'Akute Erregung/Fremdgefährdung',
    requirements: 'Nicht sicher beherrschbare Erregung oder konkrete Gewaltgefahr; organische/toxische Ursachen und rechtliche Voraussetzungen gesondert prüfen.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [
      'psych__fremdgefaehrdungsimpulse', 'psych__schwere_erregung', 'psych__halluzinationen',
      'psych__suizidgedanken', 'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'psych__wiederkehrende_angstzustaende',
      'psych__anhaltende_alltagsbeeintraechtigung',
    ],
    diagnoses: ['Psychose', 'Delir', 'Intoxikation'],
    consequences: ['schweren Selbst-/Fremdverletzungen, übersehenen Vergiftungen/körperlichen Erkrankungen, bleibenden Schäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Extremitätenischämie [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'extremitaetenischaemie-verweigerung',
    name: 'Akute Extremitätenischämie',
    name_alt: 'Arterieller Verschluss',
    requirements: 'Plötzlich schmerzhafte, blasse/kalte Extremität mit Puls-, Sensibilitäts- oder Motorikstörung; keine traumatische Ursache notwendig.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'extremitaet__blaesse_blaufarbung', 'extremitaet__kalte_extremitaet',
      'extremitaet__zunehmende_schmerzen', 'extremitaet__pulsverlust', 'extremitaet__sensibilitaetsstoerung',
      'extremitaet__bewegungsstoerung',
    ],
    minorSignalIds: [],
    diagnoses: ['Akuter arterieller Gefäßverschluss'],
    consequences: ['einem unentdeckten Gefäßverschluss, Nerven-/Muskelschäden, absterbendem Gewebe, einer Amputation oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Oligurie/Anurie [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'oligurie-anurie-verweigerung',
    name: 'Oligurie/Anurie',
    name_alt: 'Harnverhalt',
    requirements: 'Akut deutlich verminderte/fehlende Urinausscheidung gegenüber dem Ausgangszustand; mögliche Nierenschädigung, nicht bloß Blasenentleerungsstörung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__anhaltende_oligurie_anurie', 'pulmo__neue_luftnot', 'neuro__neue_verwirrtheit',
      'kreislauf__neue_probleme', 'infekt__fieber_schuettelfrost', 'uro__neue_haematurie',
      'uro__starke_flankenschmerzen', 'uro__rasch_zunehmende_oedeme',
    ],
    minorSignalIds: [
      'stoffwechsel__anhaltende_muedigkeit', 'stoffwechsel__wiederkehrende_uebelkeit',
    ],
    minorSpecialist: 'Urologen',
    diagnoses: ['Akutes Nierenversagen', 'Harnverhalt', 'Elektrolytstörung'],
    consequences: ['akutem Nierenversagen, lebensbedrohlichen Herzrhythmusstörungen, einem Lungenödem, bleibenden Nierenschäden, Dialysepflichtigkeit oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Psychose [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'psychose-verweigerung',
    name: 'Akute Psychose',
    requirements: 'Wahn/Halluzinationen mit erheblicher Eigen-/Fremdgefährdung oder aufgehobener Selbstversorgung; somatische Ursachen mitprüfen.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [
      'psych__suizidgedanken', 'psych__fremdgefaehrdungsimpulse', 'psych__halluzinationen',
      'psych__schwere_erregung', 'neuro__neue_verwirrtheit', 'psych__zunehmende_selbstvernachlaessigung',
      'neuro__neue_krampfanfaelle', 'neuro__neue_bewusstlosigkeit', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'psych__wiederkehrende_angstzustaende',
      'psych__anhaltende_alltagsbeeintraechtigung',
    ],
    diagnoses: ['Akute Psychose', 'Delir', 'Intoxikation'],
    consequences: ['schweren Selbst-/Fremdverletzungen, übersehenen körperlichen Erkrankungen, fehlender Selbstversorgung, bleibenden Schäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Sehstörung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'akute-sehstoerung-verweigerung',
    name: 'Akute Sehstörung',
    requirements: '',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [
      'sehstoerung__ploetzlicher_sehverlust', 'sehstoerung__rasche_sehverschlechterung',
      'sehstoerung__neue_doppelbilder', 'sehstoerung__neue_lichtblitze', 'sehstoerung__neuer_russregen',
      'sehstoerung__neuer_gesichtsfeldschatten', 'augen__starke_augenschmerzen',
      'neuro__ploetzliche_starke_kopfschmerzen', 'neuro__neue_sprachstoerung',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_gangunsicherheit', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Schlaganfall', 'Retinaler Gefäßverschluss', 'Netzhautablösung'],
    consequences: ['bleibendem Sehverlust bis zur Erblindung, dauerhaften neurologischen Ausfällen oder dem Tod bei übersehener Gefäßerkrankung'],
  },

  {
    id: 'akute-doppelbilder-verweigerung',
    parentId: 'akute-sehstoerung-verweigerung',
    name: 'Akute Doppelbilder',
    requirements: 'Neue Doppelbilder, auch ohne weitere erkennbare Ausfälle; okuläre oder neurologische Ursache dringlich abzuklären.',
    majorSignalIds: [
      'sehstoerung__neue_doppelbilder', 'augen__neue_pupillendifferenz', 'augen__neue_ptosis',
      'neuro__ploetzliche_starke_kopfschmerzen', 'augen__starke_augenschmerzen', 'neuro__neue_sprachstoerung',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_gangunsicherheit',
      'sehstoerung__ploetzlicher_sehverlust',
    ],
    minorSignalIds: [],
    diagnoses: ['Schlaganfall', 'Hirnnervenlähmung', 'Hirnaneurysma'],
    consequences: ['einem übersehenen Schlaganfall/Hirnaneurysma, bleibenden Seh-/Hirnschäden oder dem Tod'],
  },

  {
    id: 'lichtblitze-russregen-gesichtsfeldschatten-verweigerung',
    parentId: 'akute-sehstoerung-verweigerung',
    name: 'Lichtblitze/Rußregen/Gesichtsfeldschatten',
    name_alt: 'Netzhautablösung',
    requirements: 'Neu aufgetretene Symptome, insbesondere Vorhangphänomen; dringlicher Ausschluss von Netzhautriss oder -ablösung.',
    majorSignalIds: [
      'sehstoerung__neue_lichtblitze', 'sehstoerung__neuer_russregen',
      'sehstoerung__neuer_gesichtsfeldschatten', 'sehstoerung__rasche_sehverschlechterung',
      'sehstoerung__ploetzlicher_sehverlust',
    ],
    minorSignalIds: [],
    diagnoses: ['Netzhautriss', 'Netzhautablösung', 'Glaskörperblutung'],
    consequences: ['fortschreitender Netzhautablösung, dauerhaften Gesichtsfeldausfällen oder bleibendem Sehverlust bis zur Erblindung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Stomakomplikation mit Ischämie-/Ileuszeichen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'stomakomplikation-ischaemie-ileuszeichen-verweigerung',
    name: 'Stomakomplikation mit Ischämie-/Ileuszeichen',
    requirements: 'Dunkles/blasses Stoma, starke Schmerzen, nicht rückläufiger Prolaps oder Förderstopp mit Erbrechen/Distension.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [
      'stoma__dunkle_blasse_verfaerbung', 'stoma__nicht_ruecklaeufiger_prolaps', 'stoma__foerderstopp',
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__anhaltendes_erbrechen',
      'kreislauf__neue_probleme', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'stoma__verminderte_ausscheidung', 'stoma__hautreizung',
    ],
    diagnoses: ['Stomaischämie', 'Darmverschluss', 'Peritonitis'],
    consequences: ['absterbendem Darmgewebe, einem Darmverschluss, einer Bauchfellentzündung, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Suizidalität/Suizidversuch [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'suizidalitaet-suizidversuch-verweigerung',
    name: 'Akute Suizidalität/Suizidversuch',
    requirements: 'Aktuelle Absicht, Vorbereitung oder kürzlicher Versuch; psychiatrische Notfallbeurteilung und gesonderte Prüfung der Einwilligungsfähigkeit.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [
      'psych__suizidgedanken', 'psych__konkrete_suizidabsicht', 'psych__halluzinationen',
      'psych__schwere_erregung', 'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
      'neuro__neue_krampfanfaelle', 'pulmo__neue_luftnot', 'psych__zunehmende_selbstvernachlaessigung',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'psych__wiederkehrende_angstzustaende',
      'psych__anhaltende_alltagsbeeintraechtigung',
    ],
    diagnoses: ['Akute Suizidalität', 'Intoxikation', 'Depressive Episode'],
    consequences: ['erneuten Suizidhandlungen, unbemerkten Verletzungen/Vergiftungen, bleibenden Gesundheitsschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akute Verwirrtheit/Delir [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'akute-verwirrtheit-delir-verweigerung',
    name: 'Akute Verwirrtheit/Delir',
    requirements: '',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit', 'neuro__zunehmende_schlaefrigkeit',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung', 'neuro__neue_krampfanfaelle',
      'neuro__ploetzliche_starke_kopfschmerzen', 'infekt__fieber_schuettelfrost', 'psych__halluzinationen',
      'psych__schwere_erregung', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'stoffwechsel__anhaltende_muedigkeit',
      'neuro__leichte_konzentrationsprobleme',
    ],
    diagnoses: ['Delir', 'Schlaganfall', 'Sepsis'],
    consequences: ['übersehenen Schlaganfällen, schweren Infektionen, Stoffwechselentgleisungen, Krampfanfällen, bleibenden Hirnschäden oder dem Tod'],
  },

  {
    id: 'gedaechtnisstoerung-amnesie-verweigerung',
    parentId: 'akute-verwirrtheit-delir-verweigerung',
    name: 'Akute Gedächtnisstörung/Amnesie',
    requirements: 'Neue Unfähigkeit, Informationen zu behalten, oder ungeklärte Erinnerungslücke; nicht vorschnell als harmlose transiente Amnesie einstufen.',
    majorSignalIds: [
      'neuro__erneute_gedaechtnisluecken', 'neuro__anhaltende_neugedaechtnisstoerung',
      'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'neuro__neue_krampfanfaelle', 'neuro__ploetzliche_starke_kopfschmerzen',
      'neuro__neue_gangunsicherheit', 'sehstoerung__ploetzlicher_sehverlust', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'neuro__leichte_konzentrationsprobleme', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Schlaganfall', 'Epileptischer Anfall', 'Transiente globale Amnesie'],
    consequences: ['übersehenen Schlaganfällen, epileptischen Anfällen, Gehirnentzündungen, bleibenden Gedächtnisstörungen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akuter Hodenschmerz/Torsionsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'hodenschmerz-torsionsverdacht-verweigerung',
    name: 'Akuter Hodenschmerz/Torsionsverdacht',
    requirements: 'Plötzlicher einseitiger Hodenschmerz oder akute Schwellung; Hodentorsion zeitkritisch auszuschließen.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__zunehmende_hodenschmerzen', 'uro__zunehmende_hodenschwellung', 'uro__verfaerbung_hodensack',
      'abdomen__anhaltendes_erbrechen', 'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Hodentorsion', 'Nebenhodenentzündung', 'Eingeklemmter Leistenbruch'],
    consequences: ['einer unentdeckten Hodentorsion, bleibenden Hodenschäden, dem Verlust des Hodens oder eingeschränkter Fruchtbarkeit'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akuter Vernichtungskopfschmerz [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'vernichtungskopfschmerz-verweigerung',
    name: 'Akuter Vernichtungskopfschmerz',
    requirements: 'Schlagartiger maximaler oder innerhalb weniger Minuten maximaler Kopfschmerz; Blutung/Gefäßereignis abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__ploetzliche_starke_kopfschmerzen', 'neuro__neue_bewusstlosigkeit',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'neuro__neue_krampfanfaelle', 'sehstoerung__ploetzlicher_sehverlust',
      'sehstoerung__neue_doppelbilder', 'neuro__neue_gangunsicherheit', 'abdomen__anhaltendes_erbrechen',
      'neuro__neue_nackensteifigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Subarachnoidalblutung', 'Arterielle Dissektion', 'Hirnvenenthrombose'],
    consequences: ['einer unerkannten Hirnblutung/Gefäßerkrankung, erneuten Blutungen, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Akutes Lungenödem (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'lungenoedem-verdacht-verweigerung',
    name: 'Akutes Lungenödem (Verdacht)',
    requirements: 'Akute Dyspnoe, Orthopnoe, feuchte Atemgeräusche oder schaumiger Auswurf; mögliche kardiale Dekompensation.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__schaumiger_auswurf', 'pulmo__zyanose', 'thorax__schmerzen_druck',
      'kreislauf__neue_probleme', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Lungenödem', 'Akute Herzinsuffizienz', 'Akutes Koronarsyndrom'],
    consequences: ['zunehmender Flüssigkeitsansammlung in der Lunge, schwerem Sauerstoffmangel, Atem-/Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Alkoholentzug mit Warnzeichen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'alkoholentzug-warnzeichen-verweigerung',
    name: 'Alkoholentzug mit Warnzeichen',
    requirements: 'Tremor und vegetative Überaktivität mit Halluzinationen, Verwirrtheit, Krampfanfall oder bekannter schwerer Entzugsvorgeschichte.',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [
      'intox__starkes_zittern_schwitzen', 'psych__halluzinationen', 'neuro__neue_verwirrtheit',
      'neuro__neue_krampfanfaelle', 'psych__schwere_erregung', 'kreislauf__anhaltendes_herzrasen',
      'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Alkoholentzugssyndrom', 'Entzugsdelir', 'Entzugskrampfanfall'],
    consequences: ['Krampfanfällen, einem Entzugsdelir, lebensbedrohlichen Herzrhythmusstörungen, Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Allergische Konjunktivitis (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'allergische-konjunktivitis-bekannt-bvo',
    name: 'Allergische Konjunktivitis (bekanntes Muster)',
    requirements: 'Beidseitiger Juckreiz und Tränenfluss; Visus unverändert, keine Schmerzen, Lichtscheu oder Kontaktlinsen-Risikokonstellation.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [
      'augen__starke_augenschmerzen', 'sehstoerung__rasche_sehverschlechterung', 'augen__lichtscheu',
    ],
    minorSignalIds: [
      'augen__juckreiz_traenenfluss', 'augen__anhaltende_roetung', 'augen__eitriges_sekret',
    ],
    diagnoses: ['Allergische Konjunktivitis', 'Keratitis', 'Uveitis'],
    consequences: ['einer übersehenen Hornhautentzündung, anhaltenden Beschwerden oder bleibender Sehverschlechterung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Allergische Reaktion (leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'allergische-reaktion-leicht-bvo',
    name: 'Allergische Reaktion (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'hno__zunge_rachenschwellung', 'hno__heiserkeit', 'hno__speichel_nicht_schluckbar',
      'pulmo__neue_luftnot', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [
      'haut__anhaltender_juckreiz', 'haut__wiederkehrender_ausschlag',
    ],
    diagnoses: ['Allergische Reaktion', 'Anaphylaxie'],
    consequences: ['einer fortschreitenden allergischen Reaktion mit Atemwegsverengung oder Kreislaufversagen'],
  },

  {
    id: 'insektenstich-lokal-bvo',
    parentId: 'allergische-reaktion-leicht-bvo',
    name: 'Insektenstich mit ausschließlich lokaler Reaktion',
    requirements: 'Begrenzte Reaktion an der Stichstelle; kein Stich im Mund/Rachen, keine Allgemeinreaktion oder rasche Ausbreitung.',
    majorSignalIds: [
      'hno__zunge_rachenschwellung', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [
      'haut__zunehmende_lokale_roetung', 'haut__zunehmende_lokale_schwellung', 'haut__anhaltender_juckreiz',
    ],
    diagnoses: ['Lokale Stichreaktion', 'Anaphylaxie', 'Hautinfektion'],
    consequences: ['einer übersehenen allergischen Allgemeinreaktion, Atemwegsverengung oder fortschreitenden Hautinfektion'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Anfallsartige Schmerzen/Invaginationsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'invaginationsverdacht-verweigerung',
    name: 'Anfallsartige Schmerzen/Invaginationsverdacht',
    requirements: 'Wiederkehrende Schmerz-/Schreiphasen, Blässe, Erbrechen oder auffällige Müdigkeit; blutiger Stuhl muss nicht vorliegen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'paediatrie__anfallsartiges_schreien_blaesse', 'paediatrie__schlaff_teilnahmslos',
      'abdomen__gruenes_erbrechen', 'abdomen__blut_im_stuhl', 'abdomen__hart_geblaeht',
      'abdomen__zunehmende_schmerzen', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Invagination', 'Darmverschluss', 'Darmischämie'],
    consequences: ['einem Darmverschluss, dem Absterben von Darmabschnitten, einem Darmdurchbruch, Bauchfellentzündung, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Angioödem an Zunge/Rachen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'angiooedem-zunge-rachen-verweigerung',
    name: 'Angioödem an Zunge/Rachen',
    requirements: 'Zungen-, Mundboden- oder Rachenschwellung, gegebenenfalls ohne Hautausschlag; drohende Atemwegsverlegung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'hno__zunge_rachenschwellung', 'hno__heiserkeit', 'hno__speichel_nicht_schluckbar', 'pulmo__stridor',
      'pulmo__neue_luftnot', 'pulmo__zyanose', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Angioödem', 'Anaphylaxie'],
    consequences: ['fortschreitender Atemwegsverlegung, Erstickung, bleibenden Hirnschäden durch Sauerstoffmangel oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Arthroseschmerz (bekanntes, leichtes Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'arthroseschmerz-leicht-bvo',
    name: 'Arthroseschmerz (bekanntes, leichtes Muster)',
    requirements: 'Bekannte Arthrose, übliche Beschwerden, belastbar; kein Trauma, heißes Gelenk, Fieber oder neuer Funktionsverlust.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [
      'gelenk__roetung_ueberwaermung', 'extremitaet__belastungsunfaehigkeit',
      'extremitaet__sensibilitaetsstoerung', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'gelenk__anhaltende_leichte_schmerzen', 'gelenk__wiederkehrende_steifigkeit',
    ],
    diagnoses: ['Arthrose', 'Gelenkinfektion', 'Kristallarthritis'],
    consequences: ['einer übersehenen Gelenkinfektion, fortschreitenden Gelenkschäden oder bleibender Bewegungseinschränkung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Aspiration von Erbrochenem/Nahrung mit Atembeschwerden [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'aspiration-erbrochenes-nahrung-atembeschwerden-verweigerung',
    name: 'Aspiration von Erbrochenem/Nahrung mit Atembeschwerden',
    requirements: 'Nach Aspirationsereignis anhaltender Husten, Rasseln, Hypoxie oder Luftnot; nicht bloß kurzzeitiges Räuspern.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__anhaltender_husten', 'pulmo__stridor', 'pulmo__zyanose',
      'infekt__fieber_schuettelfrost', 'neuro__zunehmende_schlaefrigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Aspirationspneumonitis', 'Aspirationspneumonie', 'Atemwegsverlegung'],
    consequences: ['verzögerter Lungenschädigung, Lungenentzündung, Atemversagen, bleibenden Hirnschäden durch Sauerstoffmangel oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Atemnot unklarer Ursache [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'atemnot-unklare-ursache-verweigerung',
    name: 'Atemnot unklarer Ursache',
    requirements: 'Neue oder anhaltende Atemnot ohne hinreichend geklärte harmlose Ursache; keine BvO allein wegen normaler Sauerstoffsättigung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__zyanose', 'pulmo__stridor',
      'kreislauf__neue_probleme', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Lungenembolie', 'Akute Herzinsuffizienz', 'Asthma-/COPD-Exazerbation'],
    consequences: ['unerkannter Herz-/Lungenerkrankung, schwerem Sauerstoffmangel, Atem-/Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Augenverätzung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'augenveraetzung-verweigerung',
    name: 'Augenverätzung',
    requirements: 'Säure-/Laugenkontakt oder unbekannte Chemikalie im Auge; sofortige Versorgung und dringliche augenärztliche Kontrolle.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [
      'augen__starke_augenschmerzen', 'sehstoerung__rasche_sehverschlechterung',
      'sehstoerung__ploetzlicher_sehverlust', 'augen__lichtscheu',
    ],
    minorSignalIds: [],
    diagnoses: ['Hornhautverätzung', 'Bindehautverätzung', 'Sekundärglaukom'],
    consequences: ['fortschreitenden Hornhautschäden, Vernarbungen, Infektionen oder bleibendem Sehverlust bis zur Erblindung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ausfall der Heimbeatmung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'heimbeatmung-ausfall-verweigerung',
    name: 'Ausfall der Heimbeatmung',
    requirements: 'Beatmungsabhängiger Patient ohne zuverlässig funktionierenden Ersatz; erneuter Ausfall oder Ateminsuffizienz zu befürchten.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__langsame_flache_atmung', 'pulmo__atempausen', 'pulmo__zyanose',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Akute Ateminsuffizienz', 'Hyperkapnie', 'Hypoxie'],
    consequences: ['Sauerstoffmangel, gefährlicher Kohlendioxidanreicherung, Bewusstlosigkeit, Atemstillstand, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Avulsion eines bleibenden Zahns [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'avulsion-bleibender-zahn-verweigerung',
    name: 'Avulsion eines bleibenden Zahns',
    requirements: 'Bleibender Zahn ausgeschlagen; zeitkritische zahnärztliche Versorgung wird abgelehnt, unabhängig von der geeigneten Transportart.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'hno__zunehmende_gesichtsschwellung', 'pulmo__neue_luftnot',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Zahnavulsion', 'Alveolarfortsatzfraktur'],
    consequences: ['einem dauerhaften Zahnverlust, Knochenschwund sowie bleibenden Kau-/Sprechbeeinträchtigungen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Balanitis (lokal begrenzt) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'balanitis-lokal-bvo',
    name: 'Balanitis (lokal begrenzt)',
    requirements: 'Leichte lokale Rötung/Beschwerden; freie Miktion, kein Fieber, keine Paraphimose oder rasche Ausbreitung; Arztkontakt geplant.',
    application: 'BvO',
    category: 'uro',
    majorSignalIds: [
      'uro__starke_penisschmerzen', 'uro__rasche_penisschwellung', 'uro__eichelverfaerbung',
      'uro__eingeklemmte_vorhaut', 'uro__anhaltende_oligurie_anurie', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'uro__eichelreizung', 'uro__eichelsekret',
    ],
    diagnoses: ['Balanoposthitis', 'Paraphimose', 'Harnverhalt'],
    consequences: ['einer fortschreitenden Entzündung, Vorhautverengung, Einklemmung der Vorhaut oder Harnverhalt'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bauchschmerzen (leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'bauchschmerzen-leicht-bvo',
    name: 'Bauchschmerzen (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__anhaltendes_erbrechen',
      'abdomen__blut_im_stuhl', 'abdomen__blutiges_erbrechen', 'infekt__fieber_schuettelfrost',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'abdomen__leichte_wiederkehrende_schmerzen', 'stoffwechsel__wiederkehrende_uebelkeit',
      'abdomen__anhaltender_durchfall',
    ],
    diagnoses: ['Appendizitis', 'Darmverschluss', 'Gastrointestinale Blutung'],
    consequences: ['einer übersehenen Bauchorganentzündung, einem Darmverschluss, inneren Blutungen oder bleibenden Organschäden'],
  },

  {
    id: 'obstipation-ohne-ileuszeichen-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Obstipation ohne Ileuszeichen',
    requirements: 'Bekanntes Problem, milde Beschwerden, Windabgang; kein Erbrechen, gebläht-schmerzhaftes Abdomen, Fieber oder Blut.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__windverhalt_mit_blaehung', 'abdomen__anhaltendes_erbrechen',
      'abdomen__blut_im_stuhl', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'abdomen__anhaltende_verstopfung', 'abdomen__leichte_wiederkehrende_schmerzen',
    ],
    diagnoses: ['Obstipation', 'Kotstau', 'Darmverschluss'],
    consequences: ['einem übersehenen Darmverschluss, einer Darmschädigung oder einem Darmdurchbruch'],
  },

  {
    id: 'refluxbeschwerden-bekannt-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Refluxbeschwerden (bekanntes Muster)',
    requirements: 'Gesicherter Reflux, typische leichte Beschwerden; keine Blutung, Dysphagie oder plausible kardiale Ursache; nicht allein durch Antazidawirkung begründet.',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'abdomen__blutiges_erbrechen', 'abdomen__teerstuhl', 'hno__speichel_nicht_schluckbar',
    ],
    minorSignalIds: [
      'abdomen__wiederkehrendes_sodbrennen', 'hno__anhaltende_schluckbeschwerden',
      'stoffwechsel__ungewollter_gewichtsverlust',
    ],
    diagnoses: ['Refluxösophagitis', 'Akutes Koronarsyndrom', 'Blutendes Magen-/Zwölffingerdarmgeschwür'],
    consequences: ['einer übersehenen Herzerkrankung, einer Speiseröhrenverengung oder Blutung'],
  },

  {
    id: 'reizdarmbeschwerden-leicht-bvo',
    parentId: 'bauchschmerzen-leicht-bvo',
    name: 'Reizdarmbeschwerden (bekannter leichter Schub)',
    requirements: 'Gesicherte Diagnose, unverändertes Muster; keine Blutung, nächtlich neue Beschwerden, Fieber oder Gewichtsverlust.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__blut_im_stuhl', 'abdomen__anhaltendes_erbrechen',
      'abdomen__windverhalt_mit_blaehung', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'abdomen__leichte_wiederkehrende_schmerzen', 'abdomen__anhaltender_durchfall',
      'abdomen__anhaltende_verstopfung', 'abdomen__naechtliche_beschwerden',
      'stoffwechsel__ungewollter_gewichtsverlust',
    ],
    diagnoses: ['Reizdarmsyndrom', 'Chronisch-entzündliche Darmerkrankung', 'Kolorektales Karzinom'],
    consequences: ['einer übersehenen entzündlichen Darmerkrankung oder verzögerten Diagnose eines Darmtumors'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bauchschmerzen (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'bauchschmerzen-schwer-verweigerung',
    name: 'Bauchschmerzen (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__anhaltendes_erbrechen',
      'abdomen__blutiges_erbrechen', 'abdomen__blut_im_stuhl', 'infekt__fieber_schuettelfrost',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Darmischämie', 'Hohlorganperforation', 'Darmverschluss'],
    consequences: ['einer unentdeckten Organentzündung/Durchblutungsstörung, einem Darmdurchbruch, inneren Blutungen, Organversagen oder dem Tod'],
  },

  {
    id: 'pankreatitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Akute Pankreatitis (Verdacht)',
    requirements: 'Anhaltender starker Oberbauchschmerz, gegebenenfalls Rückenausstrahlung und Erbrechen; Diagnose präklinisch nicht gesichert.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__anhaltendes_erbrechen',
      'infekt__fieber_schuettelfrost', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit', 'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Akute Pankreatitis', 'Cholangitis', 'Perforiertes Magengeschwür'],
    consequences: ['einem Absterben von Bauchspeicheldrüsengewebe, schweren Infektionen, Organversagen oder dem Tod'],
  },

  {
    id: 'appendizitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Appendizitis (Verdacht)',
    requirements: 'Progredienter, häufig rechtsseitiger Unterbauchschmerz mit passender Anamnese; fehlendes Fieber schließt sie nicht aus.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'abdomen__anhaltendes_erbrechen',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Appendizitis', 'Appendixperforation', 'Peritonitis'],
    consequences: ['einem Blinddarmdurchbruch, Bauchfellentzündung, Blutvergiftung, Organversagen oder dem Tod'],
  },

  {
    id: 'cholezystitis-cholangitis-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Cholezystitis/Cholangitis (Verdacht)',
    requirements: 'Anhaltender rechter Oberbauchschmerz, insbesondere mit Fieber oder Ikterus; keine bloß abgeklungene bekannte Kolik.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'infekt__fieber_schuettelfrost', 'stoffwechsel__gelbfaerbung',
      'abdomen__anhaltendes_erbrechen', 'abdomen__hart_geblaeht', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Akute Cholezystitis', 'Cholangitis', 'Choledocholithiasis'],
    consequences: ['einem Gallenwegsverschluss, Gallenblasendurchbruch, einer Blutvergiftung, Organversagen oder dem Tod'],
  },

  {
    id: 'ileus-darmverschluss-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Ileus/Darmverschluss (Verdacht)',
    requirements: 'Erbrechen, Distension, kolikartige oder anhaltende Schmerzen und ausbleibender Wind-/Stuhlabgang.',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__windverhalt_mit_blaehung', 'abdomen__anhaltendes_erbrechen',
      'abdomen__blut_im_stuhl', 'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Darmverschluss', 'Darmischämie', 'Darmperforation'],
    consequences: ['einem Absterben von Darmgewebe, Darmdurchbruch, Bauchfellentzündung, Organversagen oder dem Tod'],
  },

  {
    id: 'inkarzerierte-hernie-verdacht-verweigerung',
    parentId: 'bauchschmerzen-schwer-verweigerung',
    name: 'Inkarzerierte Hernie (Verdacht)',
    requirements: 'Neu schmerzhafte, nicht rückläufige Bruchvorwölbung, gegebenenfalls Erbrechen; mögliche Darmischämie.',
    majorSignalIds: [
      'abdomen__schmerzhafte_bruchvorwoelbung', 'abdomen__zunehmende_schmerzen',
      'abdomen__anhaltendes_erbrechen', 'abdomen__windverhalt_mit_blaehung', 'haut__dunkle_verfaerbung',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Inkarzerierte Hernie', 'Strangulationsileus', 'Darmischämie'],
    consequences: ['einem Absterben eingeklemmten Darmgewebes, Darmdurchbruch, Bauchfellentzündung, Blutvergiftung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Beckentrauma mit Frakturverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'beckentrauma-frakturverdacht-verweigerung',
    name: 'Beckentrauma mit Frakturverdacht',
    requirements: 'Beckenschmerz nach Trauma, eingeschränkte Belastbarkeit oder relevanter Unfallmechanismus; Risiko verdeckter Blutung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'becken__zunehmende_schmerzen', 'abdomen__zunehmende_schmerzen', 'uro__neue_haematurie',
      'uro__anhaltende_oligurie_anurie', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
      'extremitaet__sensibilitaetsstoerung',
    ],
    minorSignalIds: [],
    diagnoses: ['Beckenfraktur', 'Retroperitoneale Blutung', 'Harnwegsverletzung'],
    consequences: ['unerkannten inneren Blutungen, Blasen-/Harnröhrenverletzungen, bleibenden Funktionsschäden, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bedrohliche Elektrolytstörung (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'elektrolytstoerung-bedrohlich-verdacht-verweigerung',
    name: 'Bedrohliche Elektrolytstörung (Verdacht)',
    requirements: 'Passender aktueller Laborbefund, EKG-Veränderung oder klinischer Verdacht, etwa bei Dialyseversäumnis mit Schwäche/Arrhythmie.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [
      'kreislauf__anhaltendes_herzrasen', 'kreislauf__neue_probleme', 'neuro__zunehmende_muskelschwaeche',
      'neuro__muskelkraempfe', 'neuro__neue_verwirrtheit', 'neuro__neue_krampfanfaelle',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Hyperkaliämie', 'Hypokaliämie', 'Hyponatriämie'],
    consequences: ['lebensbedrohlichen Herzrhythmusstörungen, Krampfanfällen, Atem-/Kreislaufstillstand, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Blitzunfall [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'blitzunfall-verweigerung',
    name: 'Blitzunfall',
    requirements: 'Direkter oder indirekter Blitzkontakt; mögliche kardiale, neurologische, akustische und traumatische Schäden.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'kreislauf__anhaltendes_herzrasen', 'pulmo__neue_luftnot',
      'neuro__neue_bewusstlosigkeit', 'neuro__neue_verwirrtheit', 'extremitaet__bewegungsstoerung',
      'extremitaet__sensibilitaetsstoerung', 'hno__ploetzliche_hoerminderung',
    ],
    minorSignalIds: [
      'hno__anhaltendes_ohrgeraeusch',
    ],
    diagnoses: ['Herzrhythmusstörung', 'Blitzbedingte Nervenverletzung', 'Trommelfell-/Innenohrschädigung'],
    consequences: ['unerkannten Herzrhythmusstörungen, Atemstillstand, bleibenden Nerven-/Hörschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bolusobstruktion der Speiseröhre [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'bolusobstruktion-speiseroehre-verweigerung',
    name: 'Bolusobstruktion der Speiseröhre',
    requirements: 'Speisebolus steckt fest, Schlucken beziehungsweise Speichelschlucken nicht möglich; keine gewöhnliche Refluxsymptomatik.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [
      'hno__speichel_nicht_schluckbar', 'pulmo__neue_luftnot', 'thorax__schmerzen_druck',
      'abdomen__blutiges_erbrechen', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Speisebolusimpaktion', 'Speiseröhrenverengung', 'Ösophagusperforation'],
    consequences: ['einem Verschlucken mit Atemwegsverlegung, Speiseröhrendurchbruch, schweren Brustkorbinfektionen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Bronchiolitis mit Warnzeichen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'bronchiolitis-warnzeichen-verweigerung',
    name: 'Bronchiolitis mit Warnzeichen',
    requirements: 'Atempausen, erhöhte Atemarbeit, Hypoxie oder relevante Trinkschwäche; besonders bei sehr jungen/frühgeborenen Säuglingen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'pulmo__atempausen', 'pulmo__zyanose', 'paediatrie__angestrengte_atmung',
      'paediatrie__schlaff_teilnahmslos', 'paediatrie__trinkschwaeche', 'paediatrie__wenige_nasse_windeln',
    ],
    minorSignalIds: [],
    diagnoses: ['Bronchiolitis', 'Pneumonie', 'Respiratorische Insuffizienz'],
    consequences: ['zunehmendem Sauerstoffmangel, Atemstillstand, Austrocknung, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Chemische Hautverätzung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'chemische-hautveraetzung-verweigerung',
    name: 'Chemische Hautverätzung',
    requirements: 'Relevanter Säure-/Laugenkontakt oder besonders gefährlicher Stoff; nach Dekontamination weiterhin fachärztlicher Beurteilungsbedarf.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'haut__starke_schmerzen', 'haut__anhaltende_taubheit', 'haut__blasenbildung', 'haut__dunkle_verfaerbung',
      'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Hautverätzung', 'Tiefe Gewebsnekrose', 'Systemische Giftwirkung'],
    consequences: ['fortschreitender Gewebezerstörung, bleibenden Narben-/Funktionsschäden oder einer lebensbedrohlichen Giftwirkung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Chronische Beinödeme (unverändert) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'chronische-beinoedeme-unveraendert-bvo',
    name: 'Chronische Beinödeme (unverändert)',
    requirements: 'Bekannte beidseitige Ödeme auf Ausgangsniveau; keine Dyspnoe, neue Asymmetrie, Rötung, Schmerzen oder akute Gewichtszunahme.',
    application: 'BvO',
    category: 'kreislauf',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'extremitaet__einseitige_schwellung_schmerz',
      'uro__anhaltende_oligurie_anurie', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'extremitaet__langsame_beidseitige_beinoedeme', 'haut__naessende_offene_stellen',
    ],
    diagnoses: ['Chronische venöse Insuffizienz', 'Herzinsuffizienz', 'Tiefe Venenthrombose'],
    consequences: ['zunehmenden Hautschäden, übersehener Herzschwäche oder einer Thrombose mit Lungenembolie'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Clusterkopfschmerz (bekannte, beendete Attacke) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'clusterkopfschmerz-attacke-beendet-bvo',
    name: 'Clusterkopfschmerz (bekannte, beendete Attacke)',
    requirements: 'Gesicherte Diagnose und individueller Therapieplan; typische Attacke beendet, keine neuen Befunde.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [
      'neuro__blitzartiger_maximalkopfschmerz', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'sehstoerung__rasche_sehverschlechterung', 'neuro__neue_nackensteifigkeit',
      'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [
      'neuro__wiederkehrende_typische_kopfschmerzen',
    ],
    diagnoses: ['Clusterkopfschmerz', 'Glaukomanfall', 'Subarachnoidalblutung'],
    consequences: ['zunehmenden Schmerzattacken, Schlafstörungen oder verzögerter Erkennung einer anderen Kopfschmerzursache'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Depressive Beschwerden ohne akuten Gefährdungsbefund [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'depressive-beschwerden-ohne-akute-gefaehrdung-bvo',
    name: 'Depressive Beschwerden ohne akuten Gefährdungsbefund',
    requirements: 'Nach sorgfältiger Exploration keine akute Suizidalität/Psychose; Selbstversorgung, Unterstützung und verbindliche Anschlussversorgung gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [
      'psych__suizidgedanken', 'psych__halluzinationen', 'psych__schwere_erregung',
      'psych__zunehmende_selbstvernachlaessigung', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [
      'psych__anhaltende_niedergeschlagenheit', 'psych__anhaltende_schlafstoerungen',
      'psych__anhaltende_alltagsbeeintraechtigung',
    ],
    diagnoses: ['Depressive Episode', 'Anpassungsstörung', 'Suizidale Krise'],
    consequences: ['zunehmender Depression, schwerer Selbstvernachlässigung, Selbstverletzungen oder einem Suizid'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dialyseshuntblutung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'dialyseshuntblutung-verweigerung',
    name: 'Dialyseshuntblutung',
    requirements: 'Anhaltende oder wiederkehrende Blutung aus Fistel/Graft; Risiko erheblichen Blutverlustes.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'shunt__anhaltende_erneute_blutung', 'kreislauf__neue_probleme', 'pulmo__neue_luftnot',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Dialyseshuntblutung', 'Shuntaneurysma', 'Hämorrhagischer Schock'],
    consequences: ['erneuter massiver Blutung, lebensbedrohlichem Blutverlust, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dislozierte Gastrostomie-/PEG-Sonde [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'gastrostomie-peg-sonde-disloziert-verweigerung',
    name: 'Dislozierte Gastrostomie-/PEG-Sonde',
    requirements: 'Sonde herausgerutscht oder Lage unklar; zeitkritische Beurteilung des Zugangs, besonders bei frischer Anlage.',
    application: 'Verweigerung',
    category: 'gastro',
    majorSignalIds: [
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'peg__fluessigkeitsaustritt',
      'wunde__starke_anhaltende_blutung', 'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Sondendislokation', 'Peritonitis', 'Verschluss des Gastrostomiekanals'],
    consequences: ['einem Verschluss des Sondenkanals, Austritt von Sondennahrung in die Bauchhöhle, Bauchfellentzündung, Blutvergiftung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Dysmenorrhoe (bekanntes, übliches Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'dysmenorrhoe-bekannt-bvo',
    name: 'Dysmenorrhoe (bekanntes, übliches Muster)',
    requirements: 'Vertraute zyklusbezogene Schmerzen, beherrschbar; Schwangerschaft ausreichend ausgeschlossen, keine ungewöhnliche Blutung, neuen einseitigen Schmerzen oder Infektzeichen.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [
      'gyn__starke_einseitige_unterbauchschmerzen', 'abdomen__zunehmende_schmerzen',
      'gyn__starke_vaginale_blutung', 'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'gyn__wiederkehrende_regelschmerzen', 'gyn__zwischenblutungen',
    ],
    diagnoses: ['Dysmenorrhoe', 'Endometriose', 'Adnexitis'],
    consequences: ['einer übersehenen Unterleibserkrankung, chronischen Schmerzen oder Einschränkungen der Fruchtbarkeit'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Epiglottitis (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'epiglottitis-verdacht-verweigerung',
    name: 'Epiglottitis (Verdacht)',
    requirements: 'Starke Schluckbeschwerden, Speichelfluss, auffällige Stimme, Stridor oder Atemnot; keine gewöhnliche Halsentzündung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'hno__speichel_nicht_schluckbar', 'hno__heiserkeit', 'pulmo__stridor', 'pulmo__neue_luftnot',
      'pulmo__zyanose', 'neuro__zunehmende_schlaefrigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Epiglottitis', 'Kehlkopfentzündung', 'Tiefer Halsabszess'],
    consequences: ['einem vollständigen Atemwegsverschluss, Erstickung, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Erfrierung mit Gewebeschädigungsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'erfrierung-gewebeschaedigungsverdacht-verweigerung',
    name: 'Erfrierung mit Gewebeschädigungsverdacht',
    requirements: 'Anhaltende Gefühllosigkeit, harte/blasse Haut oder Blasen nach Kälteeinwirkung; Tiefe der Schädigung unklar.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'extremitaet__sensibilitaetsstoerung', 'extremitaet__bewegungsstoerung',
      'extremitaet__kalte_extremitaet', 'haut__blasenbildung', 'haut__dunkle_verfaerbung',
      'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Erfrierung', 'Gewebsnekrose', 'Unterkühlung'],
    consequences: ['fortschreitendem Gewebeverlust, bleibenden Nerven-/Durchblutungsschäden, Infektionen oder einer Amputation'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ertrinkungsunfall mit Atembeeinträchtigung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'ertrinkungsunfall-atembeeintraechtigung-verweigerung',
    name: 'Ertrinkungsunfall mit Atembeeinträchtigung',
    requirements: 'Nach Untertauchen Husten, Atemnot, Hypoxie oder vorausgegangene Atemstörung; zwischenzeitliche Besserung genügt nicht zur Entwarnung.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__anhaltender_husten', 'pulmo__schaumiger_auswurf', 'pulmo__zyanose',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Aspirationsbedingte Lungenschädigung', 'Lungenödem', 'Hypoxische Hirnschädigung'],
    consequences: ['fortschreitender Lungenschädigung, Sauerstoffmangel, Atemversagen, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Erysipel/Zellulitis mit systemischen Zeichen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'erysipel-zellulitis-systemisch-verweigerung',
    name: 'Erysipel/Zellulitis mit systemischen Zeichen',
    requirements: 'Ausbreitende Rötung mit Fieber, Schüttelfrost, deutlicher Schwäche oder Kreislaufauffälligkeit.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [
      'haut__rasch_ausbreitende_roetung', 'haut__starke_schmerzen', 'haut__dunkle_verfaerbung',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
      'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Erysipel/Zellulitis', 'Sepsis', 'Nekrotisierende Weichteilinfektion'],
    consequences: ['einer fortschreitenden Gewebeinfektion, Gewebeverlust, Blutvergiftung mit Organversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Extrauteringravidität (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'extrauteringraviditaet-verdacht-verweigerung',
    name: 'Extrauteringravidität (Verdacht)',
    requirements: 'Mögliche Schwangerschaft mit Unterbauchschmerz, insbesondere einseitig, Schulterschmerz, Kollaps oder Blutung; Blutung kann fehlen.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__starke_einseitige_unterbauchschmerzen', 'abdomen__zunehmende_schmerzen',
      'gyn__schulterspitzenschmerz', 'gyn__vaginale_blutung', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Extrauteringravidität', 'Rupturierte Ovarialzyste', 'Fehlgeburt'],
    consequences: ['einem Eileiterriss, inneren Blutungen, Kreislaufversagen, dem Verlust des Eileiters oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Extremitätenverletzung (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Extremitätenverletzung (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'extremitaet__bewegungsstoerung', 'extremitaet__zunehmende_schmerzen',
      'extremitaet__gespannte_schwellung', 'extremitaet__sensibilitaetsstoerung',
      'extremitaet__blaesse_blaufarbung', 'extremitaet__kalte_extremitaet', 'wunde__starke_anhaltende_blutung',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Fraktur/Luxation', 'Gefäß-/Nervenverletzung', 'Kompartmentsyndrom'],
    consequences: ['unerkannten Gefäß-/Nervenverletzungen, Muskelnekrosen, bleibendem Funktionsverlust, einer Amputation oder lebensbedrohlichem Blutverlust'],
  },

  {
    id: 'kompartmentsyndrom-verdacht-verweigerung',
    parentId: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Akutes Kompartmentsyndrom (Verdacht)',
    requirements: 'Unverhältnismäßiger zunehmender Schmerz, gespannte Schwellung, Dehnungsschmerz oder Sensibilitätsstörung; erhaltene Pulse schließen es nicht aus.',
    majorSignalIds: [
      'extremitaet__bewegungsstoerung', 'extremitaet__zunehmende_schmerzen',
      'extremitaet__starke_dehnungsschmerzen', 'extremitaet__gespannte_schwellung',
      'extremitaet__sensibilitaetsstoerung', 'extremitaet__blaesse_blaufarbung',
      'extremitaet__kalte_extremitaet',
    ],
    minorSignalIds: [],
    diagnoses: ['Kompartmentsyndrom', 'Muskelnekrose', 'Akute Extremitätenischämie'],
    consequences: ['bleibenden Nerven-/Muskelschäden, Gewebeverlust, einer Amputation, Nierenversagen oder dem Tod'],
  },

  {
    id: 'amputationsverletzung-verweigerung',
    parentId: 'extremitaetenverletzung-schwer-verweigerung',
    name: 'Amputationsverletzung',
    requirements: 'Vollständige oder teilweise Abtrennung eines Körperteils; Blutungsversorgung und zeitkritische operative Beurteilung erforderlich.',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
      'extremitaet__zunehmende_schmerzen', 'extremitaet__blaesse_blaufarbung',
      'extremitaet__sensibilitaetsstoerung',
    ],
    minorSignalIds: [],
    diagnoses: ['Amputationsverletzung', 'Gefäßverletzung', 'Hämorrhagischer Schock'],
    consequences: ['lebensbedrohlichem Blutverlust, Verlust der Wiederannähbarkeit, dauerhafter Behinderung, schweren Infektionen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieber beim Säugling unter drei Monaten [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'fieber-saeugling-unter-drei-monaten-verweigerung',
    name: 'Fieber beim Säugling unter drei Monaten',
    requirements: 'Gemessene Temperatur ab 38 °C; auch bei zunächst gutem Eindruck dringend kinderärztlich abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'infekt__fieber_schuettelfrost', 'paediatrie__trinkschwaeche', 'paediatrie__wenige_nasse_windeln',
      'paediatrie__schlaff_teilnahmslos', 'paediatrie__angestrengte_atmung', 'pulmo__atempausen',
      'haut__nicht_wegdrueckbare_flecken', 'neuro__neue_krampfanfaelle',
    ],
    minorSignalIds: [],
    diagnoses: ['Schwere bakterielle Infektion', 'Sepsis', 'Meningitis'],
    consequences: ['einer übersehenen schweren Infektion, Blutvergiftung, Hirnhautentzündung, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieber/Infekt/Sepsis [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'fieber-infekt-sepsis-verweigerung',
    name: 'Fieber/Infekt/Sepsis',
    requirements: '',
    application: 'Verweigerung',
    category: 'infekt',
    majorSignalIds: [
      'infekt__fieber_schuettelfrost', 'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
      'pulmo__neue_luftnot', 'kreislauf__neue_probleme', 'uro__anhaltende_oligurie_anurie',
      'haut__nicht_wegdrueckbare_flecken',
    ],
    minorSignalIds: [],
    diagnoses: ['Sepsis', 'Pneumonie', 'Pyelonephritis'],
    consequences: ['fortschreitender Infektion, septischem Schock, Organversagen, bleibenden Organschäden oder dem Tod'],
  },

  {
    id: 'fieber-neutropenie-immunsuppression-verweigerung',
    parentId: 'fieber-infekt-sepsis-verweigerung',
    name: 'Fieber bei Neutropenie/ausgeprägter Immunsuppression',
    requirements: 'Fieber oder klinische Verschlechterung unter entsprechender Therapie/Risikokonstellation; diskrete Befunde können schwere Infektion verbergen.',
    majorSignalIds: [
      'infekt__fieber_schuettelfrost', 'neuro__zunehmende_muskelschwaeche', 'neuro__neue_verwirrtheit',
      'neuro__zunehmende_schlaefrigkeit', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Neutropenische Sepsis', 'Pneumonie', 'Blutstrominfektion'],
    consequences: ['rasch fortschreitender Infektion, septischem Schock, Multiorganversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fieberhafter Infekt (leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'fieberhafter-infekt-leicht-bvo',
    name: 'Fieberhafter Infekt (leicht)',
    requirements: '',
    application: 'BvO',
    category: 'infekt',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
      'neuro__neue_nackensteifigkeit', 'haut__nicht_wegdrueckbare_flecken',
      'stoffwechsel__fehlende_trinkfaehigkeit', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'infekt__anhaltendes_fieber', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Viraler Infekt', 'Pneumonie', 'Harnwegsinfekt'],
    consequences: ['übersehener bakterieller Infektion, zunehmendem Flüssigkeitsmangel oder einer Ausbreitung der Infektion'],
  },

  {
    id: 'bronchitis-ohne-atemnot-bvo',
    parentId: 'fieberhafter-infekt-leicht-bvo',
    name: 'Akute Bronchitis ohne Atemnot',
    requirements: 'Leichter Husten, normale Oxygenierung und Atemarbeit; kein Pneumonieverdacht, keine Hämoptyse oder relevante Risikokonstellation.',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__relevante_haemoptyse',
      'neuro__zunehmende_schlaefrigkeit', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'pulmo__anhaltender_husten', 'infekt__anhaltendes_fieber', 'pulmo__blutspuren_im_auswurf',
    ],
    diagnoses: ['Akute Bronchitis', 'Pneumonie'],
    consequences: ['übersehener Lungenentzündung, zunehmenden Atembeschwerden oder verzögerter Behandlung einer anderen Lungenerkrankung'],
  },

  {
    id: 'halsschmerzen-ohne-schluck-atemstoerung-bvo',
    parentId: 'fieberhafter-infekt-leicht-bvo',
    name: 'Halsschmerzen ohne Schluck-/Atemstörung',
    requirements: 'Trinken möglich; keine kloßige Stimme, Kieferklemme, Speichelfluss, Halsweichteilschwellung oder schwere Allgemeinsymptome.',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__stridor', 'hno__speichel_nicht_schluckbar', 'hno__zunge_rachenschwellung',
      'hno__kieferklemme', 'hno__kloessige_stimme',
    ],
    minorSignalIds: [
      'hno__anhaltende_halsschmerzen', 'infekt__anhaltendes_fieber',
    ],
    diagnoses: ['Tonsillitis', 'Peritonsillarabszess', 'Epiglottitis'],
    consequences: ['fortschreitender Halsinfektion, Abszessbildung, Schluckunfähigkeit oder einer Verlegung der Atemwege'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Fremdkörperaspiration (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'fremdkoerperaspiration-verdacht-verweigerung',
    name: 'Fremdkörperaspiration (Verdacht)',
    requirements: 'Verschluckereignis mit möglichem verbliebenem Atemwegsfremdkörper; auch bei vorübergehend unauffälliger Untersuchung.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'pulmo__anhaltender_husten', 'pulmo__stridor', 'pulmo__zyanose',
      'pulmo__atempausen', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Atemwegsfremdkörper', 'Atemwegsverlegung', 'Aspirationspneumonie'],
    consequences: ['verzögerter Atemwegsverlegung, Lungenentzündung, Erstickung, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Galliges Erbrechen beim Kind [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'galliges-erbrechen-kind-verweigerung',
    name: 'Galliges Erbrechen beim Kind',
    requirements: 'Grünes Erbrechen, insbesondere beim Neugeborenen/Säugling; Darmobstruktion bis zum Ausschluss annehmen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'abdomen__gruenes_erbrechen', 'abdomen__hart_geblaeht', 'abdomen__zunehmende_schmerzen',
      'abdomen__blut_im_stuhl', 'paediatrie__schlaff_teilnahmslos', 'paediatrie__wenige_nasse_windeln',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Darmverschluss', 'Volvulus', 'Invagination'],
    consequences: ['einem Darmverschluss, dem Absterben von Darm, Darmdurchbruch, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Geringfügige Haushaltsstoffexposition (toxikologisch abgeklärt) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'haushaltsstoffexposition-abgeklaert-bvo',
    name: 'Geringfügige Haushaltsstoffexposition (toxikologisch abgeklärt)',
    requirements: 'Unbeabsichtigte Exposition, Produkt/Menge/Weg geklärt, nach erforderlichen Maßnahmen symptomfrei; Giftinformationszentrum bestätigt häusliche Beobachtung.',
    application: 'BvO',
    category: 'intox',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'hno__speichel_nicht_schluckbar', 'abdomen__anhaltendes_erbrechen',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_krampfanfaelle', 'augen__starke_augenschmerzen',
    ],
    minorSignalIds: [
      'pulmo__anhaltender_husten', 'haut__zunehmende_lokale_roetung', 'stoffwechsel__wiederkehrende_uebelkeit',
    ],
    diagnoses: ['Schleimhautreizung', 'Reizgaswirkung', 'Aspirationspneumonitis'],
    consequences: ['verzögerten Atemwegsbeschwerden, Schleimhautschäden oder einer übersehenen Aspiration'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Halskompression/Strangulation [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'halskompression-strangulation-verweigerung',
    name: 'Halskompression/Strangulation',
    requirements: 'Relevante Halskompression, insbesondere mit Heiserkeit, Schluckbeschwerden, Luftnot oder Bewusstseinsverlust; mögliche verzögerte Atemwegs- und Gefäßkomplikationen.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'hno__heiserkeit', 'hno__zunehmende_gesichtsschwellung', 'hno__speichel_nicht_schluckbar',
      'pulmo__stridor', 'pulmo__neue_luftnot', 'neuro__neue_sprachstoerung',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Kehlkopf-/Atemwegsverletzung', 'Halsgefäßdissektion', 'Hypoxische Hirnschädigung'],
    consequences: ['einem verzögerten Atemwegsverschluss, Gefäßverletzungen, Schlaganfall, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hämoptysen (relevant oder wiederholt) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'haemoptysen-relevant-wiederholt-verweigerung',
    name: 'Hämoptysen (relevant oder wiederholt)',
    requirements: 'Bluthusten über einzelne Blutspuren hinaus, wiederholte Episoden oder zusätzliche Atemnot/Kreislaufbeschwerden.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__relevante_haemoptyse', 'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__zyanose',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Lungenembolie', 'Pneumonie', 'Bronchialkarzinom'],
    consequences: ['zunehmender Lungenblutung, Verlegung der Atemwege durch Blut, Atem-/Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hämorrhoidalbeschwerden ohne relevante Blutung [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'haemorrhoidalbeschwerden-ohne-relevante-blutung-bvo',
    name: 'Hämorrhoidalbeschwerden ohne relevante Blutung',
    requirements: 'Bekannte leichte lokale Beschwerden; keine ungeklärte rektale Blutung, starken Schmerzen, Fieber oder Kreislaufprobleme.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [
      'abdomen__starke_rektalblutung', 'abdomen__teerstuhl', 'abdomen__starke_afterschmerzen',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'abdomen__afterjuckreiz', 'abdomen__geringe_wiederkehrende_blutspuren',
    ],
    diagnoses: ['Hämorrhoidalleiden', 'Analfissur', 'Perianalabszess'],
    consequences: ['einer übersehenen Blutungsquelle, Blutarmut oder einem unentdeckten Abszess'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Herpes zoster ohne Risikobeteiligung [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'herpes-zoster-ohne-risikobeteiligung-bvo',
    name: 'Herpes zoster ohne Risikobeteiligung',
    requirements: 'Umschriebener typischer Ausschlag, guter Allgemeinzustand; kein Augen-/Ohrenbefall, keine Immunsuppression; zeitnaher Arztkontakt gesichert.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'haut__blaeschen_auge_nase_ohr', 'augen__starke_augenschmerzen',
      'sehstoerung__rasche_sehverschlechterung', 'hno__ploetzliche_hoerminderung', 'neuro__gesichtslaehmung',
      'haut__grossflaechige_blaeschenausbreitung',
    ],
    minorSignalIds: [
      'haut__anhaltende_brennende_schmerzen', 'haut__eitriges_sekret',
    ],
    diagnoses: ['Herpes zoster', 'Zoster ophthalmicus/oticus', 'Postzosterneuralgie'],
    consequences: ['anhaltenden Nervenschmerzen, bleibenden Seh-/Hörschäden oder einer Ausbreitung der Infektion'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzeerkrankung mit neurologischen Auffälligkeiten [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'hitzeerkrankung-neurologische-auffaelligkeiten-verweigerung',
    name: 'Hitzeerkrankung mit neurologischen Auffälligkeiten',
    requirements: 'Hitzeexposition mit Verwirrtheit, Ataxie, Krampfanfall oder Bewusstseinsstörung; Hitzschlagverdacht.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'neuro__neue_verwirrtheit', 'neuro__neue_gangunsicherheit', 'neuro__neue_krampfanfaelle',
      'neuro__neue_bewusstlosigkeit', 'kreislauf__neue_probleme', 'uro__dunkelbrauner_urin',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Hitzschlag', 'Rhabdomyolyse', 'Akutes Nierenversagen'],
    consequences: ['bleibenden Hirnschäden, Muskelzerfall, Nieren-/Leberversagen, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzeerschöpfung (vollständig gebessert) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'hitzeerschoepfung-gebessert-bvo',
    name: 'Hitzeerschöpfung (vollständig gebessert)',
    requirements: 'Nach Kühlung und Trinken anhaltend erholt, Temperatur und Vitalwerte unauffällig; zu keinem Zeitpunkt neurologische Auffälligkeiten.',
    application: 'BvO',
    category: 'umwelt',
    majorSignalIds: [
      'neuro__neue_verwirrtheit', 'neuro__neue_gangunsicherheit', 'neuro__neue_krampfanfaelle',
      'neuro__neue_bewusstlosigkeit', 'kreislauf__neue_probleme', 'abdomen__anhaltendes_erbrechen',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [
      'stoffwechsel__anhaltende_muedigkeit', 'stoffwechsel__wiederkehrende_uebelkeit',
    ],
    diagnoses: ['Hitzeerschöpfung', 'Hitzschlag', 'Flüssigkeits-/Elektrolytstörung'],
    consequences: ['erneuter Überwärmung, Austrocknung, Kreislaufkollaps oder einer übersehenen schweren Hitzeerkrankung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hitzekrämpfe (vollständig rückläufig) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'hitzekraempfe-ruecklaeufig-bvo',
    name: 'Hitzekrämpfe (vollständig rückläufig)',
    requirements: 'Nach Belastungsende und angemessener Flüssigkeitsaufnahme beschwerdefrei; keine Überwärmung, Schwäche, Verwirrtheit oder dunkler Urin.',
    application: 'BvO',
    category: 'umwelt',
    majorSignalIds: [
      'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit', 'kreislauf__neue_probleme',
      'muskeln__starke_schmerzen_schwellung', 'neuro__zunehmende_muskelschwaeche', 'uro__dunkelbrauner_urin',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [
      'neuro__muskelkraempfe', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Hitzekrämpfe', 'Elektrolytstörung', 'Rhabdomyolyse'],
    consequences: ['anhaltenden Elektrolytstörungen, Muskelzerfall, Nierenschäden oder Kreislaufkollaps'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Hyperglykämie (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'hyperglykaemie-schwer-verweigerung',
    name: 'Hyperglykämie (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [
      'stoffwechsel__starker_durst_polyurie', 'abdomen__anhaltendes_erbrechen',
      'abdomen__zunehmende_schmerzen', 'stoffwechsel__tiefe_schnelle_atmung',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'stoffwechsel__fehlende_trinkfaehigkeit',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Diabetische Ketoazidose', 'Hyperosmolares hyperglykämisches Syndrom', 'Elektrolytstörung'],
    consequences: ['schwerer Austrocknung, Übersäuerung, Elektrolytstörungen, Bewusstlosigkeit, Organversagen oder dem Tod'],
  },

  {
    id: 'diabetische-ketoazidose-verdacht-verweigerung',
    parentId: 'hyperglykaemie-schwer-verweigerung',
    name: 'Diabetische Ketoazidose (Verdacht)',
    requirements: 'Diabetes mit Übelkeit, Bauchschmerz, Dehydratation oder tiefer Atmung; auch bei wachem Patienten und nicht stark erhöhtem Blutzucker.',
    majorSignalIds: [
      'abdomen__anhaltendes_erbrechen', 'abdomen__zunehmende_schmerzen', 'stoffwechsel__tiefe_schnelle_atmung',
      'stoffwechsel__fruchtiger_atem', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Diabetische Ketoazidose', 'Elektrolytstörung'],
    consequences: ['fortschreitender Übersäuerung, schweren Elektrolytstörungen, Herzrhythmusstörungen, Bewusstlosigkeit, Organversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: ICD-Schockabgabe mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'icd-schockabgabe-risikomerkmale-verweigerung',
    name: 'ICD-Schockabgabe mit Risikomerkmalen',
    requirements: 'Mehrere Schocks, anhaltende Beschwerden, Synkope oder Rhythmusstörung; dringliche kardiale und Gerätebeurteilung erforderlich.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'kreislauf__erneute_icd_schocks', 'kreislauf__anhaltendes_herzrasen', 'thorax__schmerzen_druck',
      'pulmo__neue_luftnot', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Ventrikuläre Tachykardie', 'ICD-Fehlfunktion', 'Akutes Koronarsyndrom'],
    consequences: ['erneuten lebensbedrohlichen Herzrhythmusstörungen, wiederholten Schockabgaben, Kreislaufstillstand, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Intoxikation (unklar) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'intoxikation-unklar-verweigerung',
    name: 'Intoxikation (unklar)',
    requirements: '',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'pulmo__langsame_flache_atmung',
      'pulmo__atempausen', 'pulmo__neue_luftnot', 'neuro__neue_krampfanfaelle', 'thorax__schmerzen_druck',
      'kreislauf__anhaltendes_herzrasen', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Vergiftung', 'Atemdepression', 'Toxische Herzrhythmusstörung'],
    consequences: ['verzögertem Atemstillstand, Herzrhythmusstörungen, Krampfanfällen, bleibenden Organschäden oder dem Tod'],
  },

  {
    id: 'giftpilzaufnahme-moeglich-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Giftpilzaufnahme (möglich)',
    requirements: 'Nicht sicher bestimmte Pilze oder verdächtiger Verlauf; Giftinformationszentrum einschalten, mögliche lange Symptomlatenz berücksichtigen.',
    majorSignalIds: [
      'intox__uebelkeit_erbrechen', 'abdomen__durchfall', 'abdomen__zunehmende_schmerzen',
      'stoffwechsel__gelbfaerbung', 'uro__anhaltende_oligurie_anurie', 'neuro__neue_verwirrtheit',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Pilzvergiftung', 'Akutes Leberversagen', 'Akutes Nierenversagen'],
    consequences: ['verzögertem Leber- oder Nierenversagen, Gerinnungsstörungen, Transplantationspflichtigkeit oder dem Tod'],
  },

  {
    id: 'opioidintoxikation-nach-antagonisierung-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Opioidintoxikation nach Antagonisierung',
    requirements: 'Aktuell gebessert, aber erneute Atemdepression oder Mischintoxikation möglich; erforderliche Überwachung wird abgelehnt.',
    majorSignalIds: [
      'neuro__zunehmende_schlaefrigkeit', 'pulmo__langsame_flache_atmung', 'pulmo__atempausen',
      'pulmo__zyanose', 'neuro__neue_bewusstlosigkeit', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Erneute Opioidintoxikation', 'Atemdepression', 'Aspirationspneumonie'],
    consequences: ['erneuter Atemlähmung nach Abklingen des Gegenmittels, Sauerstoffmangel, bleibenden Hirnschäden oder dem Tod'],
  },

  {
    id: 'paracetamolueberdosierung-verdacht-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Paracetamolüberdosierung (Verdacht)',
    requirements: 'Potenziell toxische Menge, wiederholte Überdosierung oder unklare Menge; anfängliche Beschwerdefreiheit schließt Organschädigung nicht aus.',
    majorSignalIds: [
      'intox__uebelkeit_erbrechen', 'abdomen__zunehmende_schmerzen', 'stoffwechsel__gelbfaerbung',
      'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit', 'blutung__nase_zahnfleisch',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Paracetamolvergiftung', 'Akutes Leberversagen', 'Akutes Nierenversagen'],
    consequences: ['verzögertem Leberversagen, Gerinnungsstörungen, Hirnschwellung, Transplantationspflichtigkeit oder dem Tod'],
  },

  {
    id: 'sedativa-mischintoxikation-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Sedativa-/Mischintoxikation',
    requirements: 'Benzodiazepine, Schlafmittel oder Kombination mit Alkohol/anderen Substanzen; Atemdepression und verzögerte Verschlechterung möglich.',
    majorSignalIds: [
      'neuro__zunehmende_schlaefrigkeit', 'pulmo__langsame_flache_atmung', 'pulmo__atempausen',
      'pulmo__zyanose', 'neuro__neue_bewusstlosigkeit', 'neuro__neue_krampfanfaelle',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Sedativavergiftung', 'Mischintoxikation', 'Aspirationspneumonie'],
    consequences: ['verzögerter Atemlähmung, Erstickung an Erbrochenem, bleibenden Hirnschäden oder dem Tod'],
  },

  {
    id: 'stimulanzienintoxikation-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Stimulanzienintoxikation',
    requirements: 'Stimulanzienkonsum mit Thoraxschmerz, ausgeprägter Tachykardie, Überwärmung, Agitation oder neurologischen Symptomen.',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'kreislauf__anhaltendes_herzrasen', 'umwelt__sehr_heisse_haut',
      'psych__schwere_erregung', 'neuro__neue_verwirrtheit', 'neuro__neue_krampfanfaelle',
      'neuro__blitzartiger_maximalkopfschmerz', 'neuro__neue_einseitige_schwaeche', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Sympathomimetisches Toxidrom', 'Akutes Koronarsyndrom', 'Hirnblutung'],
    consequences: ['Herzinfarkt, Hirnblutung, gefährlicher Überhitzung, Organversagen oder dem Tod'],
  },

  {
    id: 'aetzende-substanz-verschluckt-verweigerung',
    parentId: 'intoxikation-unklar-verweigerung',
    name: 'Verschlucken einer ätzenden Substanz',
    requirements: 'Säure/Lauge oder entsprechend verdächtiges Produkt; fehlende sichtbare Mundverletzung ist keine sichere Entwarnung.',
    majorSignalIds: [
      'hno__speichel_nicht_schluckbar', 'hno__heiserkeit', 'pulmo__stridor', 'pulmo__neue_luftnot',
      'thorax__schmerzen_druck', 'abdomen__zunehmende_schmerzen', 'abdomen__blutiges_erbrechen',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Speiseröhrenverätzung', 'Magenverätzung', 'Ösophagus-/Magenperforation'],
    consequences: ['Atemwegsverlegung, Speiseröhren- oder Magendurchbruch, schweren Infektionen, bleibenden Verengungen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kind mit akuter Belastungsverweigerung eines Beins [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'kind-belastungsverweigerung-bein-verweigerung',
    name: 'Kind mit akuter Belastungsverweigerung eines Beins',
    requirements: 'Plötzliches Nichtauftreten, insbesondere mit Schmerzen, Fieber oder Bewegungseinschränkung; okkulte Verletzung oder Gelenkinfektion abklären.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'extremitaet__belastungsunfaehigkeit', 'gelenk__zunehmende_schmerzen', 'gelenk__zunehmende_schwellung',
      'gelenk__roetung_ueberwaermung', 'infekt__fieber_schuettelfrost', 'extremitaet__sensibilitaetsstoerung',
    ],
    minorSignalIds: [],
    diagnoses: ['Fraktur', 'Septische Arthritis', 'Osteomyelitis'],
    consequences: ['einer übersehenen Fraktur, Knochen-/Gelenkinfektion, bleibenden Gelenkschäden oder einer Blutvergiftung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kleiner oberflächlicher Hautabszess ohne Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'hautabszess-klein-oberflaechlich-bvo',
    name: 'Kleiner oberflächlicher Hautabszess ohne Warnzeichen',
    requirements: 'Klein und lokal begrenzt, kein Fieber/Progress; nicht an Gesicht, Hand oder Genital-/Perianalregion; ärztliche Behandlung am selben Tag organisiert.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'haut__rasch_ausbreitende_roetung', 'haut__starke_schmerzen', 'infekt__fieber_schuettelfrost',
      'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [
      'haut__zunehmende_lokale_roetung', 'haut__zunehmende_lokale_schwellung', 'haut__eitriges_sekret',
    ],
    diagnoses: ['Hautabszess', 'Zellulitis'],
    consequences: ['einer Ausbreitung der Infektion, zunehmender Eiteransammlung, Gewebeschäden oder einer Blutvergiftung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kohlenmonoxidexposition ohne Brandereignis [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'kohlenmonoxidexposition-ohne-brand-verweigerung',
    name: 'Kohlenmonoxidexposition ohne Brandereignis',
    requirements: 'Plausible CO-Exposition ohne ausreichende toxikologische Entwarnung; normale konventionelle Pulsoxymetrie schließt eine Vergiftung nicht aus.',
    application: 'Verweigerung',
    category: 'intox',
    majorSignalIds: [
      'neuro__ploetzliche_starke_kopfschmerzen', 'neuro__neue_verwirrtheit', 'neuro__neue_gangunsicherheit',
      'neuro__erneute_gedaechtnisluecken', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'neuro__neue_bewusstlosigkeit', 'neuro__neue_krampfanfaelle',
    ],
    minorSignalIds: [],
    diagnoses: ['Kohlenmonoxidvergiftung', 'Myokardschädigung', 'Verzögerte toxische Hirnschädigung'],
    consequences: ['Sauerstoffmangel, Herzschäden, verzögerten bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Kontaktdermatitis (lokal begrenzt) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'kontaktdermatitis-lokal-bvo',
    name: 'Kontaktdermatitis (lokal begrenzt)',
    requirements: 'Plausibler Hautkontakt, lokale Rötung/Juckreiz; keine Schleimhautbeteiligung, Blasenablösung oder Allgemeinsymptome.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'hno__zunge_rachenschwellung', 'pulmo__neue_luftnot', 'haut__schleimhautwunden',
      'haut__grossflaechige_blaeschenausbreitung',
    ],
    minorSignalIds: [
      'haut__anhaltender_juckreiz', 'haut__zunehmende_lokale_roetung', 'haut__naessende_offene_stellen',
    ],
    diagnoses: ['Kontaktdermatitis', 'Allergische Reaktion', 'Hautinfektion'],
    consequences: ['einer anhaltenden Hautentzündung, Hautschädigung oder zusätzlichen bakteriellen Infektion'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Krampfanfall (neues Muster/erstmalig) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'krampfanfall-neues-muster-erstmalig-verweigerung',
    name: 'Krampfanfall (neues Muster/erstmalig)',
    requirements: '',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__neue_krampfanfaelle', 'neuro__fehlende_erholung_nach_anfall', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'infekt__fieber_schuettelfrost', 'neuro__neue_nackensteifigkeit',
      'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Epileptischer Anfall', 'Hirnblutung', 'Meningoenzephalitis'],
    consequences: ['erneuten/anhaltenden Krampfanfällen, Verletzungen, Sauerstoffmangel, bleibenden Hirnschäden oder dem Tod'],
  },

  {
    id: 'fieberkrampf-erstmalig-atypisch-verweigerung',
    parentId: 'krampfanfall-neues-muster-erstmalig-verweigerung',
    name: 'Fieberkrampf (erstmalig oder atypisch)',
    requirements: 'Erster Fieberkrampf, fokaler/prolongierter Anfall, Wiederholung oder unvollständige Erholung; kinderärztliche Akutbeurteilung.',
    majorSignalIds: [
      'neuro__neue_krampfanfaelle', 'neuro__fehlende_erholung_nach_anfall', 'pulmo__zyanose',
      'pulmo__neue_luftnot', 'neuro__neue_nackensteifigkeit', 'haut__nicht_wegdrueckbare_flecken',
      'neuro__neue_einseitige_schwaeche', 'paediatrie__trinkschwaeche',
    ],
    minorSignalIds: [],
    diagnoses: ['Fieberkrampf', 'Meningitis', 'Enzephalitis'],
    consequences: ['übersehener Hirnhaut-/Gehirnentzündung, anhaltenden Krampfanfällen, Sauerstoffmangel oder bleibenden Hirnschäden'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Leichter Flüssigkeitsmangel (vollständig ausgeglichen) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'fluessigkeitsmangel-ausgeglichen-bvo',
    name: 'Leichter Flüssigkeitsmangel (vollständig ausgeglichen)',
    requirements: 'Plausibel geringe Trinkmenge, nach oralem Trinken beschwerdefrei; normale Ausscheidung/Vitalwerte, keine fortdauernden Verluste oder besondere Risiken.',
    application: 'BvO',
    category: 'stoffwechsel',
    majorSignalIds: [
      'stoffwechsel__fehlende_trinkfaehigkeit', 'abdomen__anhaltendes_erbrechen', 'kreislauf__neue_probleme',
      'uro__anhaltende_oligurie_anurie', 'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
    ],
    minorSignalIds: [
      'stoffwechsel__durst_mundtrockenheit', 'neuro__leichter_lageschwindel',
      'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Dehydratation', 'Elektrolytstörung'],
    consequences: ['erneutem Flüssigkeitsmangel, Stürzen, Elektrolytstörungen oder einer Nierenschädigung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Liquorshunt-Komplikation (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'liquorshunt-komplikation-verdacht-verweigerung',
    name: 'Liquorshunt-Komplikation (Verdacht)',
    requirements: 'Hydrozephalus-Shunt mit neuen Kopfschmerzen, Erbrechen, Fieber oder Verhaltens-/Vigilanzänderung.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__ploetzliche_starke_kopfschmerzen', 'abdomen__anhaltendes_erbrechen',
      'infekt__fieber_schuettelfrost', 'shunt__roetung_schmerzen_verlauf', 'neuro__neue_nackensteifigkeit',
      'neuro__zunehmende_schlaefrigkeit', 'sehstoerung__neue_doppelbilder', 'neuro__neue_gangunsicherheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Liquorshuntverschluss', 'Shuntinfektion', 'Akuter Hydrozephalus'],
    consequences: ['Hirndrucksteigerung, übersehener Shuntinfektion, bleibenden Hirnschäden, Bewusstlosigkeit oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Lungenembolie (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'lungenembolie-verdacht-verweigerung',
    name: 'Lungenembolie (Verdacht)',
    requirements: 'Neue Dyspnoe, pleuritischer Schmerz, Synkope oder Hämoptyse mit passender Risikokonstellation.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__relevante_haemoptyse',
      'kreislauf__anhaltendes_herzrasen', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
      'extremitaet__einseitige_schwellung_schmerz',
    ],
    minorSignalIds: [],
    diagnoses: ['Lungenembolie', 'Akutes Koronarsyndrom', 'Pneumothorax'],
    consequences: ['zunehmender Lungengefäßverlegung, akutem Rechtsherzversagen, Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Makrohämaturie mit Koageln/Abflussstörung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'makrohaematurie-koagel-abflussstoerung-verweigerung',
    name: 'Makrohämaturie mit Koageln/Abflussstörung',
    requirements: 'Sichtbares Blut mit Gerinnseln, erschwerter Miktion, Retention oder anhaltend erheblicher Blutung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__gerinnsel_im_urin', 'uro__anhaltende_oligurie_anurie', 'abdomen__zunehmende_schmerzen',
      'uro__starke_flankenschmerzen', 'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Blasentamponade', 'Harnabflussstörung', 'Urothelkarzinom'],
    consequences: ['einem Blasenverschluss durch Blutgerinnsel, Blutverlust, Nierenschäden oder lebensbedrohlichem Kreislaufversagen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Manische Episode mit Gefährdung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'manische-episode-mit-gefaehrdung-verweigerung',
    name: 'Manische Episode mit Gefährdung',
    requirements: 'Enthemmung, erheblich vermindertes Schlafbedürfnis, Realitätsverlust oder riskantes Verhalten; dringliche psychiatrische Beurteilung.',
    application: 'Verweigerung',
    category: 'psych',
    majorSignalIds: [
      'psych__schwere_erregung', 'psych__gefaehrliches_enthemmtes_verhalten', 'psych__halluzinationen',
      'psych__fremdgefaehrdungsimpulse', 'psych__suizidgedanken', 'psych__zunehmende_selbstvernachlaessigung',
      'psych__schlaflosigkeit_mit_ueberaktivitaet',
    ],
    minorSignalIds: [],
    diagnoses: ['Manische Episode', 'Psychose', 'Intoxikation'],
    consequences: ['zunehmendem Realitätsverlust, Selbst-/Fremdverletzungen, schwerer Selbstvernachlässigung, finanziellen/sozialen Schäden oder einem Suizid'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Medikamenteneinnahmefehler (toxikologisch niedriges Risiko) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'medikamenteneinnahmefehler-niedrigrisiko-bvo',
    name: 'Medikamenteneinnahmefehler (toxikologisch niedriges Risiko)',
    requirements: 'Wirkstoff, Dosis und Zeitpunkt sicher bekannt; Giftinformationszentrum bestätigt häusliche Beobachtung; keine absichtliche Selbstschädigung.',
    application: 'BvO',
    category: 'intox',
    majorSignalIds: [
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_verwirrtheit', 'pulmo__langsame_flache_atmung',
      'pulmo__neue_luftnot', 'neuro__neue_krampfanfaelle', 'kreislauf__anhaltendes_herzrasen',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Medikamentenüberdosierung', 'Arzneimittelwechselwirkung', 'Unerwünschte Arzneimittelwirkung'],
    consequences: ['einer verzögerten Medikamentenwirkung, Kreislauf- oder Bewusstseinsstörungen sowie einer übersehenen Wechselwirkung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Meningitis-/Enzephalitisverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'meningitis-enzephalitis-verdacht-verweigerung',
    name: 'Meningitis-/Enzephalitisverdacht',
    requirements: 'Kopfschmerz mit Fieber, Meningismus, Bewusstseinsänderung, Krampfanfall oder verdächtigen Hautblutungen.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'infekt__fieber_schuettelfrost', 'neuro__ploetzliche_starke_kopfschmerzen',
      'neuro__neue_nackensteifigkeit', 'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
      'neuro__neue_krampfanfaelle', 'haut__nicht_wegdrueckbare_flecken',
    ],
    minorSignalIds: [],
    diagnoses: ['Bakterielle Meningitis', 'Enzephalitis', 'Meningokokkensepsis'],
    consequences: ['bleibenden Hirn-/Hörschäden, Krampfanfällen, septischem Schock, Organversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Migräne (bekanntes, unverändertes Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'migraene-bekannt-unveraendert-bvo',
    name: 'Migräne (bekanntes, unverändertes Muster)',
    requirements: 'Ärztlich bekannte Migräne, vertrauter Verlauf, deutliche Besserung; keine neue/atypische Aura oder sonstigen Warnzeichen.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [
      'neuro__blitzartiger_maximalkopfschmerz', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'sehstoerung__ploetzlicher_sehverlust', 'neuro__neue_nackensteifigkeit',
      'infekt__fieber_schuettelfrost', 'neuro__neue_verwirrtheit', 'neuro__neue_krampfanfaelle',
      'stoffwechsel__fehlende_trinkfaehigkeit',
    ],
    minorSignalIds: [
      'neuro__wiederkehrende_typische_kopfschmerzen', 'stoffwechsel__wiederkehrende_uebelkeit',
    ],
    diagnoses: ['Migräne', 'Subarachnoidalblutung', 'Meningitis'],
    consequences: ['anhaltenden Schmerzattacken, Austrocknung oder verzögerter Erkennung einer anderen Kopfschmerzursache'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nabelschnurvorfall (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'nabelschnurvorfall-verdacht-verweigerung',
    name: 'Nabelschnurvorfall (Verdacht)',
    requirements: 'Nach Blasensprung sicht-/tastbare Nabelschnur oder entsprechender begründeter Verdacht; unmittelbarer geburtshilflicher Notfall.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__sichtbare_nabelschnur', 'gyn__verminderte_kindsbewegungen', 'gyn__pressdrang',
      'gyn__starke_vaginale_blutung',
    ],
    minorSignalIds: [],
    diagnoses: ['Nabelschnurvorfall', 'Nabelschnurkompression', 'Fetale Hypoxie'],
    consequences: ['anhaltender Unterbrechung der kindlichen Sauerstoffversorgung, bleibenden Hirnschäden oder dem Tod des Kindes'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nachblutung nach Tonsillenoperation [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'nachblutung-tonsillenoperation-verweigerung',
    name: 'Nachblutung nach Tonsillenoperation',
    requirements: 'Frisches Blut aus Mund/Rachen nach Tonsillenoperation; auch eine aktuell sistierte Blutung ist abklärungsbedürftig.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'hno__blut_mund_rachen', 'hno__auffaellig_haeufiges_schlucken', 'abdomen__blutiges_erbrechen',
      'pulmo__neue_luftnot', 'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Posttonsillektomieblutung', 'Blutaspiration', 'Hämorrhagischer Schock'],
    consequences: ['erneuten massiven Blutungen, Ersticken an Blut, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nachblutung nach Zahnextraktion (vollständig gestillt) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'nachblutung-zahnextraktion-gestillt-bvo',
    name: 'Nachblutung nach Zahnextraktion (vollständig gestillt)',
    requirements: 'Anhaltende Blutstillung nach lokaler Maßnahme; keine relevante Blutmenge, Kreislaufstörung oder besondere Gerinnungsrisiken; Kontrollplan vorhanden.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'kreislauf__neue_probleme', 'hno__zunehmende_gesichtsschwellung',
      'hno__speichel_nicht_schluckbar', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [
      'hno__geringe_blutspuren_speichel', 'hno__anhaltende_mundschmerzen',
    ],
    diagnoses: ['Nachblutung', 'Wundheilungsstörung', 'Alveolitis'],
    consequences: ['erneuter stärkerer Blutung, Kreislaufproblemen, Wundinfektion oder verzögerter Wundheilung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nebennierenkrise (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'nebennierenkrise-verdacht-verweigerung',
    name: 'Nebennierenkrise (Verdacht)',
    requirements: 'Nebenniereninsuffizienz oder relevante Steroidvorgeschichte mit Hypotonie, Erbrechen, schwerer Schwäche oder Bewusstseinsänderung.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [
      'kreislauf__neue_probleme', 'neuro__zunehmende_muskelschwaeche', 'abdomen__anhaltendes_erbrechen',
      'abdomen__zunehmende_schmerzen', 'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit',
      'neuro__neue_krampfanfaelle',
    ],
    minorSignalIds: [],
    diagnoses: ['Nebennierenkrise', 'Hypoglykämie', 'Schwere Elektrolytstörung'],
    consequences: ['Kreislaufschock, schwerer Unterzuckerung, lebensbedrohlichen Elektrolytstörungen, Bewusstlosigkeit oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Nekrotisierende Weichteilinfektion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'nekrotisierende-weichteilinfektion-verdacht-verweigerung',
    name: 'Nekrotisierende Weichteilinfektion (Verdacht)',
    requirements: 'Unverhältnismäßiger Schmerz, rasche Progression, livide Haut/Blasen oder schweres Krankheitsgefühl.',
    application: 'Verweigerung',
    category: 'haut',
    majorSignalIds: [
      'haut__starke_schmerzen', 'haut__anhaltende_taubheit', 'haut__rasch_ausbreitende_roetung',
      'haut__blasenbildung', 'haut__dunkle_verfaerbung', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Nekrotisierende Fasziitis', 'Sepsis', 'Gewebsnekrose'],
    consequences: ['rascher Gewebezerstörung, einer Amputation, Blutvergiftung, Multiorganversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Neuer Kopfschmerz mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'kopfschmerz-neu-risikomerkmale-verweigerung',
    name: 'Neuer Kopfschmerz mit Risikomerkmalen',
    requirements: 'Neuer oder deutlich veränderter Kopfschmerz mit neurologischen Zeichen, Fieber, Immunsuppression, Tumoranamnese oder anderen Warnzeichen.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__ploetzliche_starke_kopfschmerzen', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'sehstoerung__ploetzlicher_sehverlust', 'neuro__neue_nackensteifigkeit',
      'infekt__fieber_schuettelfrost', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_krampfanfaelle',
      'abdomen__anhaltendes_erbrechen',
    ],
    minorSignalIds: [],
    diagnoses: ['Hirnblutung', 'Meningoenzephalitis', 'Intrakranielle Raumforderung'],
    consequences: ['übersehener Hirnblutung/-entzündung, Hirndrucksteigerung, bleibenden neurologischen Schäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Neurodermitisschub (bekannt und leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'neurodermitisschub-leicht-bvo',
    name: 'Neurodermitisschub (bekannt und leicht)',
    requirements: 'Vertrautes Hautbild, beherrschbarer Juckreiz; kein Fieber, schmerzhafte Bläschen, großflächige Verschlechterung oder Superinfektionsverdacht.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'haut__schmerzhafte_blaeschen', 'haut__grossflaechige_blaeschenausbreitung',
      'haut__rasch_ausbreitende_roetung', 'infekt__fieber_schuettelfrost', 'augen__starke_augenschmerzen',
    ],
    minorSignalIds: [
      'haut__anhaltender_juckreiz', 'haut__naessende_offene_stellen', 'haut__eitriges_sekret',
    ],
    diagnoses: ['Atopische Dermatitis', 'Bakterielle Hautinfektion', 'Eczema herpeticatum'],
    consequences: ['einer ausgedehnten Hautentzündung, Wundinfektionen oder einer schweren Herpesinfektion der Haut'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Oberflächliche Augenreizung (vollständig abgeklungen) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'augenreizung-vollstaendig-abgeklungen-bvo',
    name: 'Oberflächliche Augenreizung (vollständig abgeklungen)',
    requirements: 'Nach Spülung beschwerdefrei und Visus normal; kein Chemikalienkontakt, Hochgeschwindigkeitsfremdkörper, Trauma oder Kontaktlinsenproblem.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [
      'augen__starke_augenschmerzen', 'sehstoerung__rasche_sehverschlechterung', 'augen__lichtscheu',
    ],
    minorSignalIds: [
      'augen__fremdkoerpergefuehl', 'augen__anhaltende_roetung', 'augen__eitriges_sekret',
    ],
    diagnoses: ['Hornhauterosion', 'Verbliebener Fremdkörper', 'Keratitis'],
    consequences: ['einem übersehenen Fremdkörper, Hornhautschäden, Infektionen oder bleibender Sehverschlechterung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Odontogene Mundboden-/Gesichtsschwellung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'odontogene-mundboden-gesichtsschwellung-verweigerung',
    name: 'Odontogene Mundboden-/Gesichtsschwellung',
    requirements: 'Zahnbezogene zunehmende Schwellung, besonders mit Schluckstörung, Kieferklemme, Fieber oder Atemwegsbeteiligung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'hno__zunehmende_gesichtsschwellung', 'hno__eingeschraenkte_mundoeffnung',
      'hno__speichel_nicht_schluckbar', 'hno__kloessige_stimme', 'pulmo__neue_luftnot',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Odontogener Abszess', 'Mundbodenphlegmone', 'Sepsis'],
    consequences: ['einem Atemwegsverschluss, Ausbreitung der Infektion in Hals/Brustkorb, Blutvergiftung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Offene Wunde (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'offene-wunde-schwer-verweigerung',
    name: 'Offene Wunde (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'extremitaet__sensibilitaetsstoerung',
      'extremitaet__bewegungsstoerung', 'extremitaet__blaesse_blaufarbung', 'kreislauf__neue_probleme',
      'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'haut__zunehmende_lokale_roetung', 'haut__eitriges_sekret',
    ],
    diagnoses: ['Gefäßverletzung', 'Sehnen-/Nervenverletzung', 'Wundinfektion'],
    consequences: ['starkem Blutverlust, bleibenden Sehnen-/Nervenschäden, Funktionsverlust oder einer schweren Wundinfektion'],
  },

  {
    id: 'bissverletzung-tief-verweigerung',
    parentId: 'offene-wunde-schwer-verweigerung',
    name: 'Bissverletzung mit tiefer Gewebebeteiligung',
    requirements: 'Tiefe Verletzung, insbesondere an Hand oder Gelenk; mögliche Sehnen-, Nerven-, Gefäß- oder Gelenkbeteiligung.',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'extremitaet__sensibilitaetsstoerung',
      'extremitaet__bewegungsstoerung', 'gelenk__zunehmende_schmerzen', 'haut__rasch_ausbreitende_roetung',
      'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'haut__zunehmende_lokale_roetung', 'haut__eitriges_sekret',
    ],
    diagnoses: ['Tiefe Wundinfektion', 'Sehnen-/Gelenkverletzung', 'Nerven-/Gefäßverletzung'],
    consequences: ['tiefer Wundinfektion, Sehnen-/Gelenkschäden, bleibendem Funktionsverlust oder einer Blutvergiftung'],
  },

  {
    id: 'hochdruckinjektionsverletzung-verweigerung',
    parentId: 'offene-wunde-schwer-verweigerung',
    name: 'Hochdruckinjektionsverletzung',
    requirements: 'Farbe, Fett oder andere Stoffe unter Druck ins Gewebe eingebracht; auch bei kleiner Eintrittswunde dringlicher chirurgischer Verdacht.',
    majorSignalIds: [
      'extremitaet__zunehmende_schmerzen', 'extremitaet__gespannte_schwellung',
      'extremitaet__sensibilitaetsstoerung', 'extremitaet__bewegungsstoerung',
      'extremitaet__blaesse_blaufarbung', 'extremitaet__kalte_extremitaet',
    ],
    minorSignalIds: [],
    diagnoses: ['Hochdruckinjektionsverletzung', 'Kompartmentsyndrom', 'Gewebsnekrose'],
    consequences: ['fortschreitender Gewebezerstörung, Durchblutungsstörungen, bleibendem Funktionsverlust oder einer Amputation'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ohrenschmerzen ohne Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'ohrenschmerzen-ohne-warnzeichen-bvo',
    name: 'Ohrenschmerzen ohne Warnzeichen',
    requirements: 'Leichte Schmerzen; keine Mastoidrötung/-schwellung, Fazialisparese, plötzliche Hörminderung, starke Schwindelsymptomatik oder schwere Allgemeinsymptome.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [
      'hno__schwellung_hinter_ohr', 'hno__ploetzliche_hoerminderung', 'neuro__gesichtslaehmung',
      'neuro__neue_gangunsicherheit', 'neuro__neue_nackensteifigkeit',
    ],
    minorSignalIds: [
      'hno__anhaltende_leichte_ohrenschmerzen', 'hno__ohrsekret',
    ],
    diagnoses: ['Otitis externa/media', 'Mastoiditis', 'Innenohrbeteiligung'],
    consequences: ['einer fortschreitenden Ohrenentzündung, Trommelfellschäden, bleibender Hörminderung oder einer Ausbreitung auf den Knochen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ovarialtorsion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'ovarialtorsion-verdacht-verweigerung',
    name: 'Ovarialtorsion (Verdacht)',
    requirements: 'Akuter einseitiger Unterbauchschmerz, häufig mit Übelkeit/Erbrechen; zeitkritische gynäkologische Abklärung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__starke_einseitige_unterbauchschmerzen', 'abdomen__anhaltendes_erbrechen',
      'infekt__fieber_schuettelfrost', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Ovarialtorsion', 'Rupturierte Ovarialzyste', 'Extrauteringravidität'],
    consequences: ['einem Absterben des Eierstocks, bleibenden Organschäden oder eingeschränkter Fruchtbarkeit'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Palpitationen/Herzrasen (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'palpitationen-herzrasen-schwer-verweigerung',
    name: 'Palpitationen/Herzrasen (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'kreislauf__anhaltendes_herzrasen', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Tachykarde Herzrhythmusstörung', 'Akutes Koronarsyndrom', 'Elektrolytstörung'],
    consequences: ['anhaltenden Herzrhythmusstörungen, Herzversagen, Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  {
    id: 'vorhofflimmern-neu-mit-beschwerden-verweigerung',
    parentId: 'palpitationen-herzrasen-schwer-verweigerung',
    name: 'Neu aufgetretenes Vorhofflimmern mit Beschwerden',
    requirements: 'Neu dokumentierte absolute Arrhythmie mit anhaltenden Beschwerden; Frequenz, Beginn und Begleiterkrankungen müssen beurteilt werden.',
    majorSignalIds: [
      'kreislauf__anhaltendes_herzrasen', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'sehstoerung__ploetzlicher_sehverlust',
    ],
    minorSignalIds: [],
    diagnoses: ['Vorhofflimmern', 'Akute Herzinsuffizienz', 'Schlaganfall'],
    consequences: ['Blutgerinnseln mit Schlaganfall/Organinfarkten, zunehmender Herzschwäche, bleibenden Schäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Paraphimose [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'paraphimose-verweigerung',
    name: 'Paraphimose',
    requirements: 'Zurückgezogene Vorhaut lässt sich nicht zurückführen, Eichel/Vorhaut schwillt an; Ischämierisiko.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__eingeklemmte_vorhaut', 'uro__starke_penisschmerzen', 'uro__rasche_penisschwellung',
      'uro__eichelverfaerbung', 'uro__eicheltaubheit', 'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Paraphimose', 'Eichelischämie'],
    consequences: ['einer Durchblutungsstörung mit Absterben von Eichelgewebe, Harnverhalt oder bleibenden Funktionsschäden'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Penetrierende Augenverletzung (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'penetrierende-augenverletzung-verdacht-verweigerung',
    name: 'Penetrierende Augenverletzung (Verdacht)',
    requirements: 'Spitzer Gegenstand oder Hochgeschwindigkeitsfremdkörper; auch bei unscheinbarer äußerer Verletzung.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [
      'sehstoerung__rasche_sehverschlechterung', 'sehstoerung__ploetzlicher_sehverlust',
      'augen__starke_augenschmerzen', 'augen__neue_pupillendifferenz', 'augen__lichtscheu',
    ],
    minorSignalIds: [],
    diagnoses: ['Offene Bulbusverletzung', 'Intraokularer Fremdkörper', 'Endophthalmitis'],
    consequences: ['einer unentdeckten Augeneröffnung, schweren Augeninfektion, Erblindung oder dem Verlust des Auges'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Penetrierende Rumpfverletzung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'penetrierende-rumpfverletzung-verweigerung',
    name: 'Penetrierende Rumpfverletzung',
    requirements: 'Stich-, Schuss- oder Pfählungsverletzung; äußere Wundgröße erlaubt keine verlässliche Beurteilung innerer Schäden.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Innere Organ-/Gefäßverletzung', 'Pneumothorax/Hämatothorax', 'Darmperforation'],
    consequences: ['unerkannten Organ-/Gefäßverletzungen, inneren Blutungen, Atem-/Kreislaufversagen, Bauchfellentzündung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Peritonealdialyse-assoziierte Peritonitis (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'peritonealdialyse-peritonitis-verdacht-verweigerung',
    name: 'Peritonealdialyse-assoziierte Peritonitis (Verdacht)',
    requirements: 'Trübes Dialysat und/oder neuer Bauchschmerz, gegebenenfalls Fieber; sofortiger Kontakt zum Dialysezentrum und Akutabklärung.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__truebes_dialysat', 'abdomen__zunehmende_schmerzen', 'abdomen__hart_geblaeht',
      'infekt__fieber_schuettelfrost', 'abdomen__anhaltendes_erbrechen', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Dialyseassoziierte Peritonitis', 'Katheterinfektion', 'Sepsis'],
    consequences: ['einer fortschreitenden Bauchfellentzündung, Blutvergiftung, dem Verlust der Peritonealdialysefähigkeit oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Peritonsillar-/tiefer Halsabszess (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'peritonsillar-tiefer-halsabszess-verdacht-verweigerung',
    name: 'Peritonsillar-/tiefer Halsabszess (Verdacht)',
    requirements: 'Einseitige starke Schmerzen, Kieferklemme, kloßige Stimme oder Schluckbehinderung; mögliche Atemwegsgefährdung.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'hno__speichel_nicht_schluckbar', 'hno__kieferklemme', 'hno__kloessige_stimme',
      'hno__zunehmende_gesichtsschwellung', 'pulmo__stridor', 'pulmo__neue_luftnot',
      'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Peritonsillarabszess', 'Tiefer Halsabszess', 'Sepsis'],
    consequences: ['einem Atemwegsverschluss, Ausbreitung der Infektion in den Brustkorb, Blutvergiftung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Plötzliche Hörminderung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'ploetzliche-hoerminderung-verweigerung',
    name: 'Plötzliche Hörminderung',
    requirements: 'Akuter ungeklärter Hörverlust ohne offensichtliche äußere Ursache; dringliche HNO-Beurteilung, bei neurologischen Zeichen Schlaganfallpfad.',
    application: 'Verweigerung',
    category: 'hno',
    majorSignalIds: [
      'hno__ploetzliche_hoerminderung', 'neuro__gesichtslaehmung', 'neuro__neue_gangunsicherheit',
      'neuro__neue_sprachstoerung', 'neuro__neue_einseitige_schwaeche', 'sehstoerung__neue_doppelbilder',
    ],
    minorSignalIds: [],
    diagnoses: ['Hörsturz', 'Innenohrerkrankung', 'Schlaganfall'],
    consequences: ['bleibendem Hörverlust, anhaltenden Ohrgeräuschen oder neurologischen Schäden bei übersehenem Schlaganfall'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Postoperative Nachblutung (anhaltend/relevant) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'postoperative-nachblutung-verweigerung',
    name: 'Postoperative Nachblutung (anhaltend/relevant)',
    requirements: 'Frische Operation mit wiederkehrender oder anhaltender Blutung, zunehmendem Hämatom oder Kreislaufbeschwerden.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'wunde__starke_anhaltende_blutung', 'wunde__rasch_zunehmender_bluterguss', 'wunde__zunehmende_schmerzen',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Postoperative Blutung', 'Hämatom', 'Hämorrhagischer Schock'],
    consequences: ['fortschreitendem Blutverlust, Druckschäden durch Blutergüsse, erneuter Operationspflichtigkeit, Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Priapismus (Ischämieverdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'priapismus-ischaemieverdacht-verweigerung',
    name: 'Priapismus (Ischämieverdacht)',
    requirements: 'Schmerzhafte anhaltende Erektion, insbesondere seit etwa vier Stunden; bei Risikokonstellation bereits früher dringlich.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__anhaltende_schmerzhafte_erektion', 'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [],
    diagnoses: ['Ischämischer Priapismus'],
    consequences: ['bleibenden Schwellkörperschäden, dauerhafter Erektionsstörung oder Gewebeverlust'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pseudokrupp (leicht, ohne Ruhestridor) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'pseudokrupp-leicht-ohne-ruhestridor-bvo',
    name: 'Pseudokrupp (leicht, ohne Ruhestridor)',
    requirements: 'Typischer bellender Husten; keine Einziehungen, Hypoxie oder Trinkstörung, kein Adrenalinbedarf; zuverlässige Beobachtung und ärztlicher Behandlungsplan.',
    application: 'BvO',
    category: 'paediatrie',
    majorSignalIds: [
      'pulmo__stridor_in_ruhe', 'paediatrie__angestrengte_atmung', 'pulmo__zyanose',
      'paediatrie__schlaff_teilnahmslos', 'hno__speichel_nicht_schluckbar', 'paediatrie__trinkschwaeche',
    ],
    minorSignalIds: [
      'paediatrie__wiederkehrender_bellender_husten',
    ],
    diagnoses: ['Pseudokrupp', 'Epiglottitis', 'Fremdkörperaspiration'],
    consequences: ['einer zunehmenden Atemwegsverengung, Sauerstoffmangel oder einer übersehenen schweren Atemwegserkrankung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pseudokrupp mit Ruhestridor [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'pseudokrupp-mit-ruhestridor-verweigerung',
    name: 'Pseudokrupp mit Ruhestridor',
    requirements: 'Stridor in Ruhe, relevante Einziehungen, Erschöpfung oder notwendige Adrenalininhalation mit anschließendem Überwachungsbedarf.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'pulmo__stridor_in_ruhe', 'paediatrie__angestrengte_atmung', 'pulmo__zyanose',
      'paediatrie__schlaff_teilnahmslos', 'pulmo__atempausen', 'hno__speichel_nicht_schluckbar',
    ],
    minorSignalIds: [],
    diagnoses: ['Schwerer Pseudokrupp', 'Epiglottitis', 'Bakterielle Tracheitis'],
    consequences: ['zunehmendem Atemwegsverschluss, Sauerstoffmangel, Atemstillstand, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Pyelonephritis mit kompliziertem Verlauf (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'pyelonephritis-kompliziert-verdacht-verweigerung',
    name: 'Pyelonephritis mit kompliziertem Verlauf (Verdacht)',
    requirements: 'Flankenschmerz und Fieber mit Erbrechen, fehlender Trinkfähigkeit, Obstruktionsverdacht oder deutlichen Allgemeinsymptomen.',
    application: 'Verweigerung',
    category: 'uro',
    majorSignalIds: [
      'uro__starke_flankenschmerzen', 'infekt__fieber_schuettelfrost', 'abdomen__anhaltendes_erbrechen',
      'stoffwechsel__fehlende_trinkfaehigkeit', 'uro__anhaltende_oligurie_anurie', 'kreislauf__neue_probleme',
      'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Pyelonephritis', 'Infizierte Harnabflussstörung', 'Urosepsis'],
    consequences: ['einer Blutvergiftung, Nierenabszessen, bleibenden Nierenschäden, Organversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Quetschtrauma mit Crush-Risiko [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'quetschtrauma-crush-risiko-verweigerung',
    name: 'Quetschtrauma mit Crush-Risiko',
    requirements: 'Längere Einklemmung oder erhebliche Muskelquetschung; Gefahr von Rhabdomyolyse, Elektrolytstörung und Nierenschädigung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'muskeln__starke_schmerzen_schwellung', 'extremitaet__gespannte_schwellung',
      'extremitaet__sensibilitaetsstoerung', 'extremitaet__bewegungsstoerung', 'uro__dunkelbrauner_urin',
      'uro__anhaltende_oligurie_anurie', 'kreislauf__anhaltendes_herzrasen', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Crush-Syndrom/Rhabdomyolyse', 'Kompartmentsyndrom', 'Akutes Nierenversagen'],
    consequences: ['Muskelzerfall, lebensbedrohlichen Kaliumstörungen, Nierenversagen, einer Amputation oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Rasch progrediente Muskelschwäche [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'muskelschwaeche-rasch-progredient-verweigerung',
    name: 'Rasch progrediente Muskelschwäche',
    requirements: 'Zunehmende, insbesondere symmetrische Schwäche, gegebenenfalls Schluck- oder Atemstörung; neuromuskuläre Krise möglich.',
    application: 'Verweigerung',
    category: 'neuro',
    majorSignalIds: [
      'neuro__zunehmende_muskelschwaeche', 'pulmo__neue_luftnot', 'pulmo__langsame_flache_atmung',
      'hno__wiederholtes_verschlucken', 'neuro__neue_sprachstoerung', 'sehstoerung__neue_doppelbilder',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Guillain-Barré-Syndrom', 'Myasthene Krise', 'Elektrolytstörung'],
    consequences: ['fortschreitenden Lähmungen, Verschlucken mit Lungenschädigung, Atemstillstand, bleibenden Nervenschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Reisekrankheit (vollständig abgeklungen) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'reisekrankheit-abgeklungen-bvo',
    name: 'Reisekrankheit (vollständig abgeklungen)',
    requirements: 'Klarer Bewegungsreiz, nach dessen Ende beschwerdefrei; keine neurologischen Auffälligkeiten, Bauchschmerzen oder Dehydratation.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [
      'neuro__neue_gangunsicherheit', 'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung',
      'sehstoerung__neue_doppelbilder', 'neuro__ploetzliche_starke_kopfschmerzen',
      'abdomen__anhaltendes_erbrechen', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'stoffwechsel__wiederkehrende_uebelkeit',
    ],
    diagnoses: ['Kinetose', 'Vestibuläre Störung', 'Schlaganfall im hinteren Stromgebiet'],
    consequences: ['einem übersehenen Schlaganfall, Flüssigkeitsmangel oder bleibenden Gleichgewichtsstörungen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schlaflosigkeit ohne akute psychiatrische Warnzeichen [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'schlaflosigkeit-ohne-akute-warnzeichen-bvo',
    name: 'Schlaflosigkeit ohne akute psychiatrische Warnzeichen',
    requirements: 'Keine Manie, Psychose, Suizidalität, Intoxikation oder Entzug; Versorgung und zeitnaher Arztkontakt gesichert.',
    application: 'BvO',
    category: 'psych',
    majorSignalIds: [
      'psych__schlaflosigkeit_mit_ueberaktivitaet', 'psych__halluzinationen', 'psych__suizidgedanken',
      'psych__schwere_erregung', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [
      'psych__anhaltende_schlafstoerungen', 'stoffwechsel__anhaltende_muedigkeit',
      'neuro__leichte_konzentrationsprobleme',
    ],
    diagnoses: ['Insomnie', 'Depressive Episode', 'Manische Episode'],
    consequences: ['anhaltender Erschöpfung, Konzentrationsstörungen, Unfallgefahr oder verzögerter Erkennung einer psychischen Erkrankung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schmerzhaft gerötetes Auge [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'schmerzhaft-geroetetes-auge-verweigerung',
    name: 'Schmerzhaft gerötetes Auge',
    requirements: 'Augenschmerz mit Rötung, Lichtscheu oder Visusminderung; Glaukom, Keratitis oder Uveitis möglich.',
    application: 'Verweigerung',
    category: 'augen',
    majorSignalIds: [
      'augen__starke_augenschmerzen', 'sehstoerung__rasche_sehverschlechterung',
      'sehstoerung__ploetzlicher_sehverlust', 'augen__lichtscheu', 'neuro__ploetzliche_starke_kopfschmerzen',
      'abdomen__anhaltendes_erbrechen',
    ],
    minorSignalIds: [],
    diagnoses: ['Glaukomanfall', 'Keratitis', 'Uveitis'],
    consequences: ['einem übersehenen Glaukomanfall, Hornhaut- oder Sehnervschäden, bleibendem Sehverlust oder Erblindung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schrittmacherstörung mit Beschwerden [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'schrittmacherstoerung-mit-beschwerden-verweigerung',
    name: 'Schrittmacherstörung mit Beschwerden',
    requirements: 'Präsynkope, Synkope oder Bradykardie bei möglicher Gerätefehlfunktion; keine bloße unbestätigte Gerätewarnung.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'kreislauf__langsamer_herzschlag_mit_beschwerden', 'neuro__neue_bewusstlosigkeit',
      'kreislauf__neue_probleme', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot', 'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Schrittmacherfehlfunktion', 'Hochgradiger AV-Block'],
    consequences: ['erneuten Ohnmachten, Sturzverletzungen, unzureichender Organversorgung, Herzstillstand oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schwangerschaftsübelkeit ohne Dehydratation [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'schwangerschaftsuebelkeit-ohne-dehydratation-bvo',
    name: 'Schwangerschaftsübelkeit ohne Dehydratation',
    requirements: 'Leichte Beschwerden, ausreichendes Trinken/Essen; kein Gewichtsverlust, Bauchschmerz, Blutung oder anhaltendes Erbrechen.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [
      'abdomen__anhaltendes_erbrechen', 'stoffwechsel__fehlende_trinkfaehigkeit',
      'uro__anhaltende_oligurie_anurie', 'gyn__starke_einseitige_unterbauchschmerzen', 'gyn__vaginale_blutung',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'stoffwechsel__wiederkehrende_uebelkeit', 'stoffwechsel__durst_mundtrockenheit',
      'stoffwechsel__ungewollter_gewichtsverlust',
    ],
    diagnoses: ['Hyperemesis gravidarum', 'Extrauteringravidität', 'Gastroenteritis'],
    consequences: ['zunehmendem Flüssigkeitsmangel, Elektrolytstörungen oder einer übersehenen Schwangerschaftskomplikation'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Schwere Exsikkose/fehlende Trinkfähigkeit [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'schwere-exsikkose-fehlende-trinkfaehigkeit-verweigerung',
    name: 'Schwere Exsikkose/fehlende Trinkfähigkeit',
    requirements: 'Ausgeprägte Austrocknung, Kreislaufauffälligkeit, Oligurie oder Unfähigkeit zur ausreichenden Flüssigkeitsaufnahme.',
    application: 'Verweigerung',
    category: 'stoffwechsel',
    majorSignalIds: [
      'stoffwechsel__fehlende_trinkfaehigkeit', 'abdomen__anhaltendes_erbrechen',
      'uro__anhaltende_oligurie_anurie', 'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
      'neuro__zunehmende_schlaefrigkeit', 'kreislauf__anhaltendes_herzrasen',
    ],
    minorSignalIds: [],
    diagnoses: ['Exsikkose', 'Akutes Nierenversagen', 'Elektrolytstörung'],
    consequences: ['Kreislaufversagen, akutem Nierenversagen, lebensbedrohlichen Elektrolytstörungen, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Spannungskopfschmerz (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'spannungskopfschmerz-bekannt-bvo',
    name: 'Spannungskopfschmerz (bekanntes Muster)',
    requirements: 'Üblicher leichter bis mäßiger Kopfschmerz; keine neue Qualität, neurologischen Symptome, Infektzeichen oder Risikokonstellation.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [
      'neuro__blitzartiger_maximalkopfschmerz', 'neuro__neue_einseitige_schwaeche',
      'neuro__neue_sprachstoerung', 'neuro__neue_nackensteifigkeit', 'infekt__fieber_schuettelfrost',
      'neuro__neue_verwirrtheit', 'sehstoerung__ploetzlicher_sehverlust',
    ],
    minorSignalIds: [
      'neuro__anhaltende_leichte_kopfschmerzen', 'neuro__wiederkehrende_typische_kopfschmerzen',
    ],
    diagnoses: ['Spannungskopfschmerz', 'Subarachnoidalblutung', 'Meningitis'],
    consequences: ['anhaltenden Schmerzen, Alltagsbeeinträchtigung oder verzögerter Erkennung einer anderen Kopfschmerzursache'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Spontanpneumothorax (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'spontanpneumothorax-verdacht-verweigerung',
    name: 'Spontanpneumothorax (Verdacht)',
    requirements: 'Plötzlicher einseitiger Thoraxschmerz und/oder Atemnot ohne Trauma; klinisch nicht sicher auszuschließen.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__zyanose', 'kreislauf__neue_probleme',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Pneumothorax', 'Spannungspneumothorax', 'Lungenembolie'],
    consequences: ['zunehmendem Lungenkollaps, Spannungspneumothorax, Atem-/Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stillassoziierte Brustbeschwerden/Mastitis (lokal leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'stillassoziierte-brustbeschwerden-mastitis-leicht-bvo',
    name: 'Stillassoziierte Brustbeschwerden/Mastitis (lokal leicht)',
    requirements: 'Begrenzte Beschwerden bei gutem Allgemeinzustand; kein Fieber, Abszessverdacht oder rasche Progression; zeitnahe fachliche Kontrolle.',
    application: 'BvO',
    category: 'gyn',
    majorSignalIds: [
      'gyn__starke_brustdruesenschmerzen', 'haut__rasch_ausbreitende_roetung', 'infekt__fieber_schuettelfrost',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'gyn__anhaltende_stillbeschwerden', 'gyn__anhaltende_brustverhaertung',
    ],
    diagnoses: ['Milchstau', 'Mastitis', 'Mammaabszess'],
    consequences: ['einer fortschreitenden Brustentzündung, Abszessbildung oder Ausbreitung der Infektion'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stomaversorgungsproblem ohne Funktionsstörung [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'stomaversorgungsproblem-ohne-funktionsstoerung-bvo',
    name: 'Stomaversorgungsproblem ohne Funktionsstörung',
    requirements: 'Undichte/gelöste Versorgung behoben; Stoma vital, gewohnte Förderung, kein Bauchschmerz oder relevantes Flüssigkeitsdefizit.',
    application: 'BvO',
    category: 'gastro',
    majorSignalIds: [
      'stoma__dunkle_blasse_verfaerbung', 'stoma__foerderstopp', 'stoma__starke_blutung',
      'abdomen__zunehmende_schmerzen', 'abdomen__anhaltendes_erbrechen', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'stoma__hautreizung', 'stoma__verminderte_ausscheidung', 'stoma__vermehrte_duennfluessige_ausscheidung',
    ],
    diagnoses: ['Peristomale Dermatitis', 'Stomastenose', 'Darmverschluss'],
    consequences: ['Hautschäden, Flüssigkeitsmangel oder einem übersehenen Darmverschluss'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Stromunfall mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'stromunfall-risikomerkmale-verweigerung',
    name: 'Stromunfall mit Risikomerkmalen',
    requirements: 'Hochspannung, Bewusstseinsverlust, Rhythmusstörung, Thoraxbeschwerden, relevante Verbrennung oder Schwangerschaft.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'kreislauf__anhaltendes_herzrasen', 'neuro__neue_bewusstlosigkeit',
      'pulmo__neue_luftnot', 'muskeln__starke_schmerzen_schwellung', 'extremitaet__sensibilitaetsstoerung',
      'uro__dunkelbrauner_urin',
    ],
    minorSignalIds: [],
    diagnoses: ['Herzrhythmusstörung', 'Tiefe elektrische Gewebeschädigung', 'Rhabdomyolyse'],
    consequences: ['lebensbedrohlichen Herzrhythmusstörungen, verborgenen Gewebeschäden, Nierenversagen, bleibenden Nervenschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Sturz ohne erkennbare Verletzung [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'sturz-ohne-verletzung-bvo',
    name: 'Sturz ohne erkennbare Verletzung',
    requirements: 'Eindeutig mechanisches Stolpern, kein Kopfaufprall, keine Synkope, keine Schmerzen; Mobilität wieder auf Ausgangsniveau.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [
      'extremitaet__belastungsunfaehigkeit', 'extremitaet__zunehmende_schmerzen',
      'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit', 'extremitaet__sensibilitaetsstoerung',
    ],
    minorSignalIds: [
      'trauma__anhaltende_leichte_schmerzen',
    ],
    diagnoses: ['Verdeckte Fraktur', 'Weichteilverletzung'],
    consequences: ['einer übersehenen Verletzung, zunehmenden Schmerzen, Folgestürzen oder bleibender Bewegungseinschränkung'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Subkonjunktivale Blutung (atraumatisch) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'subkonjunktivale-blutung-atraumatisch-bvo',
    name: 'Subkonjunktivale Blutung (atraumatisch)',
    requirements: 'Scharf begrenzte schmerzlose Einblutung; normales Sehen, kein Trauma, keine weiteren Blutungszeichen oder hypertensiven Notfallzeichen.',
    application: 'BvO',
    category: 'augen',
    majorSignalIds: [
      'augen__starke_augenschmerzen', 'sehstoerung__rasche_sehverschlechterung', 'augen__lichtscheu',
    ],
    minorSignalIds: [
      'augen__wiederkehrende_einblutung', 'blutung__wiederkehrende_haut_schleimhautblutungen',
    ],
    diagnoses: ['Hyposphagma', 'Gerinnungsstörung', 'Arterielle Hypertonie'],
    consequences: ['einer übersehenen Gerinnungsstörung oder Blutdruckerkrankung mit wiederkehrenden Blutungen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Symptomatische Bradykardie [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'symptomatische-bradykardie-verweigerung',
    name: 'Symptomatische Bradykardie',
    requirements: 'Langsamer Puls mit Schwäche, Präsynkope, Synkope, Thoraxschmerz oder Hypotonie.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'kreislauf__langsamer_herzschlag_mit_beschwerden', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'neuro__neue_verwirrtheit',
    ],
    minorSignalIds: [],
    diagnoses: ['Bradykarde Herzrhythmusstörung', 'Akutes Koronarsyndrom', 'Elektrolytstörung'],
    consequences: ['erneuten Ohnmachten, Sturzverletzungen, unzureichender Hirn-/Herzdurchblutung, Herzstillstand oder dem Tod'],
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
      'neuro__neue_bewusstlosigkeit', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__anhaltendes_herzrasen', 'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung',
      'neuro__neue_krampfanfaelle', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [],
    diagnoses: ['Herzrhythmusstörung', 'Strukturelle Herzerkrankung', 'Lungenembolie'],
    consequences: ['erneuten Ohnmachten mit Sturzverletzungen, übersehener Herzerkrankung, Kreislaufstillstand, bleibenden Schäden oder dem Tod'],
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
      'neuro__neue_bewusstlosigkeit', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__anhaltendes_herzrasen', 'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung',
      'neuro__neue_krampfanfaelle', 'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'neuro__leichter_wiederkehrender_schwindel', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Reflexsynkope', 'Orthostatische Hypotonie', 'Herzrhythmusstörung'],
    consequences: ['erneuten Ohnmachten mit Sturzverletzungen oder einer übersehenen behandlungsbedürftigen Herzrhythmusstörung'],
  },

  {
    id: 'synkope-bvo-orthostatisch',
    parentId: 'synkope-bvo',
    name: 'Orthostatische Synkope',
    requirements: 'orthostatische Ursache',
    majorSignalIds: [
      'neuro__neue_bewusstlosigkeit', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__anhaltendes_herzrasen', 'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'neuro__leichter_lageschwindel', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Orthostatische Hypotonie', 'Dehydratation', 'Medikamentös bedingte Hypotonie'],
    consequences: ['erneuten Blutdruckabfällen, Sturzverletzungen oder übersehenem Flüssigkeitsmangel/Blutverlust'],
  },

  {
    id: 'synkope-bvo-vasovagal',
    parentId: 'synkope-bvo',
    name: 'Vasovagale Synkope (bekanntes Niedrigrisikomuster)',
    requirements: 'Typischer Auslöser und Prodromi, rasche vollständige Erholung; unauffällige Untersuchung einschließlich EKG, keine kardialen Risikomerkmale.',
    majorSignalIds: [
      'neuro__neue_bewusstlosigkeit', 'thorax__schmerzen_druck', 'pulmo__neue_luftnot',
      'kreislauf__anhaltendes_herzrasen', 'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung',
      'kreislauf__neue_probleme',
    ],
    minorSignalIds: [
      'neuro__leichter_wiederkehrender_schwindel', 'stoffwechsel__anhaltende_muedigkeit',
    ],
    diagnoses: ['Vasovagale Synkope', 'Herzrhythmusstörung'],
    consequences: ['erneuten Ohnmachten, Sturzverletzungen oder verzögerter Erkennung einer anderen Kreislaufursache'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Tauchunfall mit Dekompressionsverdacht [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'tauchunfall-dekompressionsverdacht-verweigerung',
    name: 'Tauchunfall mit Dekompressionsverdacht',
    requirements: 'Neurologische Beschwerden, Atemnot oder ungewöhnliche Schmerzen nach Tauchgang; auch bei verzögertem Beginn.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'gelenk__anhaltende_schmerzen', 'extremitaet__sensibilitaetsstoerung',
      'neuro__zunehmende_muskelschwaeche', 'neuro__neue_gangunsicherheit', 'pulmo__neue_luftnot',
      'thorax__schmerzen_druck', 'haut__marmorierung', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Dekompressionskrankheit', 'Arterielle Gasembolie', 'Lungenbarotrauma'],
    consequences: ['bleibenden Nerven-/Rückenmarksschäden, Lähmungen, Atem-/Kreislaufversagen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Thoraxschmerz, nicht-traumatisch (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Thoraxschmerz, nicht-traumatisch (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit', 'kreislauf__anhaltendes_herzrasen', 'neuro__neue_einseitige_schwaeche',
    ],
    minorSignalIds: [],
    diagnoses: ['Akutes Koronarsyndrom', 'Akutes Aortensyndrom', 'Lungenembolie'],
    consequences: ['übersehenem Herzinfarkt/Gefäßeinriss, Herzrhythmusstörungen, Kreislaufstillstand, bleibenden Organschäden oder dem Tod'],
  },

  {
    id: 'aortensyndrom-verdacht-verweigerung',
    parentId: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Akutes Aortensyndrom (Verdacht)',
    requirements: 'Abrupter starker Thorax-/Rückenschmerz, Perfusionsunterschiede oder neurologische Symptome; zeitkritische Gefäßdiagnostik erforderlich.',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'ruecken__starke_schmerzen', 'abdomen__zunehmende_schmerzen',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_sprachstoerung', 'extremitaet__kalte_extremitaet',
      'kreislauf__neue_probleme', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Aortendissektion', 'Aortenruptur', 'Akutes Koronarsyndrom'],
    consequences: ['einem Riss der Hauptschlagader, innerem Verbluten, Schlaganfall, Organversagen oder dem Tod'],
  },

  {
    id: 'koronares-syndrom-verdacht-verweigerung',
    parentId: 'thoraxschmerz-nicht-traumatisch-schwer-verweigerung',
    name: 'Akutes Koronarsyndrom (Verdacht)',
    requirements: 'Ischämietypische Beschwerden oder verdächtige EKG-Veränderungen; auch ohne klassischen Brustschmerz oder bei zwischenzeitlicher Besserung.',
    majorSignalIds: [
      'thorax__schmerzen_druck', 'pulmo__neue_luftnot', 'kreislauf__neue_probleme',
      'kreislauf__anhaltendes_herzrasen', 'neuro__neue_bewusstlosigkeit', 'intox__uebelkeit_erbrechen',
    ],
    minorSignalIds: [],
    diagnoses: ['Myokardinfarkt', 'Instabile Angina pectoris', 'Herzrhythmusstörung'],
    consequences: ['fortschreitendem Herzmuskelschaden, lebensbedrohlichen Herzrhythmusstörungen, Herzversagen, Kreislaufstillstand oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Tiefe Venenthrombose (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'tiefe-venenthrombose-verdacht-verweigerung',
    name: 'Tiefe Venenthrombose (Verdacht)',
    requirements: 'Neue einseitige schmerzhafte Beinschwellung; erforderliche dringliche Diagnostik wird abgelehnt, nicht lediglich eine bestimmte Transportart.',
    application: 'Verweigerung',
    category: 'kreislauf',
    majorSignalIds: [
      'pulmo__neue_luftnot', 'thorax__schmerzen_druck', 'pulmo__relevante_haemoptyse',
      'neuro__neue_bewusstlosigkeit', 'extremitaet__einseitige_schwellung_schmerz',
      'extremitaet__blaesse_blaufarbung', 'extremitaet__kalte_extremitaet',
    ],
    minorSignalIds: [],
    diagnoses: ['Tiefe Venenthrombose', 'Lungenembolie'],
    consequences: ['Lungenembolie, bleibender Beinschwellung/Hautschädigung, schwerer Durchblutungsstörung des Beins oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trachealkanülenkomplikation [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'trachealkanuelenkomplikation-verweigerung',
    name: 'Trachealkanülenkomplikation',
    requirements: 'Dislokation, Verlegung oder relevante Blutung; sichere Atmung beziehungsweise Kanülenfunktion nicht zuverlässig wiederhergestellt.',
    application: 'Verweigerung',
    category: 'atmung',
    majorSignalIds: [
      'trachea__frische_blutung', 'trachea__verminderter_luftstrom', 'pulmo__neue_luftnot', 'pulmo__zyanose',
      'pulmo__atempausen', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [],
    diagnoses: ['Trachealkanülenverlegung', 'Trachealkanülendislokation', 'Tracheale Blutung'],
    consequences: ['Atemwegsverschluss, Erstickung, massiver Blutung, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trigeminusneuralgie (bekanntes Muster) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'trigeminusneuralgie-bekannt-bvo',
    name: 'Trigeminusneuralgie (bekanntes Muster)',
    requirements: 'Bekannte kurze Schmerzattacken, beherrschbar; keine neue Sensibilitätsstörung, Augenbeteiligung, Infektzeichen oder Nahrungsunfähigkeit.',
    application: 'BvO',
    category: 'neuro',
    majorSignalIds: [
      'neuro__gesichtstaubheit', 'neuro__gesichtslaehmung', 'neuro__neue_sprachstoerung',
      'sehstoerung__ploetzlicher_sehverlust', 'augen__starke_augenschmerzen',
      'stoffwechsel__fehlende_trinkfaehigkeit',
    ],
    minorSignalIds: [
      'neuro__wiederkehrende_gesichtsschmerzen',
    ],
    diagnoses: ['Trigeminusneuralgie', 'Herpes zoster', 'Pulpitis'],
    consequences: ['anhaltenden Schmerzen, Flüssigkeitsmangel oder verzögerter Erkennung einer anderen Ursache der Gesichtsschmerzen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Trinkschwäche beim jungen Säugling [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'trinkschwaeche-junger-saeugling-verweigerung',
    name: 'Trinkschwäche beim jungen Säugling',
    requirements: 'Neu deutlich verminderte Aufnahme, weniger nasse Windeln, auffällige Müdigkeit oder Temperaturabweichung; nicht pauschal als Infektbagatelle einstufen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'paediatrie__trinkschwaeche', 'paediatrie__wenige_nasse_windeln', 'paediatrie__schlaff_teilnahmslos',
      'infekt__fieber_schuettelfrost', 'temperatur__auffaellig_kalte_haut', 'paediatrie__angestrengte_atmung',
      'pulmo__atempausen', 'abdomen__gruenes_erbrechen',
    ],
    minorSignalIds: [],
    diagnoses: ['Schwere Infektion/Sepsis', 'Dehydratation', 'Hypoglykämie'],
    consequences: ['schwerer Austrocknung, Unterzuckerung, einer übersehenen Infektion, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Überlastungsbedingter Muskelschmerz (leicht) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'muskelschmerz-ueberlastung-leicht-bvo',
    name: 'Überlastungsbedingter Muskelschmerz (leicht)',
    requirements: 'Plausible ungewohnte Belastung, lokaler leichter Schmerz; keine ausgeprägte Schwellung, Schwäche, dunkler Urin oder Allgemeinsymptome.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [
      'muskeln__starke_schmerzen_schwellung', 'extremitaet__gespannte_schwellung',
      'neuro__zunehmende_muskelschwaeche', 'extremitaet__sensibilitaetsstoerung', 'uro__dunkelbrauner_urin',
      'uro__anhaltende_oligurie_anurie',
    ],
    minorSignalIds: [
      'muskeln__anhaltende_leichte_schmerzen',
    ],
    diagnoses: ['Muskelüberlastung', 'Muskelverletzung', 'Rhabdomyolyse'],
    consequences: ['einer übersehenen Muskelverletzung, anhaltender Funktionseinschränkung oder Nierenschäden bei Muskelzerfall'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Ungeklärtes Apnoe-/Zyanoseereignis beim Säugling [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'apnoe-zyanoseereignis-saeugling-verweigerung',
    name: 'Ungeklärtes Apnoe-/Zyanoseereignis beim Säugling',
    requirements: 'Berichtete Atempause, Blauverfärbung, deutliche Tonus- oder Bewusstseinsänderung; auch nach vollständiger Erholung akut beurteilen.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'pulmo__atempausen', 'pulmo__zyanose', 'paediatrie__schlaff_teilnahmslos',
      'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_krampfanfaelle', 'paediatrie__trinkschwaeche',
    ],
    minorSignalIds: [],
    diagnoses: ['Apnoe unklarer Ursache', 'Schwere Infektion', 'Krampfanfall'],
    consequences: ['erneuten Atemstillständen, Sauerstoffmangel, bleibenden Hirnschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Unterkühlung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'unterkuehlung-verweigerung',
    name: 'Unterkühlung',
    requirements: 'Körperkerntemperatur unter 35 °C oder begründeter Verdacht; besonders mit Erschöpfung, Verwirrtheit oder Kreislaufauffälligkeiten.',
    application: 'Verweigerung',
    category: 'umwelt',
    majorSignalIds: [
      'neuro__neue_verwirrtheit', 'neuro__zunehmende_schlaefrigkeit', 'neuro__neue_gangunsicherheit',
      'pulmo__langsame_flache_atmung', 'neuro__neue_bewusstlosigkeit',
      'temperatur__nachlassendes_kaeltezittern',
    ],
    minorSignalIds: [],
    diagnoses: ['Unterkühlung', 'Herzrhythmusstörung', 'Hypoglykämie'],
    consequences: ['weiterer Auskühlung, lebensbedrohlichen Herzrhythmusstörungen, Atem-/Kreislaufstillstand oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Vaginale Blutung (schwer) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'vaginale-blutung-schwer-verweigerung',
    name: 'Vaginale Blutung (schwer)',
    requirements: '',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__starke_vaginale_blutung', 'abdomen__zunehmende_schmerzen', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Akute uterine Blutung', 'Fehlgeburt', 'Extrauteringravidität'],
    consequences: ['starkem Blutverlust, Kreislaufversagen, bleibenden Organschäden oder dem Tod'],
  },

  {
    id: 'postpartale-blutung-verweigerung',
    parentId: 'vaginale-blutung-schwer-verweigerung',
    name: 'Postpartale Blutung',
    requirements: 'Starke oder erneut zunehmende Blutung nach Geburt, insbesondere mit Schwäche/Kreislaufzeichen; nicht als gewöhnliche Wochenbettblutung einstufen.',
    majorSignalIds: [
      'gyn__starke_vaginale_blutung', 'gyn__grosse_blutklumpen_wochenfluss', 'kreislauf__neue_probleme',
      'neuro__neue_bewusstlosigkeit', 'pulmo__neue_luftnot', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Uterusatonie', 'Plazentaretention', 'Geburtsverletzung'],
    consequences: ['massivem Blutverlust, Gerinnungsstörungen, Organversagen, notwendiger Gebärmutterentfernung oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verbandbedingte Druckbeschwerden (vollständig behoben) [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'verbanddruck-vollstaendig-behoben-bvo',
    name: 'Verbandbedingte Druckbeschwerden (vollständig behoben)',
    requirements: 'Nach fachgerechter Verbandkorrektur beschwerdefrei, DMS wiederholt normal; kein Gipsproblem, keine ungeklärte Verletzung oder Kompartmentzeichen.',
    application: 'BvO',
    category: 'trauma',
    majorSignalIds: [
      'extremitaet__zunehmende_schmerzen', 'extremitaet__sensibilitaetsstoerung',
      'extremitaet__bewegungsstoerung', 'extremitaet__blaesse_blaufarbung', 'extremitaet__kalte_extremitaet',
      'extremitaet__gespannte_schwellung',
    ],
    minorSignalIds: [
      'verband__wiederkehrendes_druckgefuehl',
    ],
    diagnoses: ['Druckbedingte Nervenkompression', 'Durchblutungsstörung', 'Kompartmentsyndrom'],
    consequences: ['erneuten Druckschäden, Durchblutungsstörungen oder bleibenden Nerven-/Muskelschäden'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verdacht auf vorzeitigen Blasensprung [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'vorzeitiger-blasensprung-verdacht-verweigerung',
    name: 'Verdacht auf vorzeitigen Blasensprung',
    requirements: 'Wässriger vaginaler Flüssigkeitsabgang vor Geburtsbeginn; besonders dringlich bei Frühgeburtlichkeit, Fieber oder auffälligem Fruchtwasser.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__fruchtwasserabgang', 'gyn__auffaelliges_fruchtwasser', 'infekt__fieber_schuettelfrost',
      'gyn__vaginale_blutung', 'gyn__verminderte_kindsbewegungen', 'gyn__regelmaessige_schmerzhafte_wehen',
      'gyn__sichtbare_nabelschnur', 'gyn__starke_anhaltende_unterbauchschmerzen',
    ],
    minorSignalIds: [],
    diagnoses: ['Vorzeitiger Blasensprung', 'Chorioamnionitis', 'Nabelschnurvorfall'],
    consequences: ['aufsteigenden Infektionen, Nabelschnurkompression, kindlichem Sauerstoffmangel, bleibenden Schäden oder dem Tod des Kindes'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Verschluckter Hochrisikofremdkörper [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'hochrisikofremdkoerper-verschluckt-verweigerung',
    name: 'Verschluckter Hochrisikofremdkörper',
    requirements: 'Knopfzelle, mehrere Magnete, Magnet plus Metall oder spitzer Gegenstand; auch ohne Beschwerden zeitkritisch abzuklären.',
    application: 'Verweigerung',
    category: 'paediatrie',
    majorSignalIds: [
      'hno__speichel_nicht_schluckbar', 'thorax__schmerzen_druck', 'abdomen__zunehmende_schmerzen',
      'abdomen__blutiges_erbrechen', 'abdomen__teerstuhl', 'pulmo__neue_luftnot',
      'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [],
    diagnoses: ['Fremdkörperimpaktion', 'Speiseröhren-/Darmverletzung', 'Verätzung durch Knopfzelle'],
    consequences: ['Speiseröhren-/Darmdurchbruch, lebensbedrohlichen Blutungen, Fistelbildung, schweren Infektionen oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Vorzeitige Wehen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'vorzeitige-wehen-verweigerung',
    name: 'Vorzeitige Wehen',
    requirements: 'Regelmäßige schmerzhafte Kontraktionen vor 37 vollendeten Schwangerschaftswochen; geburtshilfliche Akutabklärung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'gyn__regelmaessige_schmerzhafte_wehen', 'gyn__fruchtwasserabgang', 'gyn__vaginale_blutung',
      'gyn__verminderte_kindsbewegungen', 'gyn__pressdrang', 'infekt__fieber_schuettelfrost',
      'gyn__starke_anhaltende_unterbauchschmerzen',
    ],
    minorSignalIds: [],
    diagnoses: ['Vorzeitige Wehentätigkeit', 'Drohende Frühgeburt', 'Chorioamnionitis'],
    consequences: ['einer Frühgeburt, kindlicher Atemnot, Infektionen, bleibenden Entwicklungsstörungen oder dem Tod des Kindes'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Wirbelsäulentrauma mit Risikomerkmalen [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'wirbelsaeulentrauma-risikomerkmale-verweigerung',
    name: 'Wirbelsäulentrauma mit Risikomerkmalen',
    requirements: 'Mittellinienschmerz, neurologische Symptome oder gefährlicher Mechanismus; keine sichere klinische Entwarnung.',
    application: 'Verweigerung',
    category: 'trauma',
    majorSignalIds: [
      'ruecken__starke_schmerzen', 'extremitaet__sensibilitaetsstoerung', 'extremitaet__bewegungsstoerung',
      'neuro__taubheit_schritt', 'neuro__blasen_darmkontrollverlust', 'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Wirbelsäulenfraktur', 'Rückenmarkverletzung', 'Cauda-equina-Syndrom'],
    consequences: ['instabilen Wirbelsäulenverletzungen, bleibenden Lähmungen, Blasen-/Darmstörungen oder Atemversagen'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Wochenbettinfektion (Verdacht) [Verweigerung]
  // -------------------------------------------------------------------------

  {
    id: 'wochenbettinfektion-verdacht-verweigerung',
    name: 'Wochenbettinfektion (Verdacht)',
    requirements: 'Fieber mit Unterbauchschmerz, übel riechendem Wochenfluss oder deutlicher Allgemeinzustandsverschlechterung.',
    application: 'Verweigerung',
    category: 'gyn',
    majorSignalIds: [
      'infekt__fieber_schuettelfrost', 'gyn__uebel_riechender_wochenfluss', 'abdomen__zunehmende_schmerzen',
      'gyn__starke_vaginale_blutung', 'kreislauf__neue_probleme', 'neuro__neue_verwirrtheit',
      'pulmo__neue_luftnot',
    ],
    minorSignalIds: [],
    diagnoses: ['Endometritis puerperalis', 'Plazentarest', 'Sepsis'],
    consequences: ['einer Blutvergiftung, schweren Gebärmutterinfektion, bleibenden Organschäden oder dem Tod'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Zahnschmerzen ohne Ausbreitungszeichen [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'zahnschmerzen-ohne-ausbreitungszeichen-bvo',
    name: 'Zahnschmerzen ohne Ausbreitungszeichen',
    requirements: 'Lokaler beherrschbarer Schmerz; keine Schwellung, Schluckstörung, Kieferklemme oder Allgemeinsymptome; Zahnarztkontakt gesichert.',
    application: 'BvO',
    category: 'hno',
    majorSignalIds: [
      'hno__zunehmende_gesichtsschwellung', 'hno__kieferklemme', 'hno__speichel_nicht_schluckbar',
      'pulmo__neue_luftnot', 'infekt__fieber_schuettelfrost',
    ],
    minorSignalIds: [
      'hno__anhaltende_mundschmerzen',
    ],
    diagnoses: ['Pulpitis', 'Apikale Entzündung', 'Odontogener Abszess'],
    consequences: ['fortschreitender Zahnentzündung, Abszessbildung, Zahnverlust oder Ausbreitung der Infektion in den Kiefer-/Halsbereich'],
  },

  // -------------------------------------------------------------------------
  // Hauptszenario: Zeckenstich nach Entfernung, ohne Allgemeinsymptome [BvO]
  // -------------------------------------------------------------------------

  {
    id: 'zeckenstich-entfernt-ohne-allgemeinsymptome-bvo',
    name: 'Zeckenstich nach Entfernung, ohne Allgemeinsymptome',
    requirements: 'Zecke entfernt, allenfalls kleine lokale Reaktion; kein Fieber oder neurologisches Symptom; Verlaufskontrolle besprochen.',
    application: 'BvO',
    category: 'haut',
    majorSignalIds: [
      'neuro__gesichtslaehmung', 'neuro__neue_nackensteifigkeit', 'neuro__ploetzliche_starke_kopfschmerzen',
      'neuro__neue_einseitige_schwaeche', 'neuro__neue_verwirrtheit', 'neuro__neue_bewusstlosigkeit',
    ],
    minorSignalIds: [
      'haut__sich_vergroessernde_roetung_nach_stich', 'infekt__grippeaehnliche_beschwerden',
      'gelenk__anhaltende_leichte_schmerzen',
    ],
    diagnoses: ['Lyme-Borreliose', 'FSME'],
    consequences: ['einer unerkannten Borreliose mit Gelenk-/Nervenschäden oder einer Hirnhaut-/Gehirnentzündung durch FSME'],
  },

]

// ---------------------------------------------------------------------------
// Öffentliche Schnittstelle: flache Listen ohne Datenduplikation.
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
