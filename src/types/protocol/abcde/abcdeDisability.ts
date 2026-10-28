import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { prefixIntox, prefixParaesthesis } from "@/utils/prefix/disability"
import { onNormal, textIf } from "@/utils/filter"
import { AssessedValue, OptionalValue } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

type ZopsKey = 'Z' | 'O' | 'P' | 'S';
type ZopsValue = 'ja' | 'teilweise' | 'nein';

export class DisabilityZops {

  public Z: 'ja' | 'teilweise' | 'nein'
  public O: 'ja' | 'teilweise' | 'nein'
  public P: 'ja' | 'teilweise' | 'nein'
  public S: 'ja' | 'teilweise' | 'nein'

  ///////////////////////////////////////////////

  public consciousness: 'aufmerksam' | 'ablenkbar' | 'unaufmerksam' | 'abwesend'
  public affect: 'ruhig' | 'troestbar' | 'untroestbar'
  public response: 'adaequat' | 'inadaequat' | 'keine'

  // ##########################################################################

  constructor()
  {
    this.Z = 'ja'
    this.O = 'ja'
    this.P = 'ja'
    this.S = 'ja'
    this.consciousness = 'aufmerksam'
    this.affect = 'ruhig'
    this.response = 'adaequat'
  }

  // ##########################################################################

  get isOriented(): boolean {
    return this.Z == 'ja' && this.O == 'ja' && this.P == 'ja' && this.S == 'ja'
  }

  get isPartialUnoriented(): boolean{
    return this.Z != 'ja' && this.O != 'ja' && this.P != 'ja' && this.S != 'ja'
  }

  get isUnoriented(): boolean {
    return this.Z == 'nein' && this.O == 'nein' && this.P == 'nein' && this.S == 'nein'
  }

  // ##########################################################################

  private static readonly keys = ['Z', 'O', 'P', 'S'] as const;

  ///////////////////////////////////////////////

  get pediatricState(): string
  {

    const vigilanzMap: Record<typeof this.consciousness, string> = {
      aufmerksam: 'aufmerksam',
      ablenkbar: 'teils aufmerksam',
      unaufmerksam: 'verlangsamt',
      abwesend: 'abwesend',
    }

    const affektMap: Record<typeof this.affect, string> = {
      ruhig: 'ruhig',
      troestbar: 'tröstbar',
      untroestbar: 'untröstbar',
    }

    const reaktionMap: Record<typeof this.response, string> = {
      adaequat: 'adäquat',
      inadaequat: 'inadäquat',
      keine: 'keine Reaktion',
    }

    return [
      vigilanzMap[this.consciousness],
      affektMap[this.affect],
      reaktionMap[this.response],
    ].join(', ')

  }

  get pediatricText(): string {

    const vigilanzMap: Record<typeof this.consciousness, string> = {
      aufmerksam: 'altersentsprechend aufmerksam',
      ablenkbar: 'teils aufmerksam, leicht ablenkbar',
      unaufmerksam: 'verlangsamt/unaufmerksam',
      abwesend: 'abwesend wirkend',
    }

    const affektMap: Record<typeof this.affect, string> = {
      ruhig: 'affektiv unauffällig',
      troestbar: 'weint aber tröstbar',
      untroestbar: 'untröstbar',
    }

    const reaktionMap: Record<typeof this.response, string> = {
      adaequat: 'reagiert adäquat',
      inadaequat: 'inadäquate Reaktion',
      keine: 'keine zielgerichtete Reaktion',
    }

    return [
      vigilanzMap[this.consciousness],
      affektMap[this.affect],
      reaktionMap[this.response],
    ].join(', ')

  }

  ///////////////////////////////////////////////

  private buildAdultText(
    mapping: Record<ZopsKey, string>,
    labels: {
      orientiert: string;
      teilweise: string;
      desorientiert: string;
    }
  ): string {

    if (this.isOriented) return 'ZOPS orientiert';
    if (this.isUnoriented) return 'desorientiert';

    const group = (value: ZopsValue) =>
      DisabilityZops.keys
        .filter(k => this[k] === value)
        .map(k => mapping[k]);

    return ([
      { keys: group('ja'), text: labels.orientiert },
      { keys: group('teilweise'), text: labels.teilweise },
      { keys: group('nein'), text: labels.desorientiert }
    ])
      .filter(g => g.keys.length)
      .map(g => `${g.keys.join('/')} ${g.text}`)
      .join(', ');
  }

