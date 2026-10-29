export interface SaatreatChip {
  id: string
  label: string
  protocolText: string
  /** Alternatives are exclusive only within their parent group. */
  exclusiveGroupId?: string
}

export interface SaatreatGroup {
  id: string
  name: string
  chips: SaatreatChip[]
}
