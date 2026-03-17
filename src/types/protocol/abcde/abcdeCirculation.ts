import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { AssessedValue, unassessed } from "../input"
import { onHigh, onNormal, textIf } from "@/utils/filter"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

export interface CirculationPulse {
  rate: 'normofrequent' | 'bradykard' | 'tachykard'
  rhythmic: boolean
  peripheralStrength: 'nicht' | 'schlecht' | 'gut'
  centralStrength: 'nicht' | 'schlecht' | 'gut'
}

export interface CirculationSkin {
  color: 'rosig' | 'blass' | 'zyanotisch' | 'marmoriert'
  clammy: boolean
  poorSkinTurgor: boolean
  peripheralTemp: 'warm' | 'kühl'
  centralTemp: 'warm' | 'kühl'
}

export interface CirculationChest {
  tightness: boolean
  pain: 'keine' | 'leichte' | '' | 'starke'
  tenderness: boolean
  aggravation: boolean
  radiation: AssessedValue<string>
}

export interface CirculationEdema {
  grade: 'keine Ödeme' | 'Knöchelödeme' | 'Unterschenkelödeme' | 'ausgeprägte abhängige Ödeme'
  variation: 'neu aufgetreten' | 'zunehmend' | 'unverändert' | 'rückläufig' | ''
}

export class AbcdeCirculation {

  public pulse: CirculationPulse
  public rr: '' | 'hypoton' | 'hyperton'
  public skin: CirculationSkin

  public chest: CirculationChest

  public capillaryRefill: '1s' | '2s' | '3s' | '>3s'
  public edema: CirculationEdema

  public ecg: 'SR' | 'VHF' | string

  public treatment: string

  // #####################################################################

  constructor()
  {
    this.pulse = {
      rate: 'normofrequent',
      rhythmic: true,
      peripheralStrength: 'gut',
      centralStrength: 'gut'
    }
    this.rr = ''
    this.skin = {
      color: 'rosig',
      clammy: false,
      poorSkinTurgor: false,
      peripheralTemp: 'warm',
      centralTemp: 'warm',
    }
    this.chest = {
      tightness: false,
      pain: 'keine',
      tenderness: false,
      aggravation: false,
      radiation: unassessed(''),
    }
    this.capillaryRefill = '2s'
    this.edema = {
      grade: 'keine Ödeme',
      variation: '',
    }
    this.ecg = 'SR'
    this.treatment = ''
  }

  // #####################################################################

  get needTreatment(): boolean {
    return this.pulse.rate != 'normofrequent'
      || !this.pulse.rhythmic
      || this.pulse.peripheralStrength != 'gut'
      || this.rr != ''
      || !(this.ecg == 'SR' || this.ecg == 'VHF')
      || this.skin.color != 'rosig'
      || this.skin.centralTemp != 'warm'
      || this.skin.poorSkinTurgor
      || this.chest.tightness
      || this.chest.pain != 'keine'
      || this.capillaryRefill == '>3s'
  }

  // #####################################################################

  get skinSweatText(): string { return this.skin.clammy ? 'schweißig' : 'trocken' }

  get skinText(): string {
    const temp: string = (this.skin.centralTemp != this.skin.peripheralTemp)
      ? `Stamm ${this.skin.centralTemp}, Extr. ${this.skin.peripheralTemp}`
      : this.skin.centralTemp
    return concatDoku([
      `${this.skin.color}/${temp}/${this.skinSweatText}`,
      textIf('stehende Hautfalten', this.skin.poorSkinTurgor)
    ], false)
  }

  ///////////////////////////////////////////////

  get pulseStrengthText(): string {
    if (this.pulse.peripheralStrength == 'gut') { return 'gut tastbar' }
    else if (this.pulse.peripheralStrength == 'schlecht') {
      return this.pulse.centralStrength == 'gut'
        ? 'zentral gut, radial schlecht tastbar'
        : 'schlecht tastbar'
    }
    if (this.pulse.centralStrength == 'gut') { return 'zentral gut, radial nicht tastbar' }
    else if (this.pulse.centralStrength == 'schlecht') { return 'zentral schlecht, radial nicht tastbar' }
    else { return 'nicht tastbar' }
  }

  get pulseText(): string {
    if (this.pulse.centralStrength == 'nicht') { return 'kein Puls' }
    if (
      this.pulse.rhythmic
      && this.pulse.rate == 'normofrequent'
      && this.pulse.peripheralStrength == 'gut'
    ) { return 'Puls iO' }
    return concatDoku([[
      this.pulseStrengthText,
      this.pulse.rate,
      this.pulse.rhythmic ? 'rhythmisch' : 'arrhythmisch'
    ]], false)
  }

  ///////////////////////////////////////////////

  get ecgDescription(): string {
    if (this.ecg.length>0) { return this.ecg }
    return 'kein EKG'
  }

  get ecgText(): string {
    if (this.ecg.length>0) { return this.ecg }
    return ''
  }

  ///////////////////////////////////////////////

  get edemaText(): string {
    if (this.edema.grade == 'keine Ödeme') { onHigh(this.edema.grade) }
    if (this.edema.variation == '') { return this.edema.grade }
    return `${this.edema.grade} (${this.edema.variation})`
  }

  ///////////////////////////////////////////////

  get chestDescription(): string {
    if (!this.chest.tightness && this.chest.pain == 'keine') { return 'normal' }
    return this.chestText
  }

  get chestText(): string {
    if (!this.chest.tightness && this.chest.pain == 'keine') { return 'keine Brustenge/-schmerzen' }
    if (this.chest.pain == 'keine') { return 'Brustenge, aber kein Brustschmerz' }
    let strength = `${this.chest.pain} Brustschmerzen`
    let radiation = this.chest.radiation.assessed
      ? prefix('strahlen aus:', this.chest.radiation.value)
      : onHigh('strahlen nicht aus')
    return concatDoku([[
      textIf('Brustenge', this.chest.tightness),
      strength,
      radiation,
      this.chest.tenderness
        ? 'druckdolent'
        : onHigh('nicht druckdolent'),
      this.chest.aggravation
        ? 'bewegungsabhängig'
        : 'nicht bewegungsabh.'
    ]], false)
  }

  // #####################################################################

  public generateText(): string
  {

    const hasPulse = getCtx().hasPulse
    const isNonVerbal = getCtx().isNonVerbal

    const assessedLine: string = breakDoku(prefix('C:', capitalizeBegin(concatDoku([
      `Haut ${this.skinText}`,
      this.pulseText,
      textIf(
        this.capillaryRefill == '>3s' ? 'Rekap>3s' : onNormal(`Rekap ${this.capillaryRefill}`),
        getCtx().hasPulse
      ),
      textIf(this.chestText, !isNonVerbal),
      textIf(this.rr, hasPulse),
      this.edemaText,
      this.ecgText,
    ]))))

    const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

    return breakDoku([ assessedLine, treatmentLine ])

  }

}