  get adultState(): string {
    return this.buildAdultText(
      { Z: 'Z', O: 'Ö', P: 'P', S: 'S' },
      {
        orientiert: 'orientiert',
        teilweise: 'teilw.',
        desorientiert: 'deso.'
      }
    );
  }

  get adultText(): string {

    if (this.isOriented && getCtx().isLow) { return 'orientiert' }
    return this.buildAdultText(
      { Z: 'zeitlich', O: 'örtlich', P: 'zur Person', S: 'situativ' },
      {
        orientiert: 'orientiert',
        teilweise: 'teilweise orientiert',
        desorientiert: 'desorientiert'
      }
    );

  }

}

export class DisabilityGcs {

  public a: number
  public v: number
  public m: number

  constructor()
  {
    this.a = 4
    this.v = 5
    this.m = 6
  }

  get score(): number {
    return this.a + this.v + this.m
  }

}

// ############################################################################

export class DisabilityNeuro {

  public followInstructions: 'befolgt' | 'teilweise befolgt' | 'nicht befolgt'

  public msFace: '' | 'leichte' | 'ausgeprägte' | 'komplette'

  public msArmLeft: 'ohne Absinken' | 'leichtes Absinken' | 'Absinken' | 'nur Restbewegungen' | 'keine aktive Bewegung'
  public msArmRight: 'ohne Absinken' | 'leichtes Absinken' | 'Absinken' | 'nur Restbewegungen' | 'keine aktive Bewegung'
  public msLegLeft: 'ohne Absinken' | 'leichtes Absinken' | 'Absinken' | 'nur Restbewegungen' | 'keine aktive Bewegung'
  public msLegRight: 'ohne Absinken' | 'leichtes Absinken' | 'Absinken' | 'nur Restbewegungen' | 'keine aktive Bewegung'

  public msMeningism: '' | 'kein' | 'leichter' | 'ausgeprägter'
  public msTremor: boolean

  public sensitivity: OptionalValue<string>
  public paraesthesia: OptionalValue<string>

  public dysarthria: 'normal' | 'verwaschen' | 'unverständlich' | 'stumm' | ''
  public aphasia: 'keine' | 'leichte' | 'schwere' | 'globale' | ''

  constructor()
  {
    this.followInstructions = 'befolgt'
    this.msFace = ''
    this.msArmLeft = 'ohne Absinken'
    this.msArmRight = 'ohne Absinken'
    this.msLegLeft = 'ohne Absinken'
    this.msLegRight = 'ohne Absinken'
    this.msMeningism = 'kein'
    this.msTremor = false
    this.sensitivity = OptionalValue.inactive('')
    this.paraesthesia = OptionalValue.inactive('')
    this.dysarthria = 'normal'
    this.aphasia = 'keine'
  }

  get hasAbnormalities(): boolean {
    return this.followInstructions !== 'befolgt'
      || this.msFace == 'leichte' ||this.msFace == 'ausgeprägte' || this.msFace == 'komplette'
      || this.msArmLeft != 'ohne Absinken' || this.msArmRight != 'ohne Absinken'
      || this.msLegLeft != 'ohne Absinken' || this.msLegRight != 'ohne Absinken'
      || this.msMeningism == 'leichter' || this.msMeningism == 'ausgeprägter'
      || this.msTremor
      || this.sensitivity.isActive || this.paraesthesia.isActive
      || this.dysarthria == 'stumm' || this.dysarthria == 'unverständlich' || this.dysarthria == 'verwaschen'
      || this.aphasia == 'globale' || this.aphasia == 'leichte' || this.aphasia == 'schwere'
  }

  get needTreatment(): boolean {
    return false
  }

  get state(): string {
    return this.hasAbnormalities ? this.text : 'normal'
  }

  get summaryText(): string {
    const pareses = [
      textIf('Facialparese', this.msFace != ''),
      textIf('Armparese', this.msArmLeft != 'ohne Absinken' || this.msArmRight != 'ohne Absinken'),
      textIf('Beinparese', this.msLegLeft != 'ohne Absinken' || this.msLegRight != 'ohne Absinken'),
    ].filter(Boolean)

    return [
      textIf('Aphasie', (this.aphasia != '' && this.aphasia != 'keine')
        || (this.dysarthria != '' && this.dysarthria != 'normal')),
      pareses.length > 1 ? 'Parese' : pareses[0],
      textIf('Störung Sensibilität', this.sensitivity.isActive),
      textIf('Parästhesien', this.paraesthesia.isActive),
      this.neckStiffnessText,
    ].filter(Boolean).join(', ') || 'keine Paresen/Parästhesien'
  }

