import { onHigh, onNormal, textIf } from "@/utils/filter"
import { AssessedValue, OptionalValue } from "../input"

import { useDokuStore } from "@/store/doku"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
function getCtx() { return useDokuStore().context }

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

  get isUnoriented(): boolean {
    return this.Z != 'nein' && this.O != 'nein' && this.P != 'nein' && this.S != 'nein'
  }

  // ##########################################################################

  private static readonly keys = ['Z', 'O', 'P', 'S'] as const;

  ///////////////////////////////////////////////

  get generatePediatricText(): string {

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

  get generateAdultText(): string {

    const mapping: Record<'Z'|'O'|'P'|'S', string> = {
      Z: (/*shortLabel ? 'Z' : */'zeitlich'),
      O: (/*shortLabel ? 'Ö' : */'örtlich'),
      P: (/*shortLabel ? 'P' : */'zur Person'),
      S: (/*shortLabel ? 'S' : */'situativ'),
    };

    if (this.isOriented) { return 'ZOPS orientiert' }
    if (this.isUnoriented) { return 'desorientiert' }

    const group = (value: 'ja' | 'teilweise' | 'nein') =>
      DisabilityZops.keys
        .filter(k => this[k] === value)
        .map(k => mapping[k]);

    const parts: string[] = [];

    const orientiert = group('ja');
    if (orientiert.length) {
      parts.push(`${orientiert.join('/')} orientiert`);
    }

    const teilweise = group('teilweise');
    if (teilweise.length) {
      parts.push(`${teilweise.join('/')} ${/*shortLabel ? 'teilw.' : */'teilweise orientiert'}`);
    }

    const desorientiert = group('nein');
    if (desorientiert.length) {
      parts.push(`${desorientiert.join('/')} ${/*shortLabel ? 'deso.' : */'desorientiert'}`);
    }

    return parts.join(', ');

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

      const headache = this.headache
        ? 'Kopfschmerzen'
        : onNormal('keine Kopfschmerzen')

      const assessedLine: string = breakDoku(prefix('D:', capitalizeBegin(concatDoku([
        [
          this.avpu,
          textIf(this.zops.generateAdultText, !isNonVerbal),
        ],
        this.gcs.score == 15
          ? onHigh('GCS 15')
          : onNormal(`GCS ${this.gcs.score}`),
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