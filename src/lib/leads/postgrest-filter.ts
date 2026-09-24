/**
 * Escapes a free-text value for safe interpolation into a PostgREST
 * `.or("col.ilike.%value%,...")` filter expression.
 *
 * PostgREST's filter grammar treats `,` as a condition separator, `(`/`)` as
 * grouping, and `.` as the column/operator separator; `ilike` additionally
 * treats `%`/`_` as pattern wildcards. Per PostgREST's documented escaping
 * rules, any of these can be escaped with a leading backslash so the value
 * is matched literally instead of altering the filter's structure or
 * pattern. Backslash itself is escaped first so an attacker-controlled
 * trailing backslash can't "consume" the character this function appends
 * next.
 */
export function escapeIlikeOrFilterValue(value: string): string {
  return value.replace(/[\\,.()%_]/g, (char) => `\\${char}`)
}
