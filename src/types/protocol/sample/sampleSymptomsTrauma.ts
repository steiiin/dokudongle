import { onHigh, onNormal } from "@/utils/filter"
import { concatDoku } from "@/utils/text"
import { ProtocolStateValue, PSV, SIV, StateItemValue } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

export class SampleSymptomsTrauma {

  public head: SstHead
  public spine: SstSpine
  public thorax: SstThorax
  public pelvis: SstPelvis
  public limbs: SstLimbs

  constructor()
  {
    this.head = new SstHead()
    this.spine = new SstSpine()
    this.thorax = new SstThorax()
    this.pelvis = new SstPelvis()
    this.limbs = new SstLimbs()
  }

}

// ############################################################################

export class SstHead {

  public isInjured: boolean
  public wasInitiallyUnconscious: boolean
  public headacheType: 'global' | 'local'
  public Amnesia: '' | 'retrograd' | 'anterograd' | 'beides'
  public Anisocoria: '' | 'li_gt_re' | 're_gt_li'

  // ##########################################################################

  constructor()
  {
    this.isInjured = false
    this.wasInitiallyUnconscious = false
    this.headacheType = 'global'
    this.Amnesia = ''
    this.Anisocoria = ''
  }

  // ##########################################################################

  get hasSHTIndicators(): boolean
  {
    return this.isInjured && (
      getCtx().hasNausea
      || getCtx().hasEmesis
      || getCtx().hasDizziness
      || (getCtx().isLowVigilant && !getCtx().isBaseline)
      || (getCtx().hasHeadache && this.headacheType == 'global')
      || this.Amnesia != ''
      || this.wasInitiallyUnconscious
      || this.Anisocoria != ''
    )
  }

  ///////////////////////////////////////////////

  get headPSV(): ProtocolStateValue
  {

    if (this.isInjured)
    {

      const hasHeadache = getCtx().hasHeadache

      if (this.hasSHTIndicators)
      {

        const isHeadacheGlobal = hasHeadache && this.headacheType === 'global'
        const hasNausea = getCtx().hasNausea
        const hasEmesis = getCtx().hasEmesis
        const hasDizziness = getCtx().hasDizziness
        const hasNewLowVigilance = getCtx().isLowVigilant && !getCtx().isBaseline

        const _emesis = hasNausea && hasEmesis ? 'Übelkeit/Erbrechen' :
          hasNausea ? 'Übelkeit' :
          hasEmesis ? 'Erbrechen' : ''

        const _headache = isHeadacheGlobal && hasDizziness ? 'Kopfschmerzen/Schwindel' :
          isHeadacheGlobal ? 'Kopfschmerzen' :
          hasDizziness ? 'Schwindel' : ''

        const _vigilance = this.wasInitiallyUnconscious && hasNewLowVigilance ? 'inital bewusstlos, weiterhin vigilanzgemindert' :
          this.wasInitiallyUnconscious ? 'inital bewusstlos' :
          hasNewLowVigilance ? 'vigilanzgemindert' : ''

        const _amnesia = this.Amnesia
        ? {
            retrograd: 'retrograde Amnesie',
            anterograd: 'anterograde Amnesie',
            beides: 'retro-/anterograde Amnesie'
          }[this.Amnesia]
        : ''

        const _anisocoria = this.Anisocoria
        ? {
            li_gt_re: 'Pupillen li>re',
            re_gt_li: 'Pupillen re>li'
          }[this.Anisocoria]
        : ''

        const _segments = [ _vigilance, _anisocoria, _emesis, _headache, _amnesia ]

        return PSV(
          concatDoku([_segments], false),
          `${concatDoku([_segments], false)} - mgl. SHT`
        )

      }

      if (hasHeadache) {
        return PSV(
          'Schmerzen nur im Bereich der Wunde',
          'Schmerzen nur im Wundbereich - SHT unwahrsch'
        )
      }

      return PSV('kein Anhalt SHT')

    }

    return PSV(
      onHigh('keine Verletzungen sichtbar; Gehörgänge/Nase frei; kein Anhalt SHT')
    )

  }

  get headState(): StateItemValue
  {
    let _title = ''
    if (this.isInjured && this.hasSHTIndicators) { _title = 'SHT möglich' }
    else if (this.isInjured) { _title = 'SHT unwahrscheinlich' }
    return SIV(_title, this.headPSV.modalState)
  }

  get headText(): string
  {
    const state = this.headPSV.protocolText
    const line = (text: string) => `Kopf: ${text}.\n`
    return !state ? '' : line(state)
  }