  get neckStiffnessText(): string {
    if (this.msMeningism === 'leichter') return 'leichte Nackensteife'
    if (this.msMeningism === 'ausgeprägter') return 'ausgeprägte Nackensteife'
    return ''
  }

  get text(): string {
    return this.buildDetailsText(this.neckStiffnessText)
  }

  get symptomsText(): string {
    return this.buildDetailsText(this.msMeningism === 'kein' ? 'keine Nackensteife' : '')
  }

  buildDetailsText(neckStiffness: string): string {
    const articulation: Record<typeof this.dysarthria, string> = {
      normal: '',
      verwaschen: 'verwaschene Artikulation',
      unverständlich: 'unverständliche Artikulation',
      stumm: 'stumm',
      '': '',
    }

    const limbFindings = [...new Set([
      this.msArmLeft, this.msArmRight, this.msLegLeft, this.msLegRight,
    ])].filter(finding => finding !== 'ohne Absinken').map(finding => {
      const armLeft = this.msArmLeft === finding
      const armRight = this.msArmRight === finding
      const legLeft = this.msLegLeft === finding
      const legRight = this.msLegRight === finding

      if (armLeft && armRight && legLeft && legRight) return `${finding} Extremitäten`
      if (armLeft && legLeft && !armRight && !legRight) return `${finding} li`
      if (armRight && legRight && !armLeft && !legLeft) return `${finding} re`

      const arms = armLeft && armRight ? 'Arme' : armLeft ? 'Arm li' : armRight ? 'Arm re' : ''
      const legs = legLeft && legRight ? 'Beine' : legLeft ? 'Bein li' : legRight ? 'Bein re' : ''
      return `${finding} ${[arms, legs].filter(Boolean).join(' und ')}`
    })

    return concatDoku([
      textIf(`Anweisungen ${this.followInstructions}`, this.followInstructions != 'befolgt'),
      textIf(`${this.msFace} Fazialisparese`, this.msFace != ''),
      ...limbFindings,
      neckStiffness,
      textIf('Tremor/Myoklonien', this.msTremor),
      textIf(prefix('Sensibilitätsstörung:', this.sensitivity.value), this.sensitivity.isActive),
      textIf(prefixParaesthesis(this.paraesthesia.value), this.paraesthesia.isActive),
      articulation[this.dysarthria],
      textIf(`${this.aphasia} Aphasie`, this.aphasia != '' && this.aphasia != 'keine'),
    ], false)
  }

}

// ############################################################################

export class DisabilityPsych {

  public rass: '' | 'unruhig' | 'agitiert' | 'sehr agitiert' | 'streitsüchtig'
  public disorder: '' | 'Stupor' | 'Delir'
  public hallucinations: boolean
  public delusions: boolean
  public dementia: boolean
  public perseveration: boolean
  public behavioralChange: boolean

  constructor()
  {
    this.rass = ''
    this.disorder = ''
    this.hallucinations = false
    this.delusions = false
    this.dementia = false
    this.perseveration = false
    this.behavioralChange = false
  }

  get needTreatment(): boolean {
    return this.rass != ''
      || this.disorder != ''
      || this.hallucinations
      || this.delusions
      || this.behavioralChange
      || this.perseveration
  }

  get hasAbnormalities(): boolean {
    return this.needTreatment || this.dementia
  }

  get disorderText(): string {
    if (this.disorder == 'Delir') { return 'deliranter Zustand' }
    else if (this.disorder == 'Stupor') { return 'stuporöser Zustand' }
    else { return '' }
  }

  ///////////////////////////////////////////////

  get state(): string {
    return this.hasAbnormalities ? this.text : 'normal'
  }

  get text(): string {
    return concatDoku([
      this.rass,
      this.disorderText,
      textIf('halluziniert', this.hallucinations),
      textIf('wahnhaft', this.delusions),
      textIf('wesensverändert', this.behavioralChange),
      textIf('verbale Perseveration', this.perseveration),
      textIf('bek. Demenz', this.dementia),
    ], false)
  }

}

