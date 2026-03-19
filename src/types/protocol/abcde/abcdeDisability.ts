import { onHigh, onNormal, textIf } from "@/utils/filter"
import { AssessedValue, OptionalValue, ProtocolStateValue } from "../input"

import { useDokuStore } from "@/store/doku"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
function getCtx() { return useDokuStore().context }

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

  get isPediatricNonVerbal(): boolean {
    return this.consciousness == 'abwesend'
      || this.response == 'keine'
  }

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

export class AbcdeDisability {

  public avpu: 'wach' | 'benommen' | 'somnolent' | 'soporös' | 'bewusstlos'
  public zops: DisabilityZops
  public gcs: DisabilityGcs

  public paresis: OptionalValue<string>
  public paresthesia: OptionalValue<string>
  public aphasia: boolean

  public headache: boolean

  public dizziness: 'kein' | 'ungerichteter' | 'gerichteter'

  public psychRass: '' | 'unruhig' | 'agitiert' | 'sehr agitiert' | 'streitsüchtig'
  public psychDisorder: '' | 'Stupor' | 'Delir'
  public psychHallucinations: boolean
  public psychDelusions: boolean
  public psychDementia: boolean
  public psychPerseveration: boolean
  public psychBehavioralChange: boolean
  public psychBaseline: boolean

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
    this.psychRass = ''
    this.psychDisorder = ''
    this.psychHallucinations = false
    this.psychDelusions = false
    this.psychDementia = false
    this.psychPerseveration = false
    this.psychBehavioralChange = false
    this.psychBaseline = false
    this.bloodGlucose = ''
    this.intoxication = OptionalValue.inactive('')
    this.treatment = ''
  }

  // ##########################################################################

  get needTreatment(): boolean {
    return this.avpu != 'wach'
      || !this.zops.isOriented
      || this.gcs.score < 15
      || this.psychRass != ''
      || this.psychDisorder != ''
      || this.psychHallucinations
      || this.psychDelusions
      || this.psychBehavioralChange
      || this.psychPerseveration
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

  get hasPsychAbnormalities(): boolean {
    return this.psychRass != ''
      || this.psychDisorder != ''
      || this.psychHallucinations
      || this.psychDelusions
      || this.psychBehavioralChange
      || this.psychPerseveration
      || this.psychDementia
  }

  get couldBeBaseline(): boolean {
    return this.avpu != 'wach'
    || !this.zops.isOriented
    || this.gcsScore < 15
    || this.hasPsychAbnormalities
    || this.aphasia
    || this.paresis.active
    || this.paresthesia.active
  }

  get psychiatricDisorderText(): string {
    if (this.psychDisorder == 'Delir') { return 'deliranter Zustand' }
    else if (this.psychDisorder == 'Stupor') { return 'stuporöser Zustand' }
    else { return '' }
  }

  ///////////////////////////////////////////////

  get psychiatricState(): string {
    if (this.psychRass == ''
      && this.psychDisorder == ''
      && !this.psychHallucinations
      && !this.psychDelusions
      && !this.psychBehavioralChange
      && !this.psychPerseveration
      && !this.psychDementia
    ) { return 'normal' }
    return this.psychiatricText
  }

  get psychiatricText(): string {
    return concatDoku([
      this.psychRass,
      this.psychiatricDisorderText,
      textIf('halluziniert', this.psychHallucinations),
      textIf('wahnhaft', this.psychDelusions),
      textIf('wesensverändert', this.psychBehavioralChange),
      textIf('verbale Perseveration', this.psychPerseveration),
      textIf('bek. Demenz', this.psychDementia),
    ], false)
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
        : prefix('Parese: ', this.paresis.value), //TODO prefixParesis
      textIf(
        !this.paresthesia.active
          ? onNormal('keine Parästhesien')
          : prefix('Parästhesie:', this.paresthesia.value),
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
        textIf('Aphasie', this.aphasia),
        textIf(headache, !isNonVerbal),
        textIf(this.dizzinessText, !isNonVerbal),
        this.paresisText,
        this.psychiatricText,
        textIf(
          onNormal('baseline: nichts akutes'),
          this.psychBaseline
        ),
        textIf(`BZ ${this.bloodGlucose}`, this.bloodGlucose != ''),
        textIf(prefix('Intox:', this.intoxication.value), this.intoxication.active),
      ]))))

      const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

      return breakDoku([ assessedLine, treatmentLine ])

  }

}