  // ##########################################################################

  public generateText(): string
  {
    return this.headText
  }

}

export class SstSpine {

  public hasObviousSevereInjury: boolean
  public needPainTreatment: boolean
  public hasFallFromOver3m: boolean
  public hasSupraclavicularInjury: boolean
  public hasSevereThoracoabdominalInjury: boolean

  public usedImmo: '' | 'Vakuummatratze/Headblock' | 'Vakuummatratze/StifNeck' | 'Spineboard/Headblock' | 'Vakuummatratze während Transport' | 'Komfortlagerung' | string
  public usedExtrication: '' | 'SelfExtrication' | 'achsengerechte Umlagerung' | string

  // ##########################################################################

  constructor()
  {
    this.hasObviousSevereInjury = false
    this.needPainTreatment = false
    this.hasFallFromOver3m = false
    this.hasSupraclavicularInjury = false
    this.hasSevereThoracoabdominalInjury = false
    this.usedImmo = 'Komfortlagerung'
    this.usedExtrication = ''
  }

  // ##########################################################################

  get isDueSevereInjury(): boolean { return this.hasObviousSevereInjury }
  get isDueVigilance(): boolean { return getCtx().gcs <= 12 && !getCtx().isBaseline }
  get isDueNeuro(): boolean { return getCtx().hasSensomotoricDeficit && !getCtx().isBaseline }
  get isDuePain(): boolean { return this.needPainTreatment }
  get isDueAge(): boolean { return getCtx().isGeriatric }
  get isDueFall(): boolean { return this.hasFallFromOver3m }
  get isDueSupraclavicular(): boolean { return this.hasSupraclavicularInjury }
  get isDueThorakoAbdominal(): boolean { return this.hasSevereThoracoabdominalInjury }

  get isImmoRed(): boolean {
    return this.isDueSevereInjury
      || this.isDueVigilance
      || this.isDueNeuro
      || this.isDuePain
  }
  get isImmoYellow(): boolean {
    return this.isDueFall
      || this.isDueSupraclavicular
      || this.isDueThorakoAbdominal
      || this.isDueAge
  }
  get isImmoGreen(): boolean {
    return !this.isImmoYellow
  }

  ///////////////////////////////////////////////

  get immoState(): StateItemValue
  {
    if (this.isDueSevereInjury) { return SIV('Immo-Ampel Rot', 'Offensichtlich schwer verletzt') }
    else if (this.isDueVigilance) { return SIV('Immo-Ampel Rot', 'GCS <= 12') }
    else if (this.isDueNeuro) { return SIV('Immo-Ampel Rot', 'Peripher neurologisches Defizit') }
    else if (this.isDuePain) { return SIV('Immo-Ampel Rot', 'Starker Wirbelsäulenschmerz') }
    else if (this.isDueFall) { return SIV('Immo-Ampel Gelb', 'Sturz große Höhe') }
    else if (this.hasSupraclavicularInjury) { return SIV('Immo-Ampel Gelb', 'Supraklavikuläre Verletzung') }
    else if (this.isDueThorakoAbdominal) { return SIV('Immo-Ampel Gelb', 'Schwere thorakoabdominelle Verletzung') }
    else if (this.isDueAge) { return SIV('Immo-Ampel Gelb', 'Älter als 65 Jahre') }
    else { return SIV('Immo-Ampel Grün', 'Keine Immobilisation erforderlich') }
  }

  // ##########################################################################

  public generateText(): string
  {

    const line = (text: string) => `WS: ${text}\n`

    let _immo = ''
    if (this.isImmoYellow) {
      if (this.usedImmo && this.usedExtrication) { _immo = ` ${this.usedExtrication}/${this.usedImmo}.` }
      else if (this.usedImmo) { _immo = ` ${this.usedImmo}.` }
      else if (this.usedExtrication) { _immo = ` ${this.usedExtrication}.` } }

    if (this.isDueSevereInjury) { return line('ImmoAmpel Rot - offensichtlich schwer verletzt. Vollimmobilisation.') }
    else if (this.isDueVigilance) { return line('ImmoAmpel Rot - GCS<=12 nach Trauma. Vollimmobilisation.') }
    else if (this.isDueNeuro) { return line('ImmoAmpel Rot - peripher neurologisches Defizit. Vollimmobilisation.') }
    else if (this.isDuePain) { return line('ImmoAmpel Rot - starker Wirbelsäulenschmerz. Vollimmobilisation.') }
    else if (this.isDueFall) { return line(`ImmoAmpel Gelb - Sturz aus großer Höhe.${_immo}`) }
    else if (this.hasSupraclavicularInjury) { return line(`ImmoAmpel Gelb - Supraklavikuläre Verletzung.${_immo}`) }
    else if (this.isDueThorakoAbdominal) { return line(`ImmoAmpel Gelb - Schwere thorakoabdominelle Verletzung.${_immo}`) }
    else if (this.isDueAge) { return line(`ImmoAmpel Gelb - Älter als 65 Jahre.${_immo}`) }
    else { return onNormal(line('ImmoAmpel Grün - keine Immobilisation erforderlich.')) }

  }

}

