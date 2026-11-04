export interface SaatreatChip {
  id: string
  label: string
  protocolText: string
  /** Alternativen schließen sich nur innerhalb ihrer übergeordneten Gruppe gegenseitig aus. */
  exclusiveGroupId?: string
}

export interface SaatreatGroup {
  id: string
  name: string
  chips: SaatreatChip[]
}
