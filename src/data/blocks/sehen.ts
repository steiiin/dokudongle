import { DisabilityVision } from '@/types/blocks/sehen'
import { TextAreaBlock, type TextAreaBlockSourceState } from '@/types/blocks/text-area-block'

export interface SehenBlockSourceState extends TextAreaBlockSourceState {
  details: DisabilityVision
}

export function createSehenBlockState(): SehenBlockSourceState {
  return {
    values: {},
    active: { 'sehen.symptoms': true },
    details: new DisabilityVision(),
  }
}

export class SehenTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('sehen.symptoms', 'sehen', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'primary')
  }

  override render(state: SehenBlockSourceState) {
    return super.render({ ...state, values: { TEXT: state.details.findingsText } })
  }
}
