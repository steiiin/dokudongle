import { useDokuStore } from "@/store/doku"
import { onHigh, onNormal } from "@/utils/filter"
import { concatDoku } from "@/utils/text"
import { AssessedValue, OptionalValue } from "../input"
function getCtx() { return useDokuStore().context }

export const IMMO_AMPEL_COMMENTARY = {
  severeInjury: 'Immo-Ampel Rot; offensichtlich schwer verletzt.',
  gcs: 'Immo-Ampel Rot; GCS <= 12.',
  neuro: 'Immo-Ampel Rot; peripher neurologisches Defizit.',
  pain: 'Immo-Ampel Rot; starker Wirbelsäulenschmerz.',
  age: 'Immo-Ampel Gelb; Älter als 65 Jahre.',
  fall: 'Immo-Ampel Gelb; Sturz große Höhe.',
  supraclavicular: 'Immo-Ampel Gelb; Supraklavikuläre Verletzung.',
  thorakoAbdominal: 'Immo-Ampel Gelb; Schwere thorakoabdominelle Verletzung.',
  green: 'Immo-Ampel Grün; keine Immobilisation erforderlich.',
} as const
export const IMMO_AMPEL_INFOOBJ = {
  severeInjury: { title: 'Immo-Ampel Rot', desc: 'Offensichtlich schwer verletzt' },
  gcs: { title: 'Immo-Ampel Rot', desc: 'GCS <= 12' },
  neuro: { title: 'Immo-Ampel Rot', desc: 'Peripher neurologisches Defizit' },
  pain: { title: 'Immo-Ampel Rot', desc: 'Starker Wirbelsäulenschmerz' },
  age: { title: 'Immo-Ampel Gelb', desc: 'Älter als 65 Jahre' },
  fall: { title: 'Immo-Ampel Gelb', desc: 'Sturz große Höhe' },
  supraclavicular: { title: 'Immo-Ampel Gelb', desc: 'Supraklavikuläre Verletzung' },
  thorakoAbdominal: { title: 'Immo-Ampel Gelb', desc: 'Schwere thorakoabdominelle Verletzung' },
  green: { title: 'Immo-Ampel Grün', desc: 'Keine Immobilisation erforderlich' },
} as const

export class AbcdeStu {

  public head: StuHead
  public spine: StuSpine
  public thorax: StuThorax
  public pelvis: StuPelvis
  public limbs: StuLimbs

  constructor()
  {
    this.head = new StuHead()
    this.spine = new StuSpine()
    this.thorax = new StuThorax()
    this.pelvis = new StuPelvis()
    this.limbs = new StuLimbs()
  }

}

export class StuHead {

  public isInjured: boolean
  public wasInitiallyUnconscious: boolean
  public headacheType: '' | 'global' | 'local'
  public Amnesia: '' | 'retrograd' | 'anterograd' | 'beides'
  public Anisocoria: '' | 'li_gt_re' | 're_gt_li'

  // ##########################################################################

  constructor()
  {
    this.isInjured = false
    this.wasInitiallyUnconscious = false
    this.headacheType = ''
    this.Amnesia = ''
    this.Anisocoria = ''
  }

  // ##########################################################################

