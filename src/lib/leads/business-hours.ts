/**
 * Business-hours arithmetic for FR22 (SLA alert): Mon-Fri, 09:00-18:00,
 * America/Sao_Paulo. Brazil has used a fixed UTC-3 offset with no DST since
 * 2019, so a constant offset is correct here — revisit if that ever
 * changes (or if the business expands to a DST-observing region).
 */
const TIMEZONE_OFFSET_MS = -3 * 60 * 60 * 1000
const BUSINESS_START_HOUR = 9
const BUSINESS_END_HOUR = 18
const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

function isBusinessWeekday(localMidnightMs: number): boolean {
  const day = new Date(localMidnightMs).getUTCDay()
  return day >= 1 && day <= 5
}

/**
 * Hours elapsed between `from` and `to` that fall within business hours.
 * Returns 0 when `to` is not after `from`.
 */
export function businessHoursElapsed(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) return 0

  const shiftedFrom = from.getTime() + TIMEZONE_OFFSET_MS
  const shiftedTo = to.getTime() + TIMEZONE_OFFSET_MS

  let totalMs = 0
  let dayStart = Math.floor(shiftedFrom / MS_PER_DAY) * MS_PER_DAY
  const lastDayStart = Math.floor(shiftedTo / MS_PER_DAY) * MS_PER_DAY

  while (dayStart <= lastDayStart) {
    if (isBusinessWeekday(dayStart)) {
      const windowStart = dayStart + BUSINESS_START_HOUR * MS_PER_HOUR
      const windowEnd = dayStart + BUSINESS_END_HOUR * MS_PER_HOUR
      const overlapStart = Math.max(windowStart, shiftedFrom)
      const overlapEnd = Math.min(windowEnd, shiftedTo)
      if (overlapEnd > overlapStart) totalMs += overlapEnd - overlapStart
    }
    dayStart += MS_PER_DAY
  }

  return totalMs / MS_PER_HOUR
}
