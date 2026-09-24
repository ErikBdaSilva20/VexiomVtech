/**
 * `financial_transactions.amount` is `numeric(12,2)` — summing JS floats
 * directly can drift by fractions of a cent across many rows, which is
 * unacceptable for money. Convert to integer cents, accumulate, convert
 * back only at the final read. Shared by every finance aggregation
 * (`get-financial-balance.ts`, `get-financial-charts.ts`) so the rounding
 * rule only has one place to change.
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}