  public generateText(): string
  {

    const isGlobalHeadache = getCtx().hasHeadache && this.headacheType === 'global'

    const emesisSegment =
      getCtx().hasNausea && getCtx().hasEmesis ? 'Übelkeit/Erbrechen' :
      getCtx().hasNausea ? 'Übelkeit' :
      getCtx().hasEmesis ? 'Erbrechen' : ''

    const headacheSegment =
      isGlobalHeadache && getCtx().hasDizziness ? 'Kopfschmerzen/Schwindel' :
      isGlobalHeadache ? 'Kopfschmerzen' :
      getCtx().hasDizziness ? 'Schwindel' : ''

    const vigilanceSegment =
      this.wasInitiallyUnconscious && getCtx().isLowVigilant ? 'initial Bewusstlos, weiterhin Vigilanzminderung' :
      this.wasInitiallyUnconscious ? 'initial Bewusstlos' :
      getCtx().isLowVigilant ? 'Vigilanzminderung' : ''

    const amnesiaSegment = this.Amnesia
    ? {
        retrograd: 'retrograde Amnesie',
        anterograd: 'anterograde Amnesie',
        beides: 'retro-/anterograde Amnesie'
      }[this.Amnesia]
    : ''

    const anisocoriaSegment = this.Anisocoria
    ? {
        li_gt_re: 'Pupillen li>re',
        re_gt_li: 'Pupillen re>li'
      }[this.Anisocoria]
    : onHigh('Pupillen seitengleich')

    const segments = [
      emesisSegment,
      headacheSegment,
      vigilanceSegment,
      amnesiaSegment,
      anisocoriaSegment
    ]

    const hasSHTIndicators =
      this.isInjured &&
      (getCtx().hasNausea || getCtx().hasEmesis || isGlobalHeadache || getCtx().hasDizziness || getCtx().isLowVigilant || this.Amnesia || this.wasInitiallyUnconscious || this.Anisocoria)

    if (hasSHTIndicators) {
      return `Kopf: ${concatDoku(segments, false)} - mgl. SHT. \n`
    }

    if (this.isInjured) {
      return getCtx().hasHeadache
        ? 'Kopf: Schmerzen nur im Wundbereich - SHT unwahrscheinlich. \n'
        : 'Kopf: kein Anhalt SHT. \n'
    }

    return getCtx().isHigh
      ? 'Kopf: keine Verletzungen sichtbar; Gehörgänge/Nase frei; kein Anhalt SHT. \n'
      : ''

  }

}

export class StuSpine {

  public hasObviousSevereInjury: boolean
  public needPainTreatment: boolean
  public hasFallFromOver3m: boolean
  public hasHeadOrNeckInjury: boolean
  public hasSevereThoracoabdominalInjury: boolean

  // ##########################################################################

  constructor()
  {
    this.hasObviousSevereInjury = false
    this.needPainTreatment = false
    this.hasFallFromOver3m = false
    this.hasHeadOrNeckInjury = false
    this.hasSevereThoracoabdominalInjury = false
  }

  // ##########################################################################

  public generateText(): string
  {

    const isBaseline = getCtx().isBaseline

    if (this.hasObviousSevereInjury) { return `WS: ${IMMO_AMPEL_COMMENTARY.severeInjury} \n` }
    if (getCtx().gcs <= 12 && !isBaseline) { return `WS: ${IMMO_AMPEL_COMMENTARY.gcs} \n` }
    if (getCtx().hasSensomotoricDeficit && !isBaseline) { return `WS: ${IMMO_AMPEL_COMMENTARY.neuro} \n` }
    if (this.needPainTreatment) { return `WS: ${IMMO_AMPEL_COMMENTARY.pain} \n` }
    if (getCtx().isGeriatric) { return `WS: ${IMMO_AMPEL_COMMENTARY.age} \n` }
    if (this.hasFallFromOver3m) { return `WS: ${IMMO_AMPEL_COMMENTARY.fall} \n` }
    if (this.hasHeadOrNeckInjury) { return `WS: ${IMMO_AMPEL_COMMENTARY.supraclavicular} \n` }
    if (this.hasSevereThoracoabdominalInjury) { return `WS: ${IMMO_AMPEL_COMMENTARY.thorakoAbdominal} \n` }
    return onNormal(`WS: ${IMMO_AMPEL_COMMENTARY.green} \n`)

  }

}

export class StuThorax {

  public hasUnstableChestWall: boolean

  // ##########################################################################

  constructor()
  {
    this.hasUnstableChestWall = false
  }

  // ##########################################################################

  public generateText(): string
  {
    return this.hasUnstableChestWall
      ? 'Thorax: Instabilität.'
      : onHigh('Thorax: stabil.')
  }

}

export class StuPelvis {

  public hasHemodynamicInstability: boolean
  public hasHighEnergyMechanism: boolean
  public hasObviousInjuries: boolean
  public PelvisPainOccurence: '' | 'spontan' | 'palpation'

  // ##########################################################################

