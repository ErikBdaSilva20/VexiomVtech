/**
 * Shared America/Sao_Paulo time constants. Brazil has used a fixed UTC-3
 * offset with no DST since 2019, so a constant offset is correct — revisit
 * if that ever changes (or if the business expands to a DST-observing
 * region). Used by `business-hours.ts` (SLA calc) and
 * `get-daily-agenda-alerts.ts` ("today" boundary).
 */
export const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000
export const MS_PER_HOUR = 60 * 60 * 1000
export const MS_PER_DAY = 24 * MS_PER_HOUR

/** The UTC instant of the start of the next local day (i.e. the exclusive upper bound for "today or earlier"). */
export function startOfNextLocalDay(now: Date): Date {
  const shifted = now.getTime() + SAO_PAULO_OFFSET_MS
  const localMidnight = Math.floor(shifted / MS_PER_DAY) * MS_PER_DAY
  return new Date(localMidnight + MS_PER_DAY - SAO_PAULO_OFFSET_MS)
}

/** The UTC instant of local midnight for a "YYYY-MM-DD" calendar date. */
export function startOfLocalDay(dateStr: string): Date {
  const utcMidnight = Date.parse(`${dateStr}T00:00:00.000Z`)
  return new Date(utcMidnight - SAO_PAULO_OFFSET_MS)
}

/** The "YYYY-MM-DD" local calendar date for a given instant. */
export function localDateString(date: Date): string {
  return new Date(date.getTime() + SAO_PAULO_OFFSET_MS).toISOString().slice(0, 10)
}

/** The "YYYY-MM" local calendar month for a given instant. */
export function localMonthString(date: Date): string {
  return new Date(date.getTime() + SAO_PAULO_OFFSET_MS).toISOString().slice(0, 7)
}
