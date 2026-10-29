import type { SaatreatGroup } from '@/types/lists/saatreats'

// Preliminary example catalog. The PVK exclusion demonstrates the selection
// behavior and is not a clinical rule; adapt the catalog before expanding it.
export const DATA_Saatreats: SaatreatGroup[] = [
  {
    id: 'gefaesszugang',
    name: 'Gefäßzugang',
    chips: [
      { id: 'pvk-18g', label: 'PVK 18 G', protocolText: 'PVK 18 G', exclusiveGroupId: 'pvk' },
      { id: 'pvk-20g', label: 'PVK 20 G', protocolText: 'PVK 20 G', exclusiveGroupId: 'pvk' },
      { id: 'pvk-22g', label: 'PVK 22 G', protocolText: 'PVK 22 G', exclusiveGroupId: 'pvk' },
      { id: 'intraossaer', label: 'Intraossärer Zugang', protocolText: 'Intraossärer Zugang' },
    ],
  },
  {
    id: 'atemweg',
    name: 'Atemweg',
    chips: [
      { id: 'endotracheal', label: 'Endotracheale Intubation', protocolText: 'Endotracheale Intubation' },
      { id: 'supraglottisch', label: 'Supraglottischer Atemweg', protocolText: 'Supraglottischer Atemweg' },
    ],
  },
]

export function selectedSaatreatChips(ids: readonly string[]) {
  const chipsById = new Map(DATA_Saatreats.flatMap(group => group.chips.map(chip => [chip.id, chip] as const)))
  return [...new Set(ids)].flatMap(id => {
    const chip = chipsById.get(id)
    return chip ? [chip] : []
  })
}
