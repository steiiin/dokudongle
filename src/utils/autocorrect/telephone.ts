const formatGroups = (digits: string): string => {
  if (digits.length <= 3) return digits

  const groups: string[] = []
  let remaining = digits
  const firstGroupLength = remaining.startsWith('0') && remaining.length >= 8 ? 4 : 3
  groups.push(remaining.slice(0, firstGroupLength))
  remaining = remaining.slice(firstGroupLength)

  while (remaining.length > 4) {
    groups.push(remaining.slice(0, 3))
    remaining = remaining.slice(3)
  }

  if (remaining.length > 0) {
    groups.push(remaining)
  }

  return groups.join(' ')
}

export const correctPhone = (draft: string): string => {
  const trimmed = draft.trim()
  if (!trimmed) return ''

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^\d]/g, '')
  if (!digits) return ''

  const formatted = formatGroups(digits)
  return `${hasPlus ? '+' : ''}${formatted}`
}
