import type { SaatreatGroup } from '@/types/lists/saatreats'

export const DATA_Saatreats: SaatreatGroup[] = [
  {
    id: 'gefaesszugang',
    name: 'Zugang',
    chips: [
      { id: 'pvk', label: 'i.v.-Zugang', protocolText: 'pVK', exclusiveGroupId: 'pvk' },
      { id: 'pvk-vel', label: 'i.v.-Zugang+Infusion', protocolText: 'pVK+VEL', exclusiveGroupId: 'pvk' },
      { id: 'io', label: 'i.o.-Zugang', protocolText: 'iO-Zugang' },
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
