import { AbcdeAirway, AbcdeBleeding, AbcdeBreathing, AbcdeCirculation, AbcdeDisability, AbcdeExposure } from "./protocol/abcde"
import { EnhanceableText } from "./protocol/input"
import { Sampler } from "./protocol/sampler"
import { Setting } from "./protocol/setting"
import { TreatmentSaamed } from "./protocol/treatment/treatmentSaamed"
import { TreatmentRedflags } from "./protocol/treatment/treatmentRedflags"

export interface Protocol {

  course: ProtocolCourse,
  flavors: ProtocolFlavors,

  ident: Patient,
  setting: Setting,
  situation: EnhanceableText,

  Xabcde: AbcdeBleeding,
  xAbcde: AbcdeAirway,
  xaBcde: AbcdeBreathing,
  xabCde: AbcdeCirculation,
  xabcDe: AbcdeDisability,
  xabcdE: AbcdeExposure,

  sampler: Sampler,

  saamed: TreatmentSaamed,
  treatment: EnhanceableText,
  redflags: TreatmentRedflags,

}

export function resetProtocol(): Protocol {
  const result: Protocol = {

    course: ProtocolCourse.TRANSPORT,
    flavors: {
      simple: false,
      trauma: false,
      non_verbal: false,
      reanimation: false
    },

    ident: new Patient(),
    setting: new Setting(),
    situation: new EnhanceableText(),

    Xabcde: new AbcdeBleeding(),
    xAbcde: new AbcdeAirway(),
    xaBcde: new AbcdeBreathing(),
    xabCde: new AbcdeCirculation(),
    xabcDe: new AbcdeDisability(),
    xabcdE: new AbcdeExposure(),

    sampler: new Sampler(),

    saamed: new TreatmentSaamed(),
    treatment: new EnhanceableText(),
    redflags: new TreatmentRedflags(),

  }
  return result
}

// #######################################################################

export enum ProtocolVerbosity {
  HIGH,
  NORMAL,
  LOW,
}

export enum ProtocolCourse {
  TRANSPORT,
  VERLEGUNG,
  EINWEISUNG,
  NEF_VOR_ORT,
}

export interface ProtocolFlavors {
  simple: boolean
  trauma: boolean
  non_verbal: boolean
  reanimation: boolean
}

// #######################################################################

export class Patient {
  public age: PatientAge
  constructor() {
    this.age = new PatientAge(50, 'years')
  }
}

export class PatientAge {

  constructor(
    public timespan: number,
    public unit: 'years' | 'months',
  ) { }

  // #######################################################################

  public toString(): string {

    const num = this.timespan
    if (!num) return ''
    const text =
      this.unit === 'years'
        ? num === 1
          ? 'Jahr'
          : 'Jahre'
        : num === 1
        ? 'Monat'
        : 'Monate'
    return `${num} ${text}`

  }

  // #######################################################################

  get totalYears(): number {
    return this.unit == 'years'
      ? this.timespan
      : this.timespan / 12
  }

}

// #######################################################################

export interface ProtocolContext {

  verbosity: ProtocolVerbosity,
  isLow: boolean,
  isNormal: boolean,
  isHigh: boolean,

  requireSceneDetails: boolean,
  requireFlavors: boolean,
  requireABCDE: boolean,
  requireSampler: boolean,
  requireRedflags: boolean,

  isCourseVerlegung: boolean,
  isCourseEinweisung: boolean,

  isBreathing: boolean,
  hasPulse: boolean,
  isNonVerbal: boolean,
  isLowVigilant: boolean,
  isCritical: boolean,
  gcs: number,
  isBaseline: boolean,

  hasNausea: boolean,
  hasEmesis: boolean,
  hasHeadache: boolean,
  hasDizziness: boolean,
  hasSensomotoricDeficit: boolean,
  hasHeartIssue: boolean,
  hasAbdominalIssue: boolean,

  isTrauma: boolean,
  isPediatric: boolean,
  isGeriatric: boolean,


}