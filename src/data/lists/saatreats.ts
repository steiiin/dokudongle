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
  {
    id: 'atemweg',
    name: 'Atemweg',
    chips: [
      { id: 'guedel', label: 'Guedel', protocolText: 'Guedel' },
      { id: 'wendl', label: 'Wendl', protocolText: 'Wendl' },
      { id: 'sga', label: 'SGA (iGel/LT/LaMa)', protocolText: 'SGA' },
      { id: 'laryngoskopie', label: 'Laryngoskopie', protocolText: 'Laryngoskopie' },
      { id: 'magill', label: 'Magillzange', protocolText: 'FK-Entfernung mittels Magill' },
      { id: 'absaugen-tracheal', label: 'Tracheales Absaugen', protocolText: 'Tracheal abgesaugt' },
      { id: 'trachealkanuele', label: 'Trachealkanülenwechsel', protocolText: 'Trachealkanüle gewechselt' },
      { id: 'magensonde', label: 'Magensonde', protocolText: 'Magensonde' },
    ],
  },
  {
    id: 'beatmung',
    name: 'Beatmung',
    chips: [
      { id: 'niv', label: 'NIV/CPAP', protocolText: 'NIV/CPAP' },
    ],
  },
  {
    id: 'thorax',
    name: 'Thorax',
    chips: [
      { id: 'thoraxentlastung', label: 'Thoraxentlastungspunktion', protocolText: 'Thoraxentlastungspunktion' },
    ],
  },
  {
    id: 'blutstillung',
    name: 'Blutstillung',
    chips: [
      { id: 'tourniquet', label: 'Tourniquet', protocolText: 'Tourniquet' },
      { id: 'wound-packing', label: 'Wound Packing', protocolText: 'Wound Packing' },
      { id: 'nasentamponade', label: 'Nasentamponade', protocolText: 'Nasentamponade' },
      { id: 'nasenballon', label: 'Nasale Ballontamponade', protocolText: 'Nasale Ballontamponade' },
    ],
  },
  {
    id: 'elektrische-therapie',
    name: 'Elektrische Therapie',
    chips: [
      { id: 'defibrillation', label: 'Manuelle Defibrillation', protocolText: 'Manuelle Defibrillation' },
      { id: 'kardioversion', label: 'Kardioversion', protocolText: 'Synchronisierte Kardioversion' },
      { id: 'pacing', label: 'Transkutanes Pacing', protocolText: 'Transkutanes Pacing' },
    ],
  },
  {
    id: 'orthopaedie',
    name: 'Orthopädie',
    chips: [
      { id: 'reposition', label: 'Frakturreposition', protocolText: 'Achsengerechte Reposition' },
      { id: 'patella-reposition', label: 'Patellareposition', protocolText: 'Patellareposition' },
      { id: 'beckenschlinge', label: 'Beckenschlinge', protocolText: 'Beckenschlinge' },
    ],
  },
  {
    id: 'urologie',
    name: 'Urologie',
    chips: [
      { id: 'blasenkatheter', label: 'Blasenkatheteranlage', protocolText: 'Transurethraler Blasenkatheter' },
      { id: 'blasenkatheter-spuelen', label: 'Blasenkatheter spülen', protocolText: 'Blasenkatheter gespült' },
    ],
  },
  {
    id: 'geburtshilfe',
    name: 'Geburtshilfe',
    chips: [
      { id: 'geburtsbegleitung', label: 'Geburtsbegleitung', protocolText: 'Geburtsbegleitung' },
      { id: 'abnabelung', label: 'Abnabelung', protocolText: 'Abnabelung' },
      { id: 'nabelschnurvorfall', label: 'Nabelschnurvorfall entlasten', protocolText: 'Nabelschnurvorfall manuell entlastet' },
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