// ############################################################################

export class AbcdeDisability {

  public avpu: 'wach' | 'benommen' | 'somnolent' | 'soporös' | 'bewusstlos'
  public zops: DisabilityZops
  public gcs: DisabilityGcs

  public paresis: OptionalValue<string>
  public paresthesia: OptionalValue<string>
  public aphasia: boolean

  public headache: boolean

  public dizziness: 'kein' | 'ungerichteter' | 'gerichteter'

  public neuro: AssessedValue<DisabilityNeuro>
  public psych: AssessedValue<DisabilityPsych>
  public baseline: boolean

  public bloodGlucose: AssessedValue<'' | 'normal' | 'niedrig' | 'hoch'>

  public intoxication: AssessedValue<string>

  public treatment: string

  // ##########################################################################

  constructor()
  {
    this.avpu = 'wach'
    this.zops = new DisabilityZops()
    this.gcs = new DisabilityGcs()
    this.aphasia = false
    this.paresis = OptionalValue.inactive('')
    this.paresthesia = OptionalValue.inactive('')
    this.headache = false
    this.dizziness = 'kein'
    this.neuro = AssessedValue.unassessed(new DisabilityNeuro())
    this.psych = AssessedValue.unassessed(new DisabilityPsych())
    this.baseline = false
    this.bloodGlucose = AssessedValue.unassessed('normal')
    this.intoxication = AssessedValue.unassessed('')
    this.treatment = ''
  }

  // ##########################################################################

  get needTreatment(): boolean {
    return this.avpu != 'wach'
      || !this.zops.isOriented
      || this.gcs.score < 15
      || (this.neuro.isAssessed && this.neuro.value.needTreatment)
      || (this.psych.isAssessed && this.psych.value.needTreatment)
      || this.bloodGlucose.matches('hoch')
      || this.bloodGlucose.matches('niedrig')
      || this.aphasia
      || this.paresis.active
      || this.paresthesia.active
      || this.headache
      || this.dizziness != 'kein'
      || this.intoxication.assessed
  }

  // ##########################################################################

  get gcsVerbalScore(): number {
    if (this.gcs.v >= 4) {
      return this.zops.isOriented ? 5 : 4
    }
    return this.gcs.v
  }

  get gcsScore(): number { return this.gcs.a + this.gcsVerbalScore + this.gcs.m }

  ///////////////////////////////////////////////

  get couldBeBaseline(): boolean {
    return this.avpu != 'wach'
    || !this.zops.isOriented
    || this.gcsScore < 15
    || (this.psych.isAssessed && this.psych.value.hasAbnormalities)
    || this.aphasia
    || this.paresis.active
    || this.paresthesia.active
  }

  ///////////////////////////////////////////////

  get dizzinessText(): string {
    if (this.dizziness == 'kein') { return onNormal('kein Schwindel') }
    else if (this.dizziness == 'ungerichteter') { return 'diffuser/ungerichteter Schwindel' }
    else { return 'Dreh-/Schwankschwindel' }
  }

  // ##########################################################################

  public generateText(): string
  {

      const isNonVerbal = getCtx().isNonVerbal
      const isPediatric = getCtx().isPediatric

      const headache = this.headache ? 'Kopfschmerzen' : onNormal('keine Kopfschmerzen')

      const assessedLine: string = breakDoku(prefix('D:', capitalizeBegin(concatDoku([
        [
          this.avpu,
          textIf(this.zops.pediatricText, !isNonVerbal && isPediatric),
          textIf(this.zops.adultText, !isNonVerbal && !isPediatric),
        ],
        this.gcsScore < 14 ? `GCS ${this.gcsScore}` : '',
        textIf(headache, !isNonVerbal),
        textIf(this.dizzinessText, !isNonVerbal),
        textIf(this.neuro.value.summaryText, this.neuro.isAssessed),
        textIf(this.psych.value.text, this.psych.isAssessed),
        textIf(
          onNormal('baseline: nichts akutes'),
          this.baseline
        ),
        textIf(`BZ ${this.bloodGlucose.value}`, this.bloodGlucose.isAssessed),
        textIf(prefixIntox(this.intoxication.value), this.intoxication.assessed),
      ]))))

      const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

      return breakDoku([ assessedLine, treatmentLine ])

  }

}
