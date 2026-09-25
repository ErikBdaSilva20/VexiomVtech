export function formatMonth(month: unknown) {
  const [year, m] = String(month).split("-")
  return m + "/" + year.slice(2)
}
