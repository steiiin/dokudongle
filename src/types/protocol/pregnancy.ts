const DAYS_PER_WEEK = 7
const PREGNANCY_DAYS_AT_TERM = 40 * DAYS_PER_WEEK

export const PREGNANCY_TRIMESTERS = [
  '1. Trimenon',
  '2. Trimenon',
  '3. Trimenon',
] as const

export type PregnancyTrimester = typeof PREGNANCY_TRIMESTERS[number]

const APPROXIMATE_WEEK: Record<PregnancyTrimester, string> = {
  '1. Trimenon': '8+0',
  '2. Trimenon': '20+0',
  '3. Trimenon': '34+0',
}

const calendarDay = (date: Date): number => Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
)

const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + days)
  return result
}

const parseWeek = (value: string): number | null => {
  const match = /^(\d{1,2})(?:\+(\d))?$/.exec(value.trim())
  if (!match) return null

  const weeks = Number(match[1])
  const days = Number(match[2] ?? 0)
  if (weeks > 45 || days > 6) return null

  return weeks * DAYS_PER_WEEK + days
}

/**
 * A pregnancy duration derived from the calculated term date.
 *
 * All week values are getters, so they continue to advance as the current date
 * changes. Approximate values (for example a trimester or `20+3`) are converted
 * into a representative term date when assigned.
 */
export class PregnancySpan {
  private _calculatedTerm: Date
  private _approx = ''

  constructor(value: Date | string) {
    this._calculatedTerm = new Date()

    if (value instanceof Date) {
      this.calculatedTerm = value
    }
    else {
      this.approx = value
    }
  }

  get calculatedTerm(): Date {
    return new Date(this._calculatedTerm.getTime())
  }

  set calculatedTerm(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError('The calculated term must be a valid date.')
    }

    this._calculatedTerm = new Date(value.getTime())
    this._approx = ''
  }

  /** Alias for consumers that use the shorter domain name. */
  get termDate(): Date {
    return this.calculatedTerm
  }

  set termDate(value: Date) {
    this.calculatedTerm = value
  }

  get approx(): string {
    return this._approx
  }

  set approx(value: string) {
    const normalized = value.trim()
    const approximateWeek = APPROXIMATE_WEEK[normalized as PregnancyTrimester] ?? normalized
    const gestationDays = parseWeek(approximateWeek)

    if (gestationDays === null) {
      throw new RangeError(`Unknown pregnancy approximation: ${value}`)
    }

    this._calculatedTerm = addCalendarDays(new Date(), PREGNANCY_DAYS_AT_TERM - gestationDays)
    this._approx = normalized
  }

  get isApproximate(): boolean {
    return this._approx !== ''
  }

  /** Completed gestational days, calculated from today's calendar date. */
  get totalDays(): number {
    const daysUntilTerm = Math.round(
      (calendarDay(this._calculatedTerm) - calendarDay(new Date())) / 86_400_000,
    )
    return PREGNANCY_DAYS_AT_TERM - daysUntilTerm
  }

  /** Gestational age as decimal weeks, e.g. 20.428... for 20+3. */
  get total(): number {
    return this.totalDays / DAYS_PER_WEEK
  }

  get totalWeeks(): number {
    return this.total
  }

  /** Gestational age in obstetric notation, e.g. `20+3`. */
  get week(): string {
    const completedWeeks = Math.floor(this.totalDays / DAYS_PER_WEEK)
    const days = this.totalDays - completedWeeks * DAYS_PER_WEEK
    return `${completedWeeks}+${days}`
  }

  set week(value: string) {
    this.approx = value
  }

  get formattedWeek(): string {
    return this.week
  }

  public setApprox(value: string): void {
    this.approx = value
  }

  public clone(): PregnancySpan {
    const clone = new PregnancySpan(this._calculatedTerm)
    clone._approx = this._approx
    return clone
  }

  public toString(): string {
    return this.week
  }
}
