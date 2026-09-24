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