export class SstThorax {

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

export class SstPelvis {

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

      if (this.hasHighEnergyMechanism
        && this.PelvisPainOccurence != ''
        && this.hasObviousInjuries)
      {

        const _mechanism = this.hasHighEnergyMechanism ? 'Kinematik plausibel' : ''
        const _obvious = this.hasObviousInjuries ? 'sichtbare Verletzung' : ''
        const _pain = (() => {
          if (this.PelvisPainOccurence === 'spontan') return 'Schmerzen'
          if (this.PelvisPainOccurence === 'palpation') return 'Schmerzen bei Palpation'
          return ''
        })()
        return `Becken: ${concatDoku([[ _mechanism, _obvious, _pain ]], false)} - S-KIPS positiv.`

      }

    }

    return onHigh('Becken: S-KIPS negativ.')

  }

}

export class SstLimbs {

  public armLeft: SstLimb
  public armRight: SstLimb
  public legLeft: SstLimb
  public legRight: SstLimb

  // ##########################################################################

  constructor()
  {
    this.armLeft = new SstLimb()
    this.armRight = new SstLimb()
    this.legLeft = new SstLimb()
    this.legRight = new SstLimb()
  }

  // ##########################################################################

  private sameValues(obj1: SstLimb, obj2: SstLimb): boolean {
    return (obj1.isInjured == obj2.isInjured)
      && obj1.dms.state == obj1.dms.state
      && obj1.dms.deficit == obj2.dms.deficit
  }

  // ##########################################################################

  public generateText(): string
  {

    const sameArms = this.sameValues(this.armLeft, this.armRight)
    const sameLegs = this.sameValues(this.legLeft, this.legRight)

    if (this.sameValues(this.armLeft, this.legLeft))
    {
      // same
      const desc = this.armLeft.text
      return desc.length>0 ? `Arme/Beine: ${desc} \n` : ''
    }

    const segs: string[] = []
    if (sameArms)
    {
      const desc = this.armLeft.text
      segs.push(desc.length>0 ? `Arme: ${desc} \n` : '')
    }
    else
    {
      const descLeft = this.armLeft.text
      const descRight = this.armRight.text
      segs.push(descLeft.length>0 ? `Arm (li.): ${descLeft} \n` : '')
      segs.push(descRight.length>0 ? `Arm (re.): ${descRight} \n` : '')
    }

    if (sameLegs)
    {
      const desc = this.legLeft.text
      segs.push(desc.length>0 ? `Beine: ${desc} \n` : '')
    }
    else
    {
      const descLeft = this.legLeft.text
      const descRight = this.legRight.text
      segs.push(descLeft.length>0 ? `Bein (li.): ${descLeft} \n` : '')
      segs.push(descRight.length>0 ? `Bein (re.): ${descRight} \n` : '')
    }

    return segs.filter(e=>e).join()

  }

}

// ############################################################################

export class SstLimb {

  public isInjured: boolean
  public dms: SstLimbDms

  constructor()
  {
    this.isInjured = false
    this.dms = new SstLimbDms()
  }

  get text(): string
  {
    if (this.isInjured)
    {
      if (!this.dms.isApplicable) { return '' }
      return this.dms.text
    }
    else
    {
      return onHigh('keine Verletzungen sichtbar; frei beweglich.')
    }
  }

}

export class SstLimbDms {

  public state: '' | 'iO' | 'gestoert'
  public deficit: string

  constructor()
  {
    this.state = ''
    this.deficit = ''
  }

  get isApplicable(): boolean { return this.state != '' }
  get isOkay(): boolean { return this.state == 'iO' }
  get isDeficient(): boolean { return this.isApplicable && this.state == 'gestoert' && this.deficit.length>0 }

  get text(): string
  {
    if (!this.isApplicable) { return '' }
    return this.isOkay ? 'pDMS iO' : `pDMS gestört (${this.deficit})`
  }

}