  constructor()
  {
    this.hasHemodynamicInstability = false
    this.hasHighEnergyMechanism = false
    this.hasObviousInjuries = false
    this.PelvisPainOccurence = ''
  }

  // ##########################################################################

  public generateText(): string {

    if (this.hasHemodynamicInstability)
    {

      const mechanismSegment = this.hasHighEnergyMechanism ? 'Kinematik plausibel' : ''
      const obviousSegment = this.hasObviousInjuries ? 'sichtbare Verletzung' : ''
      const painSegment = (() => {
        if (this.PelvisPainOccurence === 'spontan') return 'Schmerzen'
        if (this.PelvisPainOccurence === 'palpation') return 'Schmerzen bei Palpation'
        return ''
      })()

      return `Becken: ${concatDoku([[ mechanismSegment, obviousSegment, painSegment ]], false)} - S-KIPS positiv.`

    }

    return onHigh('Becken: S-KIPS negativ.')

  }

}

export class StuLimbs {

  public armLeft: AssessedValue<StuLimbsDms>
  public armRight: AssessedValue<StuLimbsDms>
  public legLeft: AssessedValue<StuLimbsDms>
  public legRight: AssessedValue<StuLimbsDms>

  // ##########################################################################

  constructor()
  {
    this.armLeft = AssessedValue.unassessed(new StuLimbsDms())
    this.armRight = AssessedValue.unassessed(new StuLimbsDms())
    this.legLeft = AssessedValue.unassessed(new StuLimbsDms())
    this.legRight = AssessedValue.unassessed(new StuLimbsDms())
  }

  // ##########################################################################

  private sameValues(obj1: AssessedValue<StuLimbsDms>, obj2: AssessedValue<StuLimbsDms>): boolean {
    return (obj1.assessed == obj2.assessed)
      && obj1.value.isIO == obj1.value.isIO
      && obj1.value.text == obj2.value.text
  }

  private getPartialBlock(obj: AssessedValue<StuLimbsDms>): string {
    if (obj.assessed)
    {
      return obj.value.isIO
        ? 'pDMS iO'
        : obj.value.text
    }
    else
    {
      return onHigh('keine Verletzungen sichtbar; frei beweglich.')
    }
  }

  // ##########################################################################

  public generateText(): string
  {

    const sameArms = this.sameValues(this.armLeft, this.armRight)
    const sameLegs = this.sameValues(this.legLeft, this.legRight)

    if (this.sameValues(this.armLeft, this.legLeft))
    {
      // same
      const desc = this.getPartialBlock(this.armLeft)
      return desc.length>0 ? `Arme/Beine: ${desc} \n` : ''
    }

    const segs: string[] = []
    if (sameArms)
    {
      const desc = this.getPartialBlock(this.armLeft)
      segs.push(desc.length>0 ? `Arme: ${desc} \n` : '')
    }
    else
    {
      const descLeft = this.getPartialBlock(this.armLeft)
      const descRight = this.getPartialBlock(this.armRight)
      segs.push(descLeft.length>0 ? `Arm (li.): ${descLeft} \n` : '')
      segs.push(descRight.length>0 ? `Arm (re.): ${descRight} \n` : '')
    }

    if (sameLegs)
    {
      const desc = this.getPartialBlock(this.legLeft)
      segs.push(desc.length>0 ? `Beine: ${desc} \n` : '')
    }
    else
    {
      const descLeft = this.getPartialBlock(this.legLeft)
      const descRight = this.getPartialBlock(this.legRight)
      segs.push(descLeft.length>0 ? `Bein (li.): ${descLeft} \n` : '')
      segs.push(descRight.length>0 ? `Bein (re.): ${descRight} \n` : '')
    }

    return segs.filter(e=>e).join()

  }

}

export class StuLimbsDms {

  public deficit: OptionalValue<string>

  constructor()
  {
    this.deficit = OptionalValue.inactive('')
  }

  get isIO(): boolean
  {
    return this.deficit.active
  }

  get text(): string
  {
    return this.deficit.active
      ? `pDMS gestört - ${this.deficit.value}`
      : 'pDMS iO'
  }

}
