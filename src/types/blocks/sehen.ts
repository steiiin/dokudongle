import { AssessedValue } from '@/types/protocol/input'

export const visionSideSymptoms = [
  'Verschwommensehen', 'Flimmern', 'Lichtblitze', 'Rußregen', 'Schatten/Vorhang',
] as const

export const visionSymptoms = [...visionSideSymptoms, 'Fehlender Bildbereich', 'Doppelbilder'] as const

type VisionSideSymptom = typeof visionSideSymptoms[number]
type VisionSide = 'rechts' | 'links' | 'beide' | 'unklar'
type VisionLoss = 'kein' | Exclude<VisionSide, 'unklar'>
type VisionDoubleImages = 'nur Rechts' | 'nur Links' | 'Beide Einzeln' | 'Beide Geöffnet' | 'Unklar'

export class DisabilityVision {
  public visionLoss: VisionLoss = 'kein'
  public symptoms: string[] = []
  public sides: Record<VisionSideSymptom, VisionSide> = {
    Verschwommensehen: 'unklar',
    Flimmern: 'unklar',
    Lichtblitze: 'unklar',
    Rußregen: 'unklar',
    'Schatten/Vorhang': 'unklar',
  }
  public shadowDescription = AssessedValue.unassessed('')
  public missingAreaDescription = ''
  public doubleImages: VisionDoubleImages = 'Unklar'

  get selectedSideSymptoms(): VisionSideSymptom[] {
    return this.visionLoss === 'beide' ? [] : visionSideSymptoms.filter(symptom => this.symptoms.includes(symptom))
  }

  get hasDescription(): boolean {
    return this.visionLoss !== 'beide'
      && ['Schatten/Vorhang', 'Fehlender Bildbereich', 'Doppelbilder'].some(symptom => this.symptoms.includes(symptom))
  }

  setVisionLoss(value: VisionLoss): void {
    this.visionLoss = value
    if (value === 'beide') this.setSymptoms([])
  }

  setSymptoms(values: string[]): void {
    this.symptoms = this.visionLoss === 'beide' ? [] : [...new Set(values.filter(value => value.trim()))]
    for (const symptom of visionSideSymptoms) {
      if (!this.symptoms.includes(symptom)) this.sides[symptom] = 'unklar'
    }
    if (!this.symptoms.includes('Schatten/Vorhang')) this.resetShadowDescription()
    if (!this.symptoms.includes('Fehlender Bildbereich')) this.missingAreaDescription = ''
    if (!this.symptoms.includes('Doppelbilder')) this.doubleImages = 'Unklar'
  }

  resetShadowDescription(): void {
    this.shadowDescription = AssessedValue.unassessed('')
  }

  get findingsText(): string {
    if (this.visionLoss === 'beide') return 'Sehverlust beidseits'

    const sides: Record<VisionSide, string> = {
      rechts: 'rechts', links: 'links', beide: 'beidseits', unklar: '(Seite unklar)',
    }
    const doubleImages: Record<VisionDoubleImages, string> = {
      'nur Rechts': 'Doppelbilder nur rechts',
      'nur Links': 'Doppelbilder nur links',
      'Beide Einzeln': 'Doppelbilder bei beiden Augen einzeln',
      'Beide Geöffnet': 'Doppelbilder bei beiden geöffneten Augen',
      Unklar: 'Doppelbilder (pro Auge unklar)',
    }
    const symptoms = this.symptoms.filter(value => value.trim()).map(symptom => {
      if (visionSideSymptoms.includes(symptom as VisionSideSymptom)) {
        const description = symptom === 'Schatten/Vorhang' && this.shadowDescription.isAssessed
          ? ` (${this.shadowDescription.value.trim()})` : ''
        return `${symptom} ${sides[this.sides[symptom as VisionSideSymptom]]}${description}`
      }
      if (symptom === 'Doppelbilder') return doubleImages[this.doubleImages]
      if (symptom === 'Fehlender Bildbereich' && this.missingAreaDescription.trim()) {
        return `${symptom} (${this.missingAreaDescription.trim()})`
      }
      return symptom.trim()
    })
    return [
      this.visionLoss !== 'kein' ? `Sehverlust ${sides[this.visionLoss]}` : '',
      symptoms.length ? `Sehstörungen: ${symptoms.join(', ')}` : '',
    ].filter(Boolean).join('; ')
  }
}
