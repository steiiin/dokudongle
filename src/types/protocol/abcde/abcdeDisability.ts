import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { prefixIntox, prefixParaesthesis, prefixParesis } from "@/utils/prefix/disability"
import { onHigh, onNormal, textIf } from "@/utils/filter"
import { OptionalValue } from "../input"

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

export class DisabilityPsych {

  public rass: '' | 'unruhig' | 'agitiert' | 'sehr agitiert' | 'streitsüchtig'
  public disorder: '' | 'Stupor' | 'Delir'
  public hallucinations: boolean
  public delusions: boolean
  public dementia: boolean
  public perseveration: boolean
  public behavioralChange: boolean
  public baseline: boolean

  constructor()
  {
    this.rass = ''
    this.disorder = ''
    this.hallucinations = false
    this.delusions = false
    this.dementia = false
    this.perseveration = false
    this.behavioralChange = false
    this.baseline = false
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

  public psych: DisabilityPsych

  public bloodGlucose: '' | 'normal' | 'niedrig' | 'hoch'

  public intoxication: OptionalValue<string>

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
    this.psych = new DisabilityPsych()
    this.bloodGlucose = ''
    this.intoxication = OptionalValue.inactive('')
    this.treatment = ''
  }

  // ##########################################################################

  get needTreatment(): boolean {
    return this.avpu != 'wach'
      || !this.zops.isOriented
      || this.gcs.score < 15
      || this.psych.needTreatment
      || this.bloodGlucose == 'hoch'
      || this.bloodGlucose == 'niedrig'
      || this.aphasia
      || this.paresis.active
      || this.paresthesia.active
      || this.headache
      || this.dizziness != 'kein'
      || this.intoxication.active
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
    || this.psych.hasAbnormalities
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

  ///////////////////////////////////////////////

  get paresisText(): string {

    const isNonVerbal = getCtx().isNonVerbal
    if (!this.paresis.active && !this.paresthesia.active) { return onNormal('keine Paresen' + (isNonVerbal ? '' : '/Parästhesien')) }
    return concatDoku([
      !this.paresis.active
        ? onNormal('keine Paresen')
        : prefixParesis(this.paresis.value),
      textIf(
        !this.paresthesia.active
          ? onNormal('keine Parästhesien')
          : prefixParaesthesis(this.paresthesia.value),
        !isNonVerbal
      ),
    ])
  }

  // ##########################################################################

  public generateText(): string
  {

      const isNonVerbal = getCtx().isNonVerbal
      const isPediatric = getCtx().isPediatric

      const headache = this.headache
        ? 'Kopfschmerzen'
        : onNormal('keine Kopfschmerzen')

      const assessedLine: string = breakDoku(prefix('D:', capitalizeBegin(concatDoku([
        [
          this.avpu,
          textIf(this.zops.pediatricText, !isNonVerbal && isPediatric),
          textIf(this.zops.adultText, !isNonVerbal && !isPediatric),
        ],
        this.gcsScore == 15
          ? onHigh('GCS 15')
          : onNormal(`GCS ${this.gcsScore}`),
        textIf('Dysarthrie', this.aphasia),
        textIf(headache, !isNonVerbal),
        textIf(this.dizzinessText, !isNonVerbal),
        this.paresisText,
        this.psych.text,
        textIf(
          onNormal('baseline: nichts akutes'),
          this.psych.baseline
        ),
        textIf(`BZ ${this.bloodGlucose}`, this.bloodGlucose != ''),
        textIf(prefixIntox(this.intoxication.value), this.intoxication.active),
      ]))))

      const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

      return breakDoku([ assessedLine, treatmentLine ])

  }

}